/* =====================================================
   CONFIGURATION FIREBASE
   Remplacez par vos propres valeurs depuis la console Firebase
   ===================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyCBOP15Omhn96aRNVsOm-InfcM7YscAkjE",
    authDomain: "test-c59b4.firebaseapp.com",
    databaseURL: "https://test-c59b4-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "test-c59b4",
    storageBucket: "test-c59b4.firebasestorage.app",
    messagingSenderId: "249535021863",
    appId: "1:249535021863:web:43b75f582080b3ee82df02"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const chatRef = db.ref('chat/messages');

/* =====================================================
   CODES D'AUTHENTIFICATION & RÔLES
   Modifiez ces codes selon vos besoins
   ===================================================== */
const AUTH_CODES = {
  'ADMIN123': { role: 'admin', label: '👑 Admin' },
  'MOD456':   { role: 'moderator', label: '🛡️ Modérateur' },
  'USER789':  { role: 'visitor', label: '👤 Visiteur' }
};

/* =====================================================
   VARIABLES GLOBALES
   ===================================================== */
let currentUser = null;
let authTimeout = null;

/* =====================================================
   ÉLÉMENTS DOM
   ===================================================== */
const authScreen = document.getElementById('authScreen');
const chatScreen = document.getElementById('chatScreen');
const authCodeInput = document.getElementById('authCode');
const authBtn = document.getElementById('authBtn');
const authError = document.getElementById('authError');
const userNameDisplay = document.getElementById('userNameDisplay');
const userRoleBadge = document.getElementById('userRoleBadge');
const logoutBtn = document.getElementById('logoutBtn');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

/* =====================================================
   AUTHENTIFICATION AVEC FIREBASE AUTH
   ===================================================== */
async function loginWithCode(code) {
  const authData = AUTH_CODES[code];
  if (!authData) {
    authError.textContent = 'Code invalide';
    return false;
  }

  try {
    // 1️⃣ Se connecter anonymement à Firebase Auth
    const userCredential = await auth.signInAnonymously();
    const userId = userCredential.user.uid;

    // 2️⃣ Générer un pseudo basé sur le rôle
    const pseudo = `${authData.role.charAt(0).toUpperCase() + authData.role.slice(1)}_${Math.floor(Math.random() * 1000)}`;

    // 3️⃣ Stocker les informations utilisateur dans la base
    await db.ref(`users/${userId}`).set({
      username: pseudo,
      role: authData.role,
      label: authData.label,
      code: code,
      createdAt: Date.now(),
      lastSeen: Date.now()
    });

    // 4️⃣ Mettre à jour l'utilisateur courant
    currentUser = {
      uid: userId,
      role: authData.role,
      label: authData.label,
      username: pseudo
    };

    // 5️⃣ Sauvegarder localement (session uniquement)
    sessionStorage.setItem('chatUser', JSON.stringify(currentUser));

    // 6️⃣ Basculer l'interface
    authScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    updateUserInfo();

    // 7️⃣ Démarrer le timer d'inactivité
    resetActivityTimer();

    return true;
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    authError.textContent = 'Erreur de connexion: ' + error.message;
    return false;
  }
}

function logout() {
  auth.signOut().then(() => {
    currentUser = null;
    sessionStorage.removeItem('chatUser');
    clearTimeout(authTimeout);
    chatScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    authCodeInput.value = '';
    authError.textContent = '';
  }).catch(error => {
    console.error('Erreur de déconnexion:', error);
  });
}

function updateUserInfo() {
  if (!currentUser) return;
  userNameDisplay.textContent = currentUser.username;
  userRoleBadge.textContent = currentUser.label;
  userRoleBadge.className = `role-badge ${currentUser.role}`;
}

/* =====================================================
   TIMER D'INACTIVITÉ (déconnexion automatique)
   ===================================================== */
function resetActivityTimer() {
  clearTimeout(authTimeout);
  authTimeout = setTimeout(() => {
    if (currentUser) {
      logout();
      alert('Session expirée par inactivité (30 minutes)');
    }
  }, 30 * 60 * 1000); // 30 minutes
}

// Mettre à jour le timer à chaque activité utilisateur
['click', 'keypress', 'scroll', 'mousemove'].forEach(eventType => {
  document.addEventListener(eventType, resetActivityTimer);
});

/* =====================================================
   CHAT - ENVOI DE MESSAGE
   ===================================================== */
function sendMessage() {
  const txt = chatInput.value.trim();
  if (!txt || !currentUser) return;

  const newMsg = {
    text: txt,
    username: currentUser.username,
    role: currentUser.role,
    uid: currentUser.uid,
    timestamp: Date.now()
  };

  chatRef.push(newMsg)
    .then(() => {
      chatInput.value = '';
      chatInput.focus();
      
      // Mettre à jour lastSeen
      if (currentUser) {
        db.ref(`users/${currentUser.uid}/lastSeen`).set(Date.now());
      }
    })
    .catch(err => {
      console.error('Erreur d\'envoi:', err);
      alert('Erreur lors de l\'envoi du message');
    });
}

/* =====================================================
   CHAT - AFFICHAGE EN TEMPS RÉEL
   ===================================================== */
chatRef.on('value', snap => {
  const raw = snap.val();
  const msgs = raw ? Object.values(raw) : [];

  chatWindow.innerHTML = '';

  msgs.forEach(m => {
    const div = document.createElement('div');
    div.className = `chat-msg ${m.role}`;

    // Formatage de l'heure
    const time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    // Message HTML avec pseudo, rôle et texte
    div.innerHTML = `
      <div class="msg-header">
        <span class="msg-user">${escapeHtml(m.username)}</span>
        <span class="msg-role">${getRoleLabel(m.role)}</span>
        <span class="msg-time">${time}</span>
      </div>
      <div class="msg-text">${escapeHtml(m.text)}</div>
    `;

    chatWindow.appendChild(div);
  });

  // Scroll automatique vers le bas
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

/* =====================================================
   UTILITAIRES
   ===================================================== */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getRoleLabel(role) {
  switch(role) {
    case 'admin': return '👑 Admin';
    case 'moderator': return '🛡️ Modérateur';
    default: return '👤 Visiteur';
  }
}

/* =====================================================
   ÉVÉNEMENTS
   ===================================================== */
authBtn.addEventListener('click', () => {
  const code = authCodeInput.value.trim();
  if (!code) {
    authError.textContent = 'Veuillez entrer un code';
    return;
  }
  loginWithCode(code);
});

authCodeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') authBtn.click();
});

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

logoutBtn.addEventListener('click', logout);

/* =====================================================
   VÉRIFICATION AU CHARGEMENT
   ===================================================== */
window.addEventListener('load', () => {
  // Vérifier si l'utilisateur est déjà connecté via Firebase Auth
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Utilisateur connecté, récupérer ses infos
      try {
        const snapshot = await db.ref(`users/${user.uid}`).once('value');
        const userData = snapshot.val();
        
        if (userData) {
          currentUser = {
            uid: user.uid,
            username: userData.username,
            role: userData.role,
            label: userData.label
          };
          
          // Mettre à jour lastSeen
          db.ref(`users/${user.uid}/lastSeen`).set(Date.now());
          
          // Mettre à jour l'interface
          authScreen.classList.add('hidden');
          chatScreen.classList.remove('hidden');
          updateUserInfo();
          resetActivityTimer();
        }
      } catch (error) {
        console.error('Erreur de récupération des données:', error);
      }
    }
  });
});
