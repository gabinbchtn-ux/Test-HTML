* =========================================================
   0️⃣ CONFIGURATION FIREBASE (à remplacer par vos valeurs)
   ========================================================= */
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

/* =========================================================
   1️⃣ Référence au nœud de la Realtime Database
   ========================================================= */
const chatRef = db.ref('chat/messages');

/* =========================================================
   2️⃣ DOMContentLoaded – logique UI du chat
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ------------------- Éléments du DOM ------------------- */
  const userPseudoInput = document.getElementById('userPseudo');
  const chatWindow = document.getElementById('chatWindow');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  /* ------------------- Écoute en temps réel des messages ------------------- */
  chatRef.on('value', snap => {
    const raw = snap.val();
    const msgs = raw ? Object.values(raw) : [];
    chatWindow.innerHTML = '';

    msgs.forEach(m => {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      const time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      // Affichage avec pseudo et message
      div.textContent = `${time} – ${m.pseudo}: ${m.text}`;
      chatWindow.appendChild(div);
    });

    // Scroll automatique vers le bas
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });

  /* ------------------- Envoi d'un nouveau message ------------------- */
  sendBtn.addEventListener('click', () => {
    const txt = chatInput.value.trim();
    const pseudo = userPseudoInput.value.trim();

    if (!txt) return;
    if (!pseudo) {
      alert('Veuillez entrer un pseudo avant d\'envoyer un message.');
      return;
    }

    const newMsg = {
      pseudo: pseudo,
      text: txt,
      timestamp: Date.now()
    };

    chatRef.push(newMsg)
      .then(() => { 
        chatInput.value = ''; 
      })
      .catch(err => console.error('Erreur d\'envoi du message:', err));
  });

  /* ------------------- Envoi avec la touche Entrée ------------------- */
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendBtn.click();
    }
  });

}); // ← fin DOMContentLoaded

