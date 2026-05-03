document.addEventListener('DOMContentLoaded', () => {
    const usernameDisplay = document.getElementById('current-username');
    const topicsContainer = document.getElementById('topics-container');
    const btnCreateTopic = document.getElementById('btn-create-topic');
    const btnLogout = document.getElementById('btn-logout');

    // Éléments de la Modale
    const modal = document.getElementById('topic-modal');
    const btnCloseModal = document.getElementById('close-modal');
    const btnCancelModal = document.getElementById('cancel-modal');
    const createTopicForm = document.getElementById('create-topic-form');

    // Recherche et filtres
    const searchInput = document.getElementById('search-input');
    const tagButtons = document.querySelectorAll('.tag-btn');
    
    let currentSearch = '';
    let currentCategory = 'all';
    let searchTimeout; // Pour le debounce

    // --- 0. SYSTÈME DE NOTIFICATIONS ---
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

    // --- 1. VÉRIFICATION DE LA SESSION ---
    async function checkSession() {
        try {
            const response = await fetch('/auth/me');
            if (response.ok) {
                const data = await response.json();
                if (usernameDisplay) usernameDisplay.textContent = data.username;
            } else {
                window.location.href = '/';
            }
        } catch (error) { console.error('Erreur de session:', error); }
    }

    // --- 2. RÉCUPÉRATION DES TOPICS (F-10 & F-12) ---
    async function fetchTopics() {
        try {
            const url = `/topics?search=${encodeURIComponent(currentSearch)}&category=${encodeURIComponent(currentCategory)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erreur de récupération');
            const topics = await response.json();
            displayTopics(topics);
        } catch (error) {
            topicsContainer.innerHTML = '<p style="color: #e50914; text-align: center;">Impossible de charger les discussions.</p>';
        }
    }

    function displayTopics(topics) {
        topicsContainer.innerHTML = '';
        if (!topics || topics.length === 0) {
            topicsContainer.innerHTML = '<p style="color: #b3b3b3; text-align: center; grid-column: 1 / -1;">Aucun topic trouvé.</p>';
            return;
        }

        topics.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            const date = new Date(topic.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

            card.innerHTML = `
                <div>
                    <h3 class="topic-title">${topic.title}</h3>
                    <div class="topic-meta">
                        <span>Par ${topic.author_username}</span>
                        <span>${date}</span>
                    </div>
                </div>
                <div class="topic-tags">
                    <span class="topic-tag">${topic.category || 'Général'}</span>
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.href = `/topic.html?id=${topic.id}`;
            });

            topicsContainer.appendChild(card);
        });
    }

    // --- 3. RECHERCHE AVEC DEBOUNCE (F-12) ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(fetchTopics, 300); 
        });
    }

    tagButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            tagButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.getAttribute('data-tag');
            fetchTopics();
        });
    });

    // --- 4. GESTION DE LA MODALE ---
    function openModal() { if (modal) modal.classList.add('active'); }
    function closeModal() { 
        if (modal) {
            modal.classList.remove('active');
            createTopicForm.reset();
        }
    }

    if (btnCreateTopic) btnCreateTopic.addEventListener('click', openModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    // --- 5. CRÉATION D'UN TOPIC (F-4) ---
    if (createTopicForm) {
        createTopicForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('topic-title').value;
            const body = document.getElementById('topic-body').value;
            
            // MODIFICATION ICI : On récupère la valeur du SELECT
            const tagName = document.getElementById('topic-tag').value; 

            try {
                const response = await fetch('/topics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, body, tagName })
                });

                if (response.ok) {
                    showNotification('🍿 Discussion lancée !');
                    closeModal();
                    fetchTopics();
                } else {
                    const data = await response.json();
                    showNotification('❌ ' + data.error, 'error');
                }
            } catch (error) { showNotification('❌ Serveur injoignable.', 'error'); }
        });
    }

    // --- 6. DÉCONNEXION ---
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await fetch('/auth/logout', { method: 'POST' });
            window.location.href = '/';
        });
    }

    checkSession();
    fetchTopics();
});