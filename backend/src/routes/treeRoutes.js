const router = require("express").Router();
const treeController = require("../controllers/treeController");
const authorize = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/permissionMiddleware");

// All routes here require login ('authorize')

// GET /api/trees/ -> List all my trees
router.get("/", authorize, treeController.getAllTrees);

// POST /api/trees/ -> Create new tree
router.post("/", authorize, treeController.createTree);

// GET /api/trees/:id -> Get specific tree details
// Requires at least 'viewer' permission
router.get("/:id", authorize, checkPermission('viewer'), treeController.getTree);

// POST /api/trees/:id/root -> Add the FIRST member
// Requires 'editor' permission (or owner)
router.post("/:id/root", authorize, checkPermission('editor'), treeController.addRootMember);

// GET /api/trees/:id/full -> Get the recursive JSON structure
router.get("/:id/full", authorize, checkPermission('viewer'), treeController.getNestedTree);

module.exports = router;