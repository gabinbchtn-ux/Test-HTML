/* =========================================================
   0️⃣ CONFIGURATION FIREBASE (à remplacer par vos valeurs)
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyCFFI_TOzVlWX1GCAZW4tsx-Z80qqgkXpM",
    authDomain: "partage-e313d.firebaseapp.com",
    databaseURL: "https://partage-e313d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "partage-e313d",
    storageBucket: "partage-e313d.firebasestorage.app",
    messagingSenderId: "815247760270",
    appId: "1:815247760270:web:f079ba6b1a8e22439462df"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* =========================================================
   1️⃣ Références aux nœuds de la Realtime Database
   ========================================================= */
const chatRef      = db.ref('chat/messages');
const todoRef      = db.ref('todo/items');
const notesRef     = db.ref('notes/content');
const calendarRef  = db.ref('calendar/events');
const visitsRef    = db.ref('stats/visits');

/* =========================================================
   2️⃣ DOMContentLoaded – toute la logique UI
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ------------------- 1️⃣ Chat ------------------- */
  const chatWindow = document.getElementById('chatWindow');
  const chatInput  = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('sendBtn');

  // 1️⃣1️⃣ Ecoute en temps réel du nœud /chat/messages
  chatRef.on('value', snap => {
    const raw = snap.val();                         // peut être null, objet ou tableau
    const msgs = raw ? Object.values(raw) : [];     // <‑‑ conversion sûre
    chatWindow.innerHTML = '';

    msgs.forEach(m => {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      // Affichage avec heure (optionnel) :
      const time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      div.textContent = `${time} – ${m.text}`;
      chatWindow.appendChild(div);
    });

    // Scroll automatique vers le bas
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });

  // 1️⃣2️⃣ Envoi d’un nouveau message
  sendBtn.addEventListener('click', () => {
    const txt = chatInput.value.trim();
    if (!txt) return;

    const newMsg = {
      text: txt,
      timestamp: Date.now()
    };

    // push() crée une clé unique, on attend la promesse avant de vider le champ
    chatRef.push(newMsg)
      .then(() => { chatInput.value = ''; })
      .catch(err => console.error('Erreur d’envoi du chat :', err));
  });


  /* ------------------- 2️⃣ Todo‑list ------------------- */
  const newTask    = document.getElementById('newTask');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList   = document.getElementById('taskList');

  // Affichage en temps réel
  todoRef.on('value', snap => {
    const tasks = snap.val() || [];
    taskList.innerHTML = '';
    tasks.forEach((t, i) => {
      const li = document.createElement('li');
      li.textContent = t;
      li.addEventListener('click', () => {
        // Supprimer la tâche cliquée
        todoRef.once('value').then(s => {
          const arr = s.val() || [];
          arr.splice(i, 1);
          todoRef.set(arr);
        });
      });
      taskList.appendChild(li);
    });
  });

  // Ajouter une tâche
  addTaskBtn.addEventListener('click', () => {
    const txt = newTask.value.trim();
    if (!txt) return;
    todoRef.once('value').then(s => {
      const arr = s.val() || [];
      arr.push(txt);
      todoRef.set(arr);
      newTask.value = '';
    });
  });


  /* ------------------- 3️⃣ Bloc‑notes ------------------- */
  const noteArea    = document.getElementById('noteArea');
  const saveNoteBtn = document.getElementById('saveNoteBtn');

  // Charger la note au démarrage
  notesRef.once('value').then(s => {
    noteArea.innerHTML = s.val() || '';
  });

  // Sauvegarder
  saveNoteBtn.addEventListener('click', () => {
    notesRef.set(noteArea.innerHTML)
      .then(() => alert('Note enregistrée'))
      .catch(err => console.error('Erreur sauvegarde note :', err));
  });


  /* ------------------- 4️⃣ Calendrier ------------------- */
  const eventDate   = document.getElementById('eventDate');
  const eventDesc   = document.getElementById('eventDesc');
  const addEventBtn = document.getElementById('addEventBtn');
  const eventList   = document.getElementById('eventList');

  // Affichage en temps réel
  calendarRef.on('value', snap => {
    const evts = snap.val() || [];
    eventList.innerHTML = '';
    evts.forEach((e, i) => {
      const li = document.createElement('li');
      li.textContent = `${e.date} – ${e.desc}`;
      li.addEventListener('click', () => {
        // Supprimer l’événement cliqué
        calendarRef.once('value').then(s => {
          const arr = s.val() || [];
          arr.splice(i, 1);
          calendarRef.set(arr);
        });
      });
      eventList.appendChild(li);
    });
  });

  // Ajouter un événement
  addEventBtn.addEventListener('click', () => {
    if (!eventDate.value || !eventDesc.value.trim()) return;
    const newEvt = { date: eventDate.value, desc: eventDesc.value.trim() };
    calendarRef.once('value').then(s => {
      const arr = s.val() || [];
      arr.push(newEvt);
      calendarRef.set(arr);
      eventDate.value = '';
      eventDesc.value = '';
    });
  });


  /* ------------------- 7️⃣ Compteur de jours (local) ------------------- */
  const targetDate = document.getElementById('targetDate');
  const calcBtn    = document.getElementById('calcBtn');
  const resultP    = document.getElementById('result');

  calcBtn.addEventListener('click', () => {
    if (!targetDate.value) return;
    const today  = new Date();
    const target = new Date(targetDate.value);
    const diffMs = target - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) resultP.textContent = `Il reste ${diffDays} jour(s)`;
    else if (diffDays < 0) resultP.textContent = `${Math.abs(diffDays)} jour(s) déjà écoulé(s)`;
    else resultP.textContent = "C’est aujourd’hui !";
  });


  /* ------------------- 11️⃣ Recherche interne ------------------- */
  const searchBox = document.getElementById('searchBox');
  const searchRes = document.getElementById('searchResults');

  function performSearch(query) {
    const q = query.toLowerCase();
    const hits = [];

    // 1️⃣ Note
    notesRef.once('value').then(s => {
      const note = s.val() || '';
      if (note && note.toLowerCase().includes(q)) {
        hits.push({type:'Note', snippet: note.substring(0,30)+'…'});
      }

      // 2️⃣ Todo
      todoRef.once('value').then(ts => {
        (ts.val()||[]).forEach(t => {
          if (t.toLowerCase().includes(q)) hits.push({type:'Todo', snippet:t});
        });

        // 3️⃣ Events
        calendarRef.once('value').then(es => {
          (es.val()||[]).forEach(e => {
            if (e.desc.toLowerCase().includes(q) || e.date.includes(q)) {
              hits.push({type:'Événement', snippet:`${e.date} – ${e.desc}`});
            }
          });

          // Render
          searchRes.innerHTML = '';
          if (hits.length===0) {
            searchRes.innerHTML = '<li>Aucun résultat</li>';
            return;
          }
          hits.forEach(h => {
            const li = document.createElement('li');
            li.textContent = `[${h.type}] ${h.snippet}`;
            searchRes.appendChild(li);
          });
        });
      });
    });
  }

  searchBox.addEventListener('input', e => performSearch(e.target.value));


  /* ------------------- 12️⃣ Mode sombre / clair ------------------- */
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(isDark) {
    document.documentElement.dataset.theme = isDark ? 'dark' : '';
    localStorage.setItem('darkMode', isDark);
  }

  themeToggle.addEventListener('click', () => {
    const currentlyDark = document.documentElement.dataset.theme === 'dark';
    applyTheme(!currentlyDark);
  });
  applyTheme(localStorage.getItem('darkMode') === 'true');


  /* ------------------- 15️⃣ À faire ce week‑end ------------------- */
  const showWeekendBtn = document.getElementById('showWeekendBtn');
  const weekendList    = document.getElementById('weekendList');

  showWeekendBtn.addEventListener('click', () => {
    todoRef.once('value').then(s => {
      const tasks = s.val() || [];
      const filtered = tasks.filter(t =>
        /week[-\s]?end|samedi|dimanche/i.test(t)
      );
      weekendList.innerHTML = '';
      if (filtered.length===0) {
        weekendList.innerHTML = '<li>Aucune tâche prévue pour le week‑end</li>';
        return;
      }
      filtered.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        weekendList.appendChild(li);
      });
    });
  });


  /* ------------------- 17️⃣ Statistiques d’usage (visites) ------------------- */
  const visitSpan = document.getElementById('visitCount');

  // Increment atomically à chaque chargement
  visitsRef.transaction(cur => (cur || 0) + 1)
    .then(res => { visitSpan.textContent = res.snapshot.val(); })
    .catch(err => console.error('Erreur compteur visite :', err));

}); // ← fin DOMContentLoaded

