const express = require('express');
const router = express.Router();

// On importe le bon contrôleur
const topicController = require('../controllers/topicController');

// Route pour récupérer tous les topics (GET /topics)
router.get('/', topicController.getAllTopics);

// Route pour CRÉER un topic (POST /topics) <-- C'EST LA LIGNE QU'IL MANQUAIT !
router.post('/', topicController.createTopic);

module.exports = router;