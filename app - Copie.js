// ==================== CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyCBOP15Omhn96aRNVsOm-InfcM7YscAkjE",
  authDomain: "test-c59b4.firebaseapp.com",
  databaseURL: "https://test-c59b4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "test-c59b4",
  storageBucket: "test-c59b4.firebasestorage.app",
  messagingSenderId: "249535021863",
  appId: "1:249535021863:web:43b75f582080b3ee82df02"
};

// ==================== VARIABLES ====================
let ref = null;
let db = null;
let isConnected = false;

let pressStartTime = 0;
let currentMorse = "";
let currentLetter = "";
let decodedMessage = "";

const DOT_DURATION = 300; // ms pour considérer un point

// Tableau Morse (lettres + chiffres)
const morseTable = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z',
    '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5',
    '-....': '6', '--...': '7', '---..': '8', '----.': '9', '-----': '0',
    '/': ' '  // Espace entre mots
};

// ==================== INITIALISATION ====================
function initFirebase() {
    try {
        db = firebase.initializeApp(firebaseConfig);
        ref = firebase.database().ref('messages');
        
        // Écouter la connexion
        const connectedRef = firebase.database().ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            if (snapshot.val() === true) {
                isConnected = true;
                updateConnectionStatus(true);
            } else {
                isConnected = false;
                updateConnectionStatus(false);
            }
        });
        
        console.log("✅ Firebase connecté");
    } catch (error) {
        console.error("❌ Erreur Firebase:", error);
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    if (connected) {
        statusEl.textContent = "🟢 Connecté à Firebase";
        statusEl.className = "status connected";
    } else {
        statusEl.textContent = "🔴 Déconnecté de Firebase";
        statusEl.className = "status disconnected";
    }
}

// ==================== LOGIQUE MORSE ====================
function startPress(e) {
    e.preventDefault();
    pressStartTime = Date.now();
    document.getElementById('morseBtn').style.background = '#0056b3';
}

function endPress(e) {
    e.preventDefault();
    const pressDuration = Date.now() - pressStartTime;
    document.getElementById('morseBtn').style.background = '';
    
    if (pressDuration < DOT_DURATION) {
        // Point
        currentLetter += '.';
        currentMorse += '• ';
    } else {
        // Tiret
        currentLetter += '-';
        currentMorse += '– ';
    }
    
    updateDisplay();
    
    // Vérifier si lettre terminée (pause détectée)
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
    updateDisplay();
}

function updateDisplay() {
    document.getElementById('morseDisplay').textContent = currentMorse.trim();
    document.getElementById('messageDisplay').textContent = "Message: " + (decodedMessage || "En attente...");
}

// ==================== ENVOI FIREBASE ====================
function sendMessage() {
    if (!isConnected || !ref) {
        alert("❌ Firebase non connecté");
        return;
    }
    
    if (!decodedMessage) {
        alert("⚠️ Aucun message à envoyer");
        return;
    }
    
    const timestamp = new Date().toISOString();
    const messageData = {
        morse: currentMorse,
        text: decodedMessage,
        timestamp: timestamp,
        sender: navigator.userAgent.substring(0, 50)
    };
    
    ref.push(messageData)
        .then(() => {
            alert("✅ Message envoyé !");
            clearAll();
        })
        .catch((error) => {
            console.error(error);
            alert("❌ Erreur d'envoi: " + error.message);
        });
}

function clearAll() {
    currentMorse = "";
    currentLetter = "";
    decodedMessage = "";
    updateDisplay();
}

// ==================== ÉVÉNEMENTS ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser Firebase
    initFirebase();
    
    // Événements souris
    const btn = document.getElementById('morseBtn');
    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('mouseup', endPress);
    btn.addEventListener('mouseleave', endPress);
    
    // Événements tactile (mobile)
    btn.addEventListener('touchstart', startPress, { passive: false });
    btn.addEventListener('touchend', endPress, { passive: false });
    
    // Boutons de contrôle
    document.getElementById('clearBtn').addEventListener('click', clearAll);
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('settingsBtn').addEventListener('click', () => {
        const panel = document.getElementById('configPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Initialiser l'affichage
    updateDisplay();
});

// Sauvegarde configuration
function saveConfig() {
    const config = {
        apiKey: document.getElementById('apiKey').value,
        authDomain: document.getElementById('authDomain').value,
        projectId: document.getElementById('projectId').value,
        storageBucket: document.getElementById('storageBucket').value,
        messagingSenderId: document.getElementById('messagingSenderId')?.value,
        appId: document.getElementById('appId')?.value
    };
    
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    alert("✅ Configuration sauvegardée ! Rechargez la page.");
}

// Charger config sauvegardée
window.onload = function() {
    const saved = localStorage.getItem('firebaseConfig');
    if (saved) {
        const config = JSON.parse(saved);
        Object.assign(firebaseConfig, config);
    }
};
