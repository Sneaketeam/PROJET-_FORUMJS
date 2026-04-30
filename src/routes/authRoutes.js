const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route pour l'inscription (F-1)
router.post('/register', authController.register);

// Route pour la connexion (F-2)
router.post('/login', authController.login);

// Route pour savoir qui est connecté (GET /auth/me)
router.get('/me', authController.me);

// Route pour se déconnecter (POST /auth/logout)
router.post('/logout', authController.logout);

// EXPORTATION OBLIGATOIRE
module.exports = router;