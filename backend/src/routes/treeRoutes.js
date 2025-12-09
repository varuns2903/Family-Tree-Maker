const express = require('express');
const router = express.Router();
const {
  getTrees,
  createTree,
  getTreeById,
  deleteTree,
} = require('../controllers/treeController');
const { protect } = require('../middleware/authMiddleware');

// Routes for /api/trees/
router.route('/')
  .get(protect, getTrees)     // List all my trees
  .post(protect, createTree); // Create new tree

// Routes for /api/trees/:id
router.route('/:id')
  .get(protect, getTreeById)  // Get specific tree details
  .delete(protect, deleteTree); // Delete tree

module.exports = router;