const crypto = require('crypto');
const pool = require('../config/database');

const authController = {
    // =====================================
    // 1. INSCRIPTION
    // =====================================
    register: async (req, res) => {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Tous les champs sont obligatoires." });
        }

        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ error: "Pseudo invalide (lettres et chiffres uniquement)." });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Mot de passe trop faible." });
        }

        try {
            const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');

            await pool.query(
                'INSERT INTO User (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword]
            );

            res.status(201).json({ message: "Inscription réussie avec succès !" });

        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Pseudo ou Email déjà utilisé." });
            }
            console.error(error);
            res.status(500).json({ error: "Erreur serveur." });
        }
    }, // <-- Virgule !

    // =====================================
    // 2. CONNEXION
    // =====================================
    login: async (req, res) => {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: "Veuillez remplir tous les champs." });
        }

        try {
            const [users] = await pool.query(
                'SELECT * FROM User WHERE username = ? OR email = ?',
                [identifier, identifier]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
            }

            const user = users[0];
            const hashedInputPassword = crypto.createHash('sha512').update(password).digest('hex');

            if (hashedInputPassword !== user.password) {
                return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
            }

            req.session.userId = user.id;
            req.session.username = user.username;

            res.status(200).json({ 
                message: "Connexion réussie !", 
                redirect: "/forum.html" 
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur interne du serveur lors de la connexion." });
        }
    }, // <-- VIRGULE SUPER IMPORTANTE ICI AUSSI !

    // =====================================
    // 3. RÉCUPÉRER L'UTILISATEUR CONNECTÉ
    // =====================================
    me: (req, res) => {
        if (req.session.userId && req.session.username) {
            res.status(200).json({ username: req.session.username });
        } else {
            res.status(401).json({ error: "Non authentifié" });
        }
    }, // <-- VIRGULE !

    // =====================================
    // 4. DÉCONNEXION
    // =====================================
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: "Erreur lors de la déconnexion" });
            }
            res.clearCookie('connect.sid'); 
            res.status(200).json({ message: "Déconnecté avec succès" });
        });
    }
}; // <-- C'est seulement ici qu'on ferme la boîte globale authController !

module.exports = authController;