const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

// --- Gestion des Topics ---

// 1. Liste de tous les topics avec filtres (F-10, F-12)
router.get('/', topicController.getAllTopics);

// 2. Création d'une nouvelle discussion (F-4)
router.post('/', topicController.createTopic);

// 3. Consultation d'un sujet spécifique et ses messages (F-4)
router.get('/:id', topicController.getTopicById);

// --- Gestion des Messages et Votes ---

// 4. Publier une réponse dans un topic (F-5)
router.post('/:id/messages', topicController.createMessage);

// 5. Voter pour un message spécifique (F-7)
// URL complète : POST /topics/messages/:id/vote
router.post('/messages/:id/vote', topicController.voteMessage);

module.exports = router;