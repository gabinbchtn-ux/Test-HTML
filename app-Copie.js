// ==================== DEBUG ====================
function logDebug(message) {
    const debugEl = document.getElementById('debugText');
    if (debugEl) {
        debugEl.textContent = `[${new Date().toLocaleTimeString()}] ${message}\n` + debugEl.textContent;
    }
    console.log('[MORSE]', message);
}

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

const DOT_DURATION = 300;

// Tableau Morse
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

// ==================== INITIALISATION ====================
function initFirebase() {
    logDebug("Initialisation Firebase...");
    
    // Vérifier si Firebase est chargé
    if (typeof firebase === 'undefined') {
        logDebug("ERREUR: Firebase SDK non chargé!");
        return;
    }
    
    // Vérifier config
    if (firebaseConfig.apiKey === "VOTRE_API_KEY_ICI") {
        logDebug("ATTENTION: Configuration Firebase non modifiée!");
        logDebug("Connectez-vous à Firebase Console pour obtenir vos clés");
    }
    
    try {
        db = firebase.initializeApp(firebaseConfig);
        ref = firebase.database().ref('messages');
        
        logDebug("Firebase initialisé avec succès");
        
        // Écouter la connexion
        const connectedRef = firebase.database().ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            if (snapshot.val() === true) {
                isConnected = true;
                logDebug("Connecté à Firebase");
                updateConnectionStatus(true);
            } else {
                isConnected = false;
                logDebug("Déconnecté de Firebase");
                updateConnectionStatus(false);
            }
        });
    } catch (error) {
        logDebug("ERREUR Firebase: " + error.message);
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        if (connected) {
            statusEl.textContent = "🟢 Connecté à Firebase";
            statusEl.className = "status connected";
        } else {
            statusEl.textContent = "🔴 Déconnecté de Firebase";
            statusEl.className = "status disconnected";
        }
    }
}

// ==================== LOGIQUE MORSE ====================
function startPress(e) {
    e.preventDefault();
    pressStartTime = Date.now();
    logDebug("Appui commencé");
    const btn = document.getElementById('morseBtn');
    if (btn) btn.style.background = '#0056b3';
}

function endPress(e) {
    e.preventDefault();
    const pressDuration = Date.now() - pressStartTime;
    const btn = document.getElementById('morseBtn');
    if (btn) btn.style.background = '';
    
    logDebug(`Appui terminé: ${pressDuration}ms`);
    
    if (pressDuration < DOT_DURATION) {
        currentLetter += '.';
        currentMorse += '• ';
        logDebug("Point détecté (•)");
    } else {
        currentLetter += '-';
        currentMorse += '– ';
        logDebug("Tiret détecté (–)");
    }
    
    updateDisplay();
    
    // Décoder après pause
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
        logDebug(`Lettre décodée: ${letter}`);
    } else {
        logDebug(`Lettre inconnue: ${currentLetter}`);
    }
    currentLetter = "";
    updateDisplay();
}

function updateDisplay() {
    const morseEl = document.getElementById('morseDisplay');
    const msgEl = document.getElementById('messageDisplay');
    
    if (morseEl) morseEl.textContent = currentMorse.trim();
    if (msgEl) msgEl.textContent = "Message: " + (decodedMessage || "En attente...");
}

// ==================== ENVOI FIREBASE ====================
function sendMessage() {
    logDebug("Tentative d'envoi...");
    
    if (!isConnected || !ref) {
        alert("❌ Firebase non connecté");
        logDebug("Erreur: Firebase non connecté");
        return;
    }
    
    if (!decodedMessage) {
        alert("⚠️ Aucun message à envoyer");
        logDebug("Erreur: Pas de message");
        return;
    }
    
    const timestamp = new Date().toISOString();
    const messageData = {
        morse: currentMorse,
        text: decodedMessage,
        timestamp: timestamp,
        sender: "Browser"
    };
    
    logDebug("Envoi des données: " + JSON.stringify(messageData));
    
    ref.push(messageData)
        .then(() => {
            alert("✅ Message envoyé !");
            logDebug("Message envoyé avec succès");
            clearAll();
        })
        .catch((error) => {
            logDebug("ERREUR envoi: " + error.message);
            alert("❌ Erreur d'envoi: " + error.message);
        });
}

function clearAll() {
    currentMorse = "";
    currentLetter = "";
    decodedMessage = "";
    logDebug("Contenu effacé");
    updateDisplay();
}

// ==================== ÉVÉNEMENTS ====================
document.addEventListener('DOMContentLoaded', () => {
    logDebug("DOM chargé - Initialisation...");
    
    // Initialiser Firebase
    initFirebase();
    
    // Vérifier les éléments
    const btn = document.getElementById('morseBtn');
    if (!btn) {
        logDebug("ERREUR: Bouton morseBtn introuvable!");
        return;
    }
    
    logDebug("Événements attachés au bouton");
    
    // Événements souris
    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('mouseup', endPress);
    btn.addEventListener('mouseleave', endPress);
    
    // Événements tactile
    btn.addEventListener('touchstart', startPress, { passive: false });
    btn.addEventListener('touchend', endPress, { passive: false });
    
    // Boutons de contrôle
    const clearBtn = document.getElementById('clearBtn');
    const sendBtn = document.getElementById('sendBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            logDebug("Bouton Effacer cliqué");
            clearAll();
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            logDebug("Bouton Envoyer cliqué");
            sendMessage();
        });
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            logDebug("Bouton Config cliqué");
            const panel = document.getElementById('configPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    
    updateDisplay();
    logDebug("Initialisation terminée");
});

// Sauvegarde configuration
function saveConfig() {
    logDebug("Sauvegarde configuration...");
    const config = {
        apiKey: document.getElementById('apiKey').value,
        authDomain: document.getElementById('authDomain').value,
        projectId: document.getElementById('projectId').value,
        storageBucket: document.getElementById('storageBucket').value
    };
    
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    logDebug("Configuration sauvegardée");
    alert("✅ Configuration sauvegardée ! Rechargez la page.");
}

// Charger config sauvegardée
window.onload = function() {
    const saved = localStorage.getItem('firebaseConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            Object.assign(firebaseConfig, config);
            logDebug("Configuration chargée depuis localStorage");
        } catch (e) {
            logDebug("Erreur chargement config: " + e.message);
        }
    }
};
