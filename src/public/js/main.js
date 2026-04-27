// On s'assure que tout le HTML est chargé avant d'exécuter le script
document.addEventListener('DOMContentLoaded', () => {
    
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

        // On retire toutes les classes de couleur
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
                width = '33%';
                label = 'Faible';
                color = '#e50914';
                strengthProgress.classList.add('weak');
            } else if (strength === 'medium') {
                width = '66%';
                label = 'Moyen';
                color = '#f5a623';
                strengthProgress.classList.add('medium');
            } else if (strength === 'strong') {
                width = '100%';
                label = 'Fort';
                color = '#2ecc71';
                strengthProgress.classList.add('strong');
            }

            // On applique simplement la nouvelle largeur, la transition CSS fera le reste !
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
        if (/[^A-Za-z0-9]/.test(password)) score++; // Caractère spécial

        if (score <= 2) return 'weak';
        if (score === 3) return 'medium';
        return 'strong';
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            updateStrengthBar(passwordInput.value);
        });
    }

    // ==========================================
    // 3. SOUMISSION DE L'INSCRIPTION (F-1)
    // ==========================================
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Empêche le rechargement de la page

            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                // Requête vers ton backend Express
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('✅ ' + data.message);
                    registerForm.reset(); // Vide le formulaire
                    updateStrengthBar(''); // Remet la barre de force à zéro
                    document.querySelector('[data-action="login"]').click(); // Repasse sur l'onglet login
                } else {
                    alert('❌ Erreur : ' + data.error);
                }
            } catch (error) {
                console.error('Erreur de communication:', error);
                alert('❌ Impossible de joindre le serveur.');
            }
        });
    }
});