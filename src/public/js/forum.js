document.addEventListener('DOMContentLoaded', () => {
    // Éléments de la Navbar et containers
    const usernameDisplay = document.getElementById('current-username');
    const topicsContainer = document.getElementById('topics-container');
    const btnCreateTopic = document.getElementById('btn-create-topic');
    const btnLogout = document.getElementById('btn-logout');

    // Éléments de la Modale (Formulaire)
    const modal = document.getElementById('topic-modal');
    const btnCloseModal = document.getElementById('close-modal');
    const btnCancelModal = document.getElementById('cancel-modal');
    const createTopicForm = document.getElementById('create-topic-form');

    // ==========================================
    // 0. SYSTÈME DE NOTIFICATIONS
    // ==========================================
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

    // ==========================================
    // 1. VÉRIFICATION DE LA SESSION & PSEUDO
    // ==========================================
    async function checkSession() {
        try {
            const response = await fetch('/auth/me');
            if (response.ok) {
                const data = await response.json();
                // On affiche le pseudo dans la top bar
                if (usernameDisplay) usernameDisplay.textContent = data.username;
            } else {
                // Si pas de session, retour immédiat à l'accueil (Sécurité F-1/F-2)
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Erreur de session:', error);
        }
    }

    // ==========================================
    // 2. RÉCUPÉRATION DES TOPICS (F-4)
    // ==========================================
    async function fetchTopics() {
        try {
            const response = await fetch('/topics');
            if (!response.ok) throw new Error('Erreur de récupération');
            
            const topics = await response.json();
            displayTopics(topics);
        } catch (error) {
            console.error('Erreur :', error);
            topicsContainer.innerHTML = '<p style="color: var(--netflix-red); text-align: center;">Impossible de charger les discussions.</p>';
        }
    }

    function displayTopics(topics) {
        topicsContainer.innerHTML = '';

        if (!topics || topics.length === 0) {
            topicsContainer.innerHTML = '<p style="color: #b3b3b3; text-align: center; grid-column: 1 / -1;">Aucun topic pour le moment. Soyez le premier à lancer une discussion !</p>';
            return;
        }

        topics.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            
            const date = new Date(topic.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', year: 'numeric'
            });

            // On gère les tags (si présents en BDD, sinon "Général")
            const tagsHtml = (topic.tags && topic.tags.length > 0) 
                ? topic.tags.map(tag => `<span class="topic-tag">${tag.name}</span>`).join('') 
                : '<span class="topic-tag">Général</span>';

            card.innerHTML = `
                <div>
                    <h3 class="topic-title">${topic.title}</h3>
                    <div class="topic-meta">
                        <span>Par ${topic.author_username || 'Utilisateur'}</span>
                        <span>${date}</span>
                    </div>
                </div>
                <div class="topic-tags">
                    ${tagsHtml}
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.href = `/topic.html?id=${topic.id}`;
            });

            topicsContainer.appendChild(card);
        });
    }

    // ==========================================
    // 3. GESTION DE LA MODALE (Ouverture/Fermeture)
    // ==========================================
    function openModal() {
        if (modal) modal.classList.add('active');
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            createTopicForm.reset(); // On vide les champs
        }
    }

    if (btnCreateTopic) btnCreateTopic.addEventListener('click', openModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    // Fermer si on clique sur le fond sombre
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // ==========================================
    // 4. CRÉATION D'UN TOPIC (POST)
    // ==========================================
    if (createTopicForm) {
        createTopicForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('topic-title').value;
            const body = document.getElementById('topic-body').value;

            try {
                const response = await fetch('/topics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, body })
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('🍿 Discussion lancée avec succès !', 'success');
                    closeModal();
                    fetchTopics(); // On rafraîchit la liste sans recharger la page
                } else {
                    showNotification('❌ ' + data.error, 'error');
                }
            } catch (error) {
                showNotification('❌ Impossible de joindre le serveur.', 'error');
            }
        });
    }

    // ==========================================
    // 5. DÉCONNEXION
    // ==========================================
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await fetch('/auth/logout', { method: 'POST' });
                window.location.href = '/';
            } catch (error) {
                showNotification('❌ Erreur lors de la déconnexion', 'error');
            }
        });
    }

    // Lancement au chargement
    checkSession();
    fetchTopics();
});