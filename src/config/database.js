const mysql = require('mysql2/promise');
const path = require('path');

// On remonte de deux niveaux pour atteindre le .env à la racine
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // <-- LA CORRECTION EST ICI !
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test de connexion
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL (Connecté)');
        conn.release();
    })
    .catch((err) => {
        console.log('❌ MySQL (Erreur de connexion)');
        console.error('🚨 DÉTAIL :', err.message); // On garde ça allumé pour le débogage !
    });

module.exports = pool;