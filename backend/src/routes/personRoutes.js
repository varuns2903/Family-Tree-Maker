const router = require("express").Router();
const personController = require("../controllers/personController");
const authorize = require("../middleware/authMiddleware");
const pool = require("../config/db");
const checkPermission = require("../middleware/permissionMiddleware");

// --- Middleware: Infer Tree ID from Person ID ---
// We need this because checkPermission expects req.params.treeId, 
// but person routes usually just have :id (personId)
const inferTreeContext = async (req, res, next) => {
  try {
    const personId = req.params.id;
    if (!personId) return next();

    const result = await pool.query("SELECT tree_id FROM people WHERE id = $1", [personId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Person not found" });

    // Inject treeId into params so checkPermission can see it
    req.params.treeId = result.rows[0].tree_id; 
    next();
  } catch (err) {
    res.status(500).send("Server Error resolving context");
  }
};


// 1. Get Details
// Needs 'viewer' access
router.get("/:id/details", authorize, inferTreeContext, checkPermission('viewer'), personController.getPersonDetails);

// 2. Add Relatives
// Needs 'editor' access
router.post("/:id/spouse", authorize, inferTreeContext, checkPermission('editor'), personController.addSpouse);
router.post("/:id/child", authorize, inferTreeContext, checkPermission('editor'), personController.addChild);
router.post("/:id/parent", authorize, inferTreeContext, checkPermission('editor'), personController.addParent);

// 3. Update / Delete
// Needs 'editor' access
router.put("/:id", authorize, inferTreeContext, checkPermission('editor'), personController.updatePerson);
router.delete("/:id", authorize, inferTreeContext, checkPermission('editor'), personController.deletePerson);

module.exports = router;