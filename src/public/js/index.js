// On s'assure que tout le HTML est chargé avant d'exécuter le script
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 0. SYSTÈME DE NOTIFICATIONS
    // ==========================================
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        // On crée la bulle de notification
        const notif = document.createElement('div');
        notif.classList.add('notification', type);
        notif.innerHTML = message;

        container.appendChild(notif);

        // Petit délai pour laisser le CSS appliquer l'animation d'entrée
        setTimeout(() => {
            notif.classList.add('show');
        }, 10);

        // Au bout de 4 secondes, on cache et on supprime
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 400); // Attend la fin de l'animation CSS
        }, 4000);
    }

    // ==========================================
    // 1. BASCULE ENTRE CONNEXION ET INSCRIPTION
    // ==========================================
    const toggleLinks = document.querySelectorAll('.toggle-link');
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');

    toggleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            
            if (action === 'register') {
                loginBox.classList.add('hidden');
                registerBox.classList.remove('hidden');
            } else if (action === 'login') {
                registerBox.classList.add('hidden');
                loginBox.classList.remove('hidden');
            }
        });
    });

    // ==========================================
    // 2. BARRE DE SOLIDITÉ DU MOT DE PASSE
    // ==========================================
    const passwordInput = document.getElementById('reg-password');
    const strengthProgress = document.getElementById('strength-progress');
    const strengthText = document.getElementById('strength-text');

    function updateStrengthBar(password) {
        if (!strengthProgress || !strengthText) return;
        const strength = checkPasswordStrength(password);
        strengthProgress.classList.remove('weak', 'medium', 'strong');

        if (password.length === 0) {
            strengthProgress.style.width = '0%';
            strengthText.textContent = 'Force du mot de passe';
            strengthText.style.color = '#b3b3b3';
        } else {
            let width = '0%';
            let label = 'Force du mot de passe';
            let color = '#b3b3b3';

            if (strength === 'weak') {
                width = '33%'; label = 'Faible'; color = '#e50914';
                strengthProgress.classList.add('weak');
            } else if (strength === 'medium') {
                width = '66%'; label = 'Moyen'; color = '#f5a623';
                strengthProgress.classList.add('medium');
            } else if (strength === 'strong') {
                width = '100%'; label = 'Fort'; color = '#2ecc71';
                strengthProgress.classList.add('strong');
            }

            strengthProgress.style.width = width;
            strengthText.textContent = label;
            strengthText.style.color = color;
        }
    }

    function checkPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        if (score <= 2) return 'weak';
        if (score === 3) return 'medium';
        return 'strong';
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => updateStrengthBar(passwordInput.value));
    }

    // ==========================================
    // 3. SOUMISSION DE L'INSCRIPTION
    // ==========================================
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('✅ ' + data.message, 'success'); // <-- MAGIE ICI !
                    registerForm.reset();
                    updateStrengthBar('');
                    document.querySelector('[data-action="login"]').click();
                } else {
                    showNotification('❌ ' + data.error, 'error'); // <-- MAGIE ICI !
                }
            } catch (error) {
                console.error(error);
                showNotification('❌ Impossible de joindre le serveur.', 'error');
            }
        });
    }

    // ==========================================
    // 4. SOUMISSION DE LA CONNEXION
    // ==========================================
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const identifier = document.getElementById('login-id').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('🍿 ' + data.message, 'success'); // <-- MAGIE ICI !
                    
                    // Petit délai avant de changer de page pour laisser le temps de lire
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                } else {
                    showNotification('❌ ' + data.error, 'error'); // <-- MAGIE ICI !
                }
            } catch (error) {
                console.error(error);
                showNotification('❌ Impossible de joindre le serveur.', 'error');
            }
        });
    }
});