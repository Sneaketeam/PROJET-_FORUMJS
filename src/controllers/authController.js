const crypto = require('crypto');
const pool = require('../config/database');

const authController = {
    register: async (req, res) => {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Tous les champs sont obligatoires." });
        }

        // Règles (Lettres/chiffres, 8 carac, 1 Maj, 1 Spécial)
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ error: "Pseudo invalide (lettres et chiffres uniquement)." });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Mot de passe trop faible." });
        }

        try {
            // Hachage SHA-512
            const hashedPassword = crypto.createHash('sha512').update(password).digest('hex');

            // Insertion dans MySQL
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
    }
};

// EXPORTATION OBLIGATOIRE
module.exports = authController;