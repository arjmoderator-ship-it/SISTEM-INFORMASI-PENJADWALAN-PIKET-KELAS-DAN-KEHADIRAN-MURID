const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const siswaRoutes = require('./routes/siswa');
const jadwalRoutes = require('./routes/jadwal');
const absensiRoutes = require('./routes/absensi');
const permohonanRoutes = require('./routes/permohonan');
const dokumentasiRoutes = require('./routes/dokumentasi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'sipiket-secret-key-2026',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/siswa', siswaRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/permohonan', permohonanRoutes);
app.use('/api/dokumentasi', dokumentasiRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 SiPiket Digital Server running on http://localhost:${PORT}`);
});
