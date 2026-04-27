require('dotenv').config({ path: '../.env' });

const express = require('express');
const session = require('express-session');
const path = require('path');

// Test de la connexion MySQL
const pool = require('./config/database');

// 🔌 IMPORTATION DES ROUTES (Nouveau !)
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'clef_secrete_par_defaut',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        httpOnly: true 
    }
}));

// FICHIERS STATIQUES
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 🔀 BRANCHEMENT DES ROUTES (Nouveau !)
// ==========================================
// On dit à Express : "Si une URL commence par /auth, va chercher dans authRoutes.js"
app.use('/auth', authRoutes);

// ROUTES (Pages HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// LANCEMENT
app.listen(PORT, () => {
    console.log(`✅ Serveur (Port ${PORT})`);
});