require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const configurePassport = require('./src/config/passport');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const treeRoutes = require('./src/routes/treeRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const gedcomRoutes = require('./src/routes/gedcomRoutes');

const { errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();
app.use(express.json());

// Connect to Mongo
connectDB();
configurePassport();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL.split(',');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/trees/:treeId/members', memberRoutes);
app.use('/api/gedcom', gedcomRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));