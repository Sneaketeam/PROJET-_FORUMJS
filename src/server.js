require('dotenv').config({ path: '../.env' });

const express = require('express');
const session = require('express-session');
const path = require('path');

// Test de la connexion MySQL
const pool = require('./config/database');

// 🔌 IMPORTATION DES ROUTES
const authRoutes = require('./routes/authRoutes');
const topicRoutes = require('./routes/topicRoutes'); // <-- NOUVEAU : Import des topics

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
// 🔀 BRANCHEMENT DES ROUTES
// ==========================================
app.use('/auth', authRoutes);
app.use('/topics', topicRoutes); // <-- NOUVEAU : Branchement de la prise

// ROUTES (Pages HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// LANCEMENT
app.listen(PORT, () => {
    console.log(`✅ Serveur (Port ${PORT})`);
});