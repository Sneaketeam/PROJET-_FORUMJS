const pool = require('../config/database');

const topicController = {
    // =====================================
    // 1. RÉCUPÉRER TOUS LES TOPICS (F-4)
    // =====================================
    getAllTopics: async (req, res) => {
        try {
            const query = `
                SELECT Topic.*, User.username AS author_username 
                FROM Topic 
                JOIN User ON Topic.author_id = User.id 
                ORDER BY Topic.created_at DESC
            `;
            
            const [topics] = await pool.query(query);
            res.status(200).json(topics);

        } catch (error) {
            console.error("Erreur SQL lors de la récupération des topics :", error);
            res.status(500).json({ error: "Erreur serveur lors de la récupération des discussions." });
        }
    }, // <-- VIRGULE TRÈS IMPORTANTE ICI !

    // =====================================
    // 2. CRÉER UN NOUVEAU TOPIC (F-4)
    // =====================================
    createTopic: async (req, res) => {
        const { title, body } = req.body;
        
        // On récupère l'ID de l'utilisateur grâce à la session active
        const author_id = req.session.userId;

        // Sécurité : l'utilisateur doit être authentifié pour créer un topic
        if (!author_id) {
            return res.status(401).json({ error: "Vous devez être connecté pour créer un topic." });
        }

        // Vérification des champs obligatoires
        if (!title || !body) {
            return res.status(400).json({ error: "Le titre et le message sont obligatoires." });
        }

        try {
            // Insertion dans la base de données
            // L'état par défaut ('ouvert') et la date ('created_at') sont gérés automatiquement par MySQL
            const [result] = await pool.query(
                'INSERT INTO Topic (title, body, author_id) VALUES (?, ?, ?)',
                [title, body, author_id]
            );

            res.status(201).json({ 
                message: "Discussion lancée avec succès !", 
                topicId: result.insertId // On renvoie l'ID pour pouvoir rediriger l'utilisateur vers son topic ensuite
            });

        } catch (error) {
            console.error("Erreur lors de la création du topic :", error);
            res.status(500).json({ error: "Erreur interne du serveur." });
        }
    }
};

// EXPORTATION OBLIGATOIRE
module.exports = topicController;