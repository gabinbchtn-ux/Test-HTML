/* =====================================================
   CONFIGURATION FIREBASE
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
   ===================================================== */
const AUTH_CODES = {
    '89735786637893486': { role: 'admin', label: '👑 Admin' },
    'MOD020': { role: 'moderator', label: '🛡️ Modérateur' },
    'USER843': { role: 'visitor', label: '👤 Visiteur' },
    '0000': { role: 'task', label: 'Testeur' }
};

/* =====================================================
   VARIABLES GLOBALES
   ===================================================== */
let currentUser = null;
let authTimeout = null;

// Variables Morse
let pressStartTime = 0;
let currentMorse = "";
let currentLetter = "";
let decodedMessage = "";
const DOT_DURATION = 300;

const morseTable = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z',
    '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5',
    '-....': '6', '--...': '7', '---..': '8', '----.': '9', '-----': '0',
    '/': ' '
};

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
const sendBtn2 = document.getElementById('sendBtn2');

// Éléments Morse
const morseBtn = document.getElementById('morseBtn');
const morseDisplay = document.getElementById('morseDisplay');
const messagePreview = document.getElementById('messagePreview');
const clearBtn = document.getElementById('clearBtn');
const sendBtn = document.getElementById('sendBtn');

/* =====================================================
   AUTHENTIFICATION
   ===================================================== */
function authenticate(code) {
    const authData = AUTH_CODES[code];
    if (!authData) {
        authError.textContent = 'Tu te trompes :)';
        return false;
    }

    const pseudo = `$${authData.role.charAt(0).toUpperCase() + authData.role.slice(1)}_$${Math.floor(Math.random() * 1000)}`;

    currentUser = {
        code: code,
        role: authData.role,
        label: authData.label,
        username: pseudo
    };

    sessionStorage.setItem('chatUser', JSON.stringify(currentUser));

    authScreen.classList.remove('active');
    authScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    chatScreen.classList.add('active');

    updateUserInfo();
    resetActivityTimer();

    return true;
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('chatUser');
    clearTimeout(authTimeout);
    chatScreen.classList.remove('active');
    chatScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    authScreen.classList.add('active');
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
   TIMER D'INACTIVITÉ
   ===================================================== */
function resetActivityTimer() {
    clearTimeout(authTimeout);
    authTimeout = setTimeout(() => {
        if (currentUser) {
            logout();
            alert('Session expirée par inactivité');
        }
    }, 30 * 60 * 1000);
}

/* =====================================================
   CHAT - ENVOI DE MESSAGE
   ===================================================== */
function sendMessage(text) {
    if (!text || !currentUser) return;

    const newMsg = {
        text: text,
        username: currentUser.username,
        role: currentUser.role,
        timestamp: Date.now()
    };

    chatRef.push(newMsg)
        .then(() => {
            console.log('Message envoyé');
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

        const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    switch (role) {
        case 'admin': return '👑 Admin';
        case 'moderator': return '🛡️ Modérateur';
        case 'task': return '🧪 Testeur';
        default: return '👤 Visiteur';
    }
}

/* =====================================================
   LOGIQUE MORSE
   ===================================================== */
function startPress(e) {
    e.preventDefault();
    pressStartTime = Date.now();
    morseBtn.style.background = '#0056b3';
}

function endPress(e) {
    e.preventDefault();
    const pressDuration = Date.now() - pressStartTime;
    morseBtn.style.background = '';

    if (pressDuration < DOT_DURATION) {
        currentLetter += '.';
        currentMorse += '• ';
    } else {
        currentLetter += '-';
        currentMorse += '– ';
    }

    updateMorseDisplay();

    setTimeout(() => {
        if (currentLetter.length > 0) {
            decodeLetter();
        }
    }, 1000);
}

function decodeLetter() {
    if (currentLetter in morseTable) {
        const letter = morseTable[currentLetter];
        decodedMessage += letter;
        currentMorse += letter + ' ';
    }
    currentLetter = "";
    updateMorseDisplay();
}

function updateMorseDisplay() {
    if (morseDisplay) morseDisplay.textContent = currentMorse.trim();
    if (messagePreview) messagePreview.textContent = "Message: " + (decodedMessage || "En attente...");
}

function clearMorse() {
    currentMorse = "";
    currentLetter = "";
    decodedMessage = "";
    updateMorseDisplay();
}

function sendMorseMessage() {
    if (!decodedMessage) {
        alert("⚠️ Aucun message à envoyer");
        return;
    }
    sendMessage(decodedMessage);
    clearMorse();
}

/* =====================================================
   ÉVÉNEMENTS
   ===================================================== */
// Auth
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

// Chat input
sendBtn2.addEventListener('click', () => {
    const txt = chatInput.value.trim();
    if (txt) {
        sendMessage(txt);
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const txt = chatInput.value.trim();
        if (txt) {
            sendMessage(txt);
            chatInput.value = '';
        }
    }
});

// Morse
morseBtn.addEventListener('mousedown', startPress);
morseBtn.addEventListener('mouseup', endPress);
morseBtn.addEventListener('mouseleave', endPress);
morseBtn.addEventListener('touchstart', startPress, { passive: false });
morseBtn.addEventListener('touchend', endPress, { passive: false });

clearBtn.addEventListener('click', clearMorse);
sendBtn.addEventListener('click', sendMorseMessage);

logoutBtn.addEventListener('click', logout);

// Timer
setInterval(resetActivityTimer, 60000);

/* =====================================================
   VÉRIFICATION AU CHARGEMENT
   ===================================================== */
window.addEventListener('load', () => {
    const savedUser = sessionStorage.getItem('chatUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (AUTH_CODES[currentUser.code]) {
                authScreen.classList.remove('active');
                authScreen.classList.add('hidden');
                chatScreen.classList.remove('hidden');
                chatScreen.classList.add('active');
                updateUserInfo();
                resetActivityTimer();
            }
        } catch (e) {
            console.error('Erreur de session:', e);
        }
    }
});
