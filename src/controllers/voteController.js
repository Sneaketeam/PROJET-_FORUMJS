const pool = require('../config/database');

const voteController = {
    // Voter pour un message (F-7)
    voteMessage: async (req, res) => {
        const messageId = req.params.id;
        const { score } = req.body; // Doit être 1 (like) ou -1 (dislike)
        const userId = req.session.userId;

        if (!userId) return res.status(401).json({ error: "Connectez-vous pour voter" });
        if (![1, -1].includes(score)) return res.status(400).json({ error: "Vote invalide" });

        try {
            // ON DUPLICATE KEY UPDATE permet de changer son vote (ex: passer de like à dislike)[cite: 3]
            const sql = `
                INSERT INTO Vote (user_id, message_id, score) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE score = ?
            `;
            await pool.query(sql, [userId, messageId, score, score]);
            
            res.json({ message: "Vote enregistré avec succès !" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Erreur lors du vote" });
        }
    }
};

module.exports = voteController;