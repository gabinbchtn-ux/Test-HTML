// ==================== CONFIGURATION FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyCBOP15Omhn96aRNVsOm-InfcM7YscAkjE",
    authDomain: "test-c59b4.firebaseapp.com",
    databaseURL: "https://test-c59b4-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "test-c59b4",
    storageBucket: "test-c59b4.firebasestorage.app",
    messagingSenderId: "249535021863",
    appId: "1:249535021863:web:43b75f582080b3ee82df02"
};

// ==================== INITIALISATION ====================
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const messagesRef = db.ref('morse_messages');

// ==================== VARIABLES ====================
let isConnected = false;
let pressStartTime = 0;
let currentMorse = "";
let currentLetter = "";
let decodedMessage = "";
let isPressing = false;

const LONG_THRESHOLD = 2000; // 2 secondes pour long

// Tableau Morse
const morseTable = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z',
    '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5',
    '-....': '6', '--...': '7', '---..': '8', '----.': '9', '-----': '0'
};

// ==================== ÉLÉMENTS DOM ====================
const topArea = document.getElementById('topArea');
const bottomArea = document.getElementById('bottomArea');
const morseOutput = document.getElementById('morseOutput');
const textOutput = document.getElementById('textOutput');
const clearBtn = document.getElementById('clearBtn');
const sendBtn = document.getElementById('sendBtn');
const chatWindow = document.getElementById('chatWindow');
const statusDiv = document.getElementById('status');

// ==================== STATUS FIREBASE ====================
db.ref('.info/connected').on('value', (snapshot) => {
    isConnected = snapshot.val();
    if (isConnected) {
        statusDiv.textContent = "🟢 Connecté à Firebase";
        statusDiv.className = "status connected";
    } else {
        statusDiv.textContent = "🔴 Déconnecté";
        statusDiv.className = "status disconnected";
    }
});

// ==================== FONCTIONS MORSE ====================
function startPress(area) {
    isPressing = true;
    pressStartTime = Date.now();
    area.style.opacity = "0.7";
}

function endPress(area) {
    if (!isPressing) return;
    isPressing = false;
    area.style.opacity = "1";
    
    const duration = Date.now() - pressStartTime;
    
    if (duration < LONG_THRESHOLD) {
        // Court = Point
        currentLetter += '.';
        currentMorse += '• ';
        console.log("Point (•) - Durée: " + duration + "ms");
    } else {
        // Long = Tiret
        currentLetter += '-';
        currentMorse += '– ';
        console.log("Tiret (–) - Durée: " + duration + "ms");
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
        console.log("Décodé: " + letter);
    }
    currentLetter = "";
    updateDisplay();
}

function updateDisplay() {
    morseOutput.textContent = currentMorse.trim();
    textOutput.textContent = "Message: " + (decodedMessage || "...");
}

function clearAll() {
    currentMorse = "";
    currentLetter = "";
    decodedMessage = "";
    updateDisplay();
}

function sendMessage() {
    if (!decodedMessage) {
        alert("⚠️ Rien à envoyer !");
        return;
    }
    
    if (!isConnected) {
        alert("❌ Non connecté à Firebase");
        return;
    }
    
    const messageData = {
        morse: currentMorse,
        text: decodedMessage,
        timestamp: Date.now(),
        userAgent: navigator.userAgent.substring(0, 50)
    };
    
    messagesRef.push(messageData)
        .then(() => {
            console.log("Message envoyé !");
            clearAll();
        })
        .catch((error) => {
            console.error("Erreur:", error);
            alert("❌ Erreur: " + error.message);
        });
}

// ==================== ÉVÉNEMENTS ====================
// Top area (court)
topArea.addEventListener('mousedown', () => startPress(topArea));
topArea.addEventListener('mouseup', () => endPress(topArea));
topArea.addEventListener('mouseleave', () => endPress(topArea));
topArea.addEventListener('touchstart', (e) => { e.preventDefault(); startPress(topArea); });
topArea.addEventListener('touchend', (e) => { e.preventDefault(); endPress(topArea); });

// Bottom area (long)
bottomArea.addEventListener('mousedown', () => startPress(bottomArea));
bottomArea.addEventListener('mouseup', () => endPress(bottomArea));
bottomArea.addEventListener('mouseleave', () => endPress(bottomArea));
bottomArea.addEventListener('touchstart', (e) => { e.preventDefault(); startPress(bottomArea); });
bottomArea.addEventListener('touchend', (e) => { e.preventDefault(); endPress(bottomArea); });

// Boutons
clearBtn.addEventListener('click', clearAll);
sendBtn.addEventListener('click', sendMessage);

// ==================== CHAT EN TEMPS RÉEL ====================
messagesRef.limitToLast(20).on('value', (snapshot) => {
    chatWindow.innerHTML = "";
    const messages = snapshot.val();
    
    if (messages) {
        Object.values(messages).forEach(msg => {
            const div = document.createElement('div');
            div.className = "chat-msg";
            
            const time = new Date(msg.timestamp).toLocaleTimeString();
            
            div.innerHTML = `
                <div class="sender">Morse • ${time}</div>
                <div class="text"><strong>${msg.text}</strong></div>
                <div style="font-size:11px;color:#999;margin-top:3px">${msg.morse}</div>
            `;
            
            chatWindow.appendChild(div);
        });
        
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});

// ==================== DÉMARRAGE ====================
updateDisplay();
console.log("✅ Morse Chat prêt !");
