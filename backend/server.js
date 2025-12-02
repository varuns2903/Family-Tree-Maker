const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./src/config/db');

// --- Import Routes ---
const authRoutes = require('./src/routes/authRoutes');
const treeRoutes = require('./src/routes/treeRoutes');
const personRoutes = require('./src/routes/personRoutes');
const collaboratorRoutes = require('./src/routes/collaboratorRoutes');

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Parse JSON bodies

// --- Route Mounting ---
// 1. Auth: /api/auth/register, /api/auth/login
app.use('/api/auth', authRoutes);

// 2. Trees: /api/trees (Create, List, Add Root)
app.use('/api/trees', treeRoutes);

// 3. People: /api/people (Add Child, Spouse, Details)
app.use('/api/people', personRoutes);

// 4. Collaboration: /api/trees/:treeId/share
// We mount this under trees because sharing is tree-specific
app.use('/api/trees/:treeId/share', collaboratorRoutes);


// --- Health Check ---
app.get('/', (req, res) => {
  res.send({ status: 'API Online', timestamp: new Date() });
});

// --- Global Error Handling ---
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message: message
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
});