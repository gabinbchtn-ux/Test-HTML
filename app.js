/*   CONFIGURATION FIREBASE
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const chatRef = db.ref('chat/messages');

/* =====================================================
   CODES D'AUTHENTIFICATION & RÔLES
   Modifiez ces codes selon vos besoins
   ===================================================== */
const AUTH_CODES = {
  '89735786637893486': { role: 'admin', label: '👑 Admin' },
  'MOD020':   { role: 'moderator', label: '🛡️ Modérateur' },
  'USER843':  { role: 'visitor', label: '👤 Visiteur' }
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
   AUTHENTIFICATION
   ===================================================== */
function authenticate(code) {
  const authData = AUTH_CODES[code];
  if (!authData) {
    authError.textContent = 'Tu te trompe :)';
    return false;
  }

  // Générer un pseudo basé sur le rôle et un nombre aléatoire
  const pseudo = `${authData.role.charAt(0).toUpperCase() + authData.role.slice(1)}_${Math.floor(Math.random() * 1000)}`;

  currentUser = {
    code: code,
    role: authData.role,
    label: authData.label,
    username: pseudo
  };

  // Sauvegarder localement (session uniquement)
  sessionStorage.setItem('chatUser', JSON.stringify(currentUser));

  // Masquer écran auth, montrer chat
  authScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');

  // Mettre à jour l'interface
  updateUserInfo();

  // Redémarrer le timer d'inactivité
  resetActivityTimer();

  return true;
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('chatUser');
  clearTimeout(authTimeout);
  chatScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
  authCodeInput.value = '';
  authError.textContent = '';
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
      alert('Session expirée par inactivité');
    }
  }, 30 * 60 * 1000); // 30 minutes
}

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
    timestamp: Date.now()
  };

  chatRef.push(newMsg)
    .then(() => {
      chatInput.value = '';
      chatInput.focus();
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
  if (!authenticate(code)) {
    authCodeInput.value = '';
    authCodeInput.focus();
  }
});

authCodeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') authBtn.click();
});

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

logoutBtn.addEventListener('click', logout);

// Timer d'inactivité
setInterval(resetActivityTimer, 60000);

/* =====================================================
   VÉRIFICATION AU CHARGEMENT
   ===================================================== */
window.addEventListener('load', () => {
  const savedUser = sessionStorage.getItem('chatUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      // Vérifier que le code est toujours valide
      if (AUTH_CODES[currentUser.code]) {
        authScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        updateUserInfo();
        resetActivityTimer();
      }
    } catch(e) {
      console.error('Erreur de session:', e);
    }
  }
});
