const router = require("express").Router({ mergeParams: true }); 
// mergeParams is crucial so we can access :treeId from the parent router

const collabController = require("../controllers/collaboratorController");
const authorize = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/permissionMiddleware");

// Routes will look like: /api/trees/:treeId/share/...

// List all people shared with
router.get("/", authorize, checkPermission('owner'), collabController.getCollaborators);

// Add/Edit a collaborator
router.post("/", authorize, checkPermission('owner'), collabController.addCollaborator);

// Remove a collaborator
router.delete("/:userId", authorize, checkPermission('owner'), collabController.removeCollaborator);

// Viewer: Request Access
router.post("/request", authorize, collabController.requestAccess);

// Owner: View Requests
router.get("/requests", authorize, checkPermission('owner'), collabController.getPendingRequests);

// Owner: Approve/Reject
router.post("/requests/:requestId", authorize, checkPermission('owner'), collabController.handleRequest);

// ... existing routes
module.exports = router;