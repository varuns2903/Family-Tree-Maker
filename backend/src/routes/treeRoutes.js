const express = require('express');
const router = express.Router();
const {
  getTrees,
  createTree,
  getTreeById,
  deleteTree,
  updateTree,
} = require('../controllers/treeController');
const { protect } = require('../middleware/authMiddleware');

// Routes for /api/trees/
router.route('/')
  .get(protect, getTrees)
  .post(protect, createTree);

// Routes for /api/trees/:id
router.route('/:id')
  .get(protect, getTreeById)
  .put(protect, updateTree)
  .delete(protect, deleteTree);

module.exports = router;
