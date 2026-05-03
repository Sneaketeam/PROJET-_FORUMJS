const pool = require('../config/database');

const topicController = {
    // =====================================
    // 1. RÉCUPÉRER TOUS LES TOPICS (F-10, F-12)
    // =====================================
    getAllTopics: async (req, res) => {
        const { search, category } = req.query;
        try {
            let query = `
                SELECT t.*, u.username AS author_username, tg.name AS category 
                FROM Topic t
                JOIN User u ON t.author_id = u.id
                LEFT JOIN Topic_Tag tt ON t.id = tt.topic_id
                LEFT JOIN Tag tg ON tt.tag_id = tg.id
                WHERE 1=1
            `;
            const queryParams = [];

            if (search && search.trim() !== '') {
                query += ` AND t.title LIKE ?`;
                queryParams.push(`%${search}%`);
            }

            if (category && category !== 'all') {
                query += ` AND tg.name = ?`;
                queryParams.push(category);
            }

            query += ` GROUP BY t.id ORDER BY t.created_at DESC`;
            
            const [topics] = await pool.query(query, queryParams);
            res.status(200).json(topics);
        } catch (error) {
            res.status(500).json({ error: "Erreur lors du filtrage." });
        }
    },

    // =====================================
    // 2. CRÉER UN NOUVEAU TOPIC (F-4)
    // =====================================
    createTopic: async (req, res) => {
        const { title, body, tagName } = req.body;
        const author_id = req.session.userId;

        if (!author_id) return res.status(401).json({ error: "Connectez-vous pour publier." });
        if (!title || !body) return res.status(400).json({ error: "Titre et corps obligatoires." });

        try {
            const [result] = await pool.query(
                'INSERT INTO Topic (title, body, author_id) VALUES (?, ?, ?)',
                [title, body, author_id]
            );
            const topicId = result.insertId;

            if (tagName) {
                // On cherche l'ID du tag correspondant au nom envoyé (ex: 'Théories')
                const [tag] = await pool.query('SELECT id FROM Tag WHERE name = ?', [tagName]);
                if (tag.length > 0) {
                    await pool.query('INSERT INTO Topic_Tag (topic_id, tag_id) VALUES (?, ?)', [topicId, tag[0].id]);
                }
            }

            res.status(201).json({ message: "Discussion lancée !", topicId });
        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création." });
        }
    },


// 3. CONSULTER UN TOPIC & SES MESSAGES (F-4, F-7, F-8, F-9)
getTopicById: async (req, res) => {
    const topicId = req.params.id;
    const { sort, page } = req.query; 

    const limit = 10; // F-9 : Pagination par blocs de 10
    const offset = (page && page > 0) ? (parseInt(page) - 1) * limit : 0;

    try {
        const [topic] = await pool.query(
            'SELECT t.*, u.username AS author_username FROM Topic t JOIN User u ON t.author_id = u.id WHERE t.id = ?',
            [topicId]
        );
        if (topic.length === 0) return res.status(404).json({ error: "Topic introuvable." });

        // --- LOGIQUE DE TRI DYNAMIQUE (F-8) ---
        // Par défaut ou si 'recent' : du plus nouveau au plus ancien
        let orderClause = 'm.created_at DESC'; 
        
        if (sort === 'popular') {
            // Tri par score de vote, puis par date
            orderClause = 'popularity_score DESC, m.created_at DESC';
        } else if (sort === 'oldest') {
            // Mode Lecture : du tout premier message au dernier
            orderClause = 'm.created_at ASC';
        }

        const [messages] = await pool.query(`
            SELECT m.*, u.username AS author_username, 
                   COALESCE(SUM(v.score), 0) AS popularity_score
            FROM Message m
            JOIN User u ON m.author_id = u.id
            LEFT JOIN Vote v ON m.id = v.message_id
            WHERE m.topic_id = ?
            GROUP BY m.id
            ORDER BY ${orderClause}
            LIMIT ? OFFSET ?
        `, [topicId, limit, offset]);

        res.json({ topic: topic[0], messages });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
},

    // 4. RÉPONDRE À UN TOPIC (F-5)
    createMessage: async (req, res) => {
        const topicId = req.params.id;
        const { body } = req.body;
        const author_id = req.session.userId;
        if (!author_id) return res.status(401).json({ error: "Connectez-vous pour répondre." });
        if (!body) return res.status(400).json({ error: "Le message ne peut pas être vide." });

        try {
            await pool.query(
                'INSERT INTO Message (body, author_id, topic_id) VALUES (?, ?, ?)',
                [body, author_id, topicId]
            );
            res.status(201).json({ message: "Réponse publiée !" });
        } catch (error) { res.status(500).json({ error: "Erreur lors de l'envoi." }); }
    },

    // 5. VOTER POUR UN MESSAGE (F-7)
    voteMessage: async (req, res) => {
        const messageId = req.params.id;
        const { score } = req.body; 
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: "Connectez-vous pour voter." });

        try {
            const sql = `
                INSERT INTO Vote (user_id, message_id, score) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE score = ?
            `;
            await pool.query(sql, [userId, messageId, score, score]);
            res.json({ message: "Vote enregistré !" });
        } catch (error) { res.status(500).json({ error: "Erreur lors du vote." }); }
    }
};

module.exports = topicController;