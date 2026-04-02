/* -------------------------------------------------
   Petite couche d’accès simplifiée à localStorage
------------------------------------------------- */
const LS = {
    get(key, fallback) {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

/* -------------------------------------------------
   Tout le code s’exécute après le DOM chargé
------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
   
   /* ---------- 1️⃣ Chat synchronisé avec Firebase ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const chatInput  = document.getElementById('chatInput');
    const sendBtn    = document.getElementById('sendBtn');

    // Référence à la branche "chat" de la base
    const chatRef = db.ref('chat');   // <-- `db` vient du script du <head>

    // ----- Écoute en temps réel -----
    chatRef.on('value', snapshot => {
        const msgs = snapshot.val() || [];
        chatWindow.innerHTML = '';
        msgs.forEach(m => {
            const div = document.createElement('div');
            div.className = 'chat-msg';
            div.textContent = m;
            chatWindow.appendChild(div);
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });

    // ----- Envoi d’un nouveau message -----
    sendBtn.addEventListener('click', () => {
        const txt = chatInput.value.trim();
        if (!txt) return;

        // On récupère la liste actuelle, on y ajoute le nouveau texte, puis on la ré‑écrit
        chatRef.once('value')
            .then(snap => {
                const msgs = snap.val() || [];
                msgs.push(txt);
                return chatRef.set(msgs);
            })
            .then(() => {
                chatInput.value = '';
            })
            .catch(err => console.error('Erreur Firebase :', err));
    });

    /* -----------------------------------------------------------------
       Le reste de votre script (todo‑list, notes, calendrier, etc.)
       peut rester exactement comme avant – il utilise toujours localStorage.
       ----------------------------------------------------------------- */

    /* ------------------- TODO LIST (exemple) ----------------------- */
    const newTask   = document.getElementById('newTask');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList   = document.getElementById('taskList');

    function renderTasks() {
        const tasks = LS.get('tasks', []);
        taskList.innerHTML = '';
        tasks.forEach((t, i) => {
            const li = document.createElement('li');
            li.textContent = t;
            li.addEventListener('click', () => {
                const arr = LS.get('tasks', []);
                arr.splice(i, 1);
                LS.set('tasks', arr);
                renderTasks();
            });
            taskList.appendChild(li);
        });
    }

    addTaskBtn.addEventListener('click', () => {
        const txt = newTask.value.trim();
        if (!txt) return;
        const arr = LS.get('tasks', []);
        arr.push(txt);
        LS.set('tasks', arr);
        newTask.value = '';
        renderTasks();
    });

    renderTasks();

    /* --------------------------------------------------------------- */
    /* (Toutes les autres sections – notes, calendrier, compteur, …) */
    /* restent inchangées – vous n’avez rien à modifier ici.          */
});

    /* ---------- 2️⃣ Todo‑list ---------- */
    const newTask   = document.getElementById('newTask');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList   = document.getElementById('taskList');

    function renderTasks() {
        const tasks = LS.get('tasks', []);
        taskList.innerHTML = '';
        tasks.forEach((t, i) => {
            const li = document.createElement('li');
            li.textContent = t;
            li.addEventListener('click', () => {
                const arr = LS.get('tasks', []);
                arr.splice(i, 1);
                LS.set('tasks', arr);
                renderTasks();
            });
            taskList.appendChild(li);
        });
    }

    addTaskBtn.addEventListener('click', () => {
        const txt = newTask.value.trim();
        if (!txt) return;
        const arr = LS.get('tasks', []);
        arr.push(txt);
        LS.set('tasks', arr);
        newTask.value = '';
        renderTasks();
    });

    renderTasks();

    /* ---------- 3️⃣ Bloc‑notes ---------- */
    const noteArea   = document.getElementById('noteArea');
    const saveNoteBtn = document.getElementById('saveNoteBtn');

    noteArea.innerHTML = LS.get('note', '');

    saveNoteBtn.addEventListener('click', () => {
        LS.set('note', noteArea.innerHTML);
        alert('Note enregistrée');
    });

    /* ---------- 4️⃣ Calendrier simple ---------- */
    const eventDate   = document.getElementById('eventDate');
    const eventDesc   = document.getElementById('eventDesc');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventList   = document.getElementById('eventList');

    function renderEvents() {
        const evts = LS.get('events', []);
        eventList.innerHTML = '';
        evts.forEach((e, i) => {
            const li = document.createElement('li');
            li.textContent = `${e.date} – ${e.desc}`;
            li.addEventListener('click', () => {
                const arr = LS.get('events', []);
                arr.splice(i, 1);
                LS.set('events', arr);
                renderEvents();
            });
            eventList.appendChild(li);
        });
    }

    addEventBtn.addEventListener('click', () => {
        if (!eventDate.value || !eventDesc.value.trim()) return;
        const evts = LS.get('events', []);
        evts.push({date: eventDate.value, desc: eventDesc.value.trim()});
        LS.set('events', evts);
        eventDate.value = '';
        eventDesc.value = '';
        renderEvents();
    });

    renderEvents();

    /* ---------- 7️⃣ Compteur de jours ---------- */
    const targetDate = document.getElementById('targetDate');
    const calcBtn    = document.getElementById('calcBtn');
    const resultP    = document.getElementById('result');

    calcBtn.addEventListener('click', () => {
        if (!targetDate.value) return;
        const today  = new Date();
        const target = new Date(targetDate.value);
        const diffMs = target - today;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            resultP.textContent = `Il reste ${diffDays} jour(s)`;
        } else if (diffDays < 0) {
            resultP.textContent = `${Math.abs(diffDays)} jour(s) déjà écoulé(s)`;
        } else {
            resultP.textContent = "C’est aujourd’hui !";
        }
    });

    /* ---------- 11️⃣ Recherche interne ---------- */
    const searchBox = document.getElementById('searchBox');
    const searchRes = document.getElementById('searchResults');

    function performSearch(query) {
        const q = query.toLowerCase();
        const hits = [];

        // notes
        const note = LS.get('note', '');
        if (note && note.toLowerCase().includes(q)) {
            hits.push({type: 'Note', snippet: note.substring(0, 30) + '…'});
        }

        // tasks
        LS.get('tasks', []).forEach(t => {
            if (t.toLowerCase().includes(q)) hits.push({type: 'Todo', snippet: t});
        });

        // events
        LS.get('events', []).forEach(e => {
            if (e.desc.toLowerCase().includes(q) || e.date.includes(q)) {
                hits.push({type: 'Événement', snippet: `${e.date} – ${e.desc}`});
            }
        });

        // render
        searchRes.innerHTML = '';
        if (hits.length === 0) {
            searchRes.innerHTML = '<li>Aucun résultat</li>';
            return;
        }
        hits.forEach(h => {
            const li = document.createElement('li');
            li.textContent = `[${h.type}] ${h.snippet}`;
            searchRes.appendChild(li);
        });
    }

    searchBox.addEventListener('input', e => performSearch(e.target.value));

    /* ---------- 12️⃣ Mode sombre / clair ---------- */
    const themeToggle = document.getElementById('themeToggle');

    function applyTheme(isDark) {
        document.documentElement.dataset.theme = isDark ? 'dark' : '';
        localStorage.setItem('darkMode', isDark);
    }

    themeToggle.addEventListener('click', () => {
        const currentlyDark = document.documentElement.dataset.theme === 'dark';
        applyTheme(!currentlyDark);
    });

    // init from storage
    applyTheme(localStorage.getItem('darkMode') === 'true');

    /* ---------- 15️⃣ À faire ce week‑end ---------- */
    const showWeekendBtn = document.getElementById('showWeekendBtn');
    const weekendList    = document.getElementById('weekendList');

    showWeekendBtn.addEventListener('click', () => {
        const tasks = LS.get('tasks', []);
        const filtered = tasks.filter(t =>
            /week[-\s]?end|samedi|dimanche/i.test(t)
        );
        weekendList.innerHTML = '';
        if (filtered.length === 0) {
            weekendList.innerHTML = '<li>Aucune tâche prévue pour le week‑end</li>';
            return;
        }
        filtered.forEach(t => {
            const li = document.createElement('li');
            li.textContent = t;
            weekendList.appendChild(li);
        });
    });

    /* ---------- 17️⃣ Statistiques d’usage ---------- */
    const visitSpan = document.getElementById('visitCount');
    let visits = Number(localStorage.getItem('visits') || 0);
    visits += 1;
    localStorage.setItem('visits', visits);
    visitSpan.textContent = visits;

}); // ← fin DOMContentLoaded
visits += 1;
localStorage.setItem('visits', visits);
visitSpan.textContent = visits;




