document.addEventListener('DOMContentLoaded', async () => {
    // --- ÉTAT DE LA PAGE (F-8 & F-9) ---
    let currentPage = 1;
    let currentSort = 'recent'; 

    const originalTopicContainer = document.getElementById('original-topic');
    const messagesContainer = document.getElementById('messages-container');
    const replyForm = document.getElementById('reply-form');
    const usernameDisplay = document.getElementById('current-username');

    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('id');

    if (!topicId) {
        window.location.href = '/forum.html'; 
        return;
    }

    // --- NOTIFICATIONS ---
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const notif = document.createElement('div');
        notif.classList.add('notification', type);
        notif.innerHTML = message;
        container.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 400);
        }, 4000);
    }

    // --- VÉRIFICATION DE LA SESSION ---
    async function checkSession() {
        try {
            const response = await fetch('/auth/me');
            if (response.ok) {
                const data = await response.json();
                if (usernameDisplay) usernameDisplay.textContent = data.username;
            } else {
                window.location.href = '/';
            }
        } catch (error) { console.error('Erreur session:', error); }
    }

    // --- CHARGEMENT DU TOPIC ET DES RÉPONSES (F-8 & F-9) ---
    async function fetchTopicData() {
        try {
            // On envoie le tri et la page au serveur via l'URL
            const response = await fetch(`/topics/${topicId}?sort=${currentSort}&page=${currentPage}`);
            if (!response.ok) throw new Error('Topic introuvable');
            const data = await response.json();
            
            displayOriginalTopic(data.topic);
            displayMessages(data.messages);
            updatePaginationUI(data.messages.length);
        } catch (error) {
            originalTopicContainer.innerHTML = '<p style="color: red; text-align: center;">Impossible de charger la discussion.</p>';
        }
    }

    function displayOriginalTopic(topic) {
        const date = new Date(topic.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
        });
        originalTopicContainer.innerHTML = `
            <h1 class="topic-title">${topic.title}</h1>
            <div class="topic-meta">
                <span class="author-badge">👑 Auteur: ${topic.author_username}</span>
                <span>${date}</span>
            </div>
            <div class="topic-body">${topic.body}</div>
        `;
    }

    function displayMessages(messages) {
        messagesContainer.innerHTML = '';
        if (messages.length === 0) {
            messagesContainer.innerHTML = '<p style="color: #b3b3b3; font-style: italic;">Aucune réponse pour le moment.</p>';
            return;
        }

        messages.forEach(msg => {
            const date = new Date(msg.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'
            });

            const msgElement = document.createElement('div');
            msgElement.className = 'message-card';
            msgElement.innerHTML = `
                <div class="message-meta">
                    <span class="message-author">${msg.author_username}</span>
                    <span>${date}</span>
                </div>
                <div class="message-body">${msg.body}</div>
                <div class="vote-section">
                    <button class="vote-btn btn-like" data-id="${msg.id}" data-score="1">👍</button>
                    <span class="vote-count" id="score-${msg.id}">${msg.popularity_score || 0}</span>
                    <button class="vote-btn btn-dislike" data-id="${msg.id}" data-score="-1">👎</button>
                </div>
            `;
            messagesContainer.appendChild(msgElement);
        });
        attachVoteListeners();
    }

    // --- LOGIQUE DE TRI (F-8) ---
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentSort = e.target.getAttribute('data-sort');
            currentPage = 1; // On reset à la page 1 lors d'un changement de tri[cite: 1]
            fetchTopicData();
        });
    });

    // --- LOGIQUE DE PAGINATION (F-9) ---
    function updatePaginationUI(messageCount) {
        document.getElementById('page-info').textContent = `Page ${currentPage}`;
        document.getElementById('prev-page').disabled = (currentPage === 1);
        // Si on a moins de 10 messages, le bouton "Suivant" est bloqué
        document.getElementById('next-page').disabled = (messageCount < 10);
    }

    document.getElementById('prev-page').onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            fetchTopicData();
        }
    };

    document.getElementById('next-page').onclick = () => {
        currentPage++;
        fetchTopicData();
    };

    // --- LOGIQUE DES VOTES ---
    function attachVoteListeners() {
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const messageId = e.currentTarget.getAttribute('data-id');
                const scoreValue = parseInt(e.currentTarget.getAttribute('data-score'));

                try {
                    const response = await fetch(`/topics/messages/${messageId}/vote`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: scoreValue })
                    });

                    if (response.ok) {
                        fetchTopicData(); // Recharge avec le tri et la page actuelle[cite: 1]
                    } else {
                        const data = await response.json();
                        showNotification('❌ ' + (data.error || 'Erreur lors du vote'), 'error');
                    }
                } catch (error) { showNotification('❌ Erreur de connexion.', 'error'); }
            });
        });
    }

    // --- ENVOYER UNE RÉPONSE ---
    if (replyForm) {
        replyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = document.getElementById('reply-body').value;
            try {
                const response = await fetch(`/topics/${topicId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ body })
                });
                if (response.ok) {
                    showNotification('🍿 Réponse publiée !');
                    replyForm.reset();
                    fetchTopicData();
                } else {
                    const data = await response.json();
                    showNotification('❌ ' + data.error, 'error');
                }
            } catch (error) { showNotification('❌ Erreur serveur.', 'error'); }
        });
    }

    checkSession();
    fetchTopicData();
});