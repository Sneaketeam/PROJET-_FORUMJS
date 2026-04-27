const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route pour l'inscription (F-1)
router.post('/register', authController.register);

// EXPORTATION OBLIGATOIRE (C'est ça qui empêche le crash !)
module.exports = router;