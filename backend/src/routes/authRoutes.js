const router = require("express").Router();
const authController = require("../controllers/authController");
const authorize = require("../middleware/authMiddleware");

// Route: POST /api/auth/register
router.post("/register", authController.register);

// Route: POST /api/auth/login
router.post("/login", authController.login);

// Route: GET /api/auth/verify
// Uses the 'authorize' middleware to check validity
router.get("/verify", authorize, authController.verify);

module.exports = router;