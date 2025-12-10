const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkAccess } = require('../middleware/roleMiddleware');
const {
  getTrees,
  createTree,
  getTreeById,
  deleteTree,
  updateTree,
  joinTree,
  getCollaborators,
  manageRole
} = require('../controllers/treeController');

// Import the member router to mount it (Sub-routing)
const memberRoutes = require('./memberRoutes');

// --- Routes for /api/trees/ ---
router.route('/')
  .get(protect, getTrees)
  .post(protect, createTree);

// --- Public/Shared Routes ---
router.post('/join/:shareToken', protect, joinTree);

// --- Role & Collaborator Management ---

// 1. Get list of collaborators
router.get('/:id/collaborators', protect, getCollaborators);

// 2. Manage Roles (Request Access OR Owner promotes/demotes)
// We do NOT enforce checkAccess('owner') here because Viewers need to call this to "request" access.
// The controller logic ensures Viewers can only perform the 'request' action.
router.put('/:id/role', protect, manageRole);

// --- Single Tree Operations ---
router.route('/:id')
  .get(protect, getTreeById)
  // 'editor' can typically update tree details (name, description)
  .put(protect, checkAccess('editor'), updateTree) 
  // Only 'owner' can delete the entire tree
  .delete(protect, checkAccess('owner'), deleteTree);

module.exports = router;