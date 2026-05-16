const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la Base de Datos
const dbPath = path.join(__dirname, 'data', 'proformas.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error al abrir la BD:', err.message);
    else console.log('Conectado a la base de datos SQLite (proformas.db).');
});

// Crear tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS proformas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        emisor_nombre TEXT,
        emisor_ruc TEXT,
        cliente_nombre TEXT,
        cliente_ruc TEXT,
        fecha TEXT,
        validez TEXT,
        subtotal REAL,
        igv REAL,
        total REAL
    )`);
});

// Ruta para guardar una proforma en el historial
app.post('/api/proformas', (req, res) => {
    const { emisor, emisorRuc, cliente, clienteId, fecha, validez, subtotal, igv, total } = req.body;

    const query = `INSERT INTO proformas (emisor_nombre, emisor_ruc, cliente_nombre, cliente_ruc, fecha, validez, subtotal, igv, total) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [emisor, emisorRuc, cliente, clienteId, fecha, validez, subtotal, igv, total], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID });
    });
});

// Quítale el "const" al inicio para que use la que ya estaba declarada arriba
PORT = process.env.PORT || 3000; 

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose profesionalmente en el puerto ${PORT}`);
});