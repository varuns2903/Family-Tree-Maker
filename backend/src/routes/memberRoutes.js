const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  linkMember
} = require('../controllers/memberController');

const { protect } = require('../middleware/authMiddleware');
const { checkAccess } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, checkAccess('viewer'), getMembers) 
  .post(protect, checkAccess('editor'), addMember);

router.route('/link')
  .put(protect, checkAccess('editor'), linkMember);

router.route('/:memberId')
  .put(protect, checkAccess('editor'), updateMember)
  .delete(protect, checkAccess('editor'), deleteMember);

module.exports = router;