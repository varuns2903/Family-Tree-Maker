const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { importGedcom, exportGedcom } = require('../controllers/gedcomController');

// Multer setup for temporary storage
const upload = multer({ dest: 'uploads/' });

router.post('/import', protect, upload.single('file'), importGedcom);
router.get('/export/:treeId', protect, exportGedcom);

module.exports = router;