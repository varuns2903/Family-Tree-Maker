require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const treeRoutes = require('./src/routes/treeRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const gedcomRoutes = require('./src/routes/gedcomRoutes');

const { errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();

// Connect to Mongo
connectDB();

// Middleware
app.use(cors({
  origin: 'https://family-tree-maker-beige.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/trees/:treeId/members', memberRoutes);
app.use('/api/gedcom', gedcomRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));