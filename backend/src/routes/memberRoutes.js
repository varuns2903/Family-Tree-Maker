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

router.route('/')
  .get(protect, getMembers)
  .post(protect, addMember);

router.post('/sync', protect, syncMembers);

router.route('/:memberId')
  .put(protect, updateMember)
  .delete(protect, deleteMember);

module.exports = router;