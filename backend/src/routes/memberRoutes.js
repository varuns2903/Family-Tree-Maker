const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  syncMembers
} = require('../controllers/memberController');

const { protect } = require('../middleware/authMiddleware');
const { checkAccess } = require('../middleware/roleMiddleware');

// Base route: /api/trees/:treeId/members
router.route('/')
  .get(protect, checkAccess('viewer'), getMembers) 
  // checking if user has 'editor' role or higher
  .post(protect, checkAccess('editor'), addMember);

// Sync route: /api/trees/:treeId/members/sync
router.post('/sync', protect, checkAccess('editor'), syncMembers);

// Individual member operations: /api/trees/:treeId/members/:memberId
router.route('/:memberId')
  .put(protect, checkAccess('editor'), updateMember)
  .delete(protect, checkAccess('editor'), deleteMember);

module.exports = router;