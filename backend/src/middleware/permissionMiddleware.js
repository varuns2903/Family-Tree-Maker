const pool = require("../config/db");

// checkPermission('viewer') => Allows Owner, Editors, Explicit Viewers, AND Random Logged-in Users
// checkPermission('editor') => Allows Owner, Editors ONLY
const checkPermission = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // 1. Get Tree ID safely
      const treeId = req.params.treeId || (req.body && req.body.treeId) || req.params.id;
      const userId = req.user.id; 

      if (!treeId) return res.status(400).json({ message: "Tree ID is required" });

      // 2. Check if user is the OWNER
      const tree = await pool.query("SELECT user_id FROM trees WHERE id = $1", [treeId]);
      
      if (tree.rows.length === 0) {
        return res.status(404).json({ message: "Tree not found" });
      }

      if (tree.rows[0].user_id === userId) {
        req.userRole = 'owner';
        return next(); // Owner has full access
      }

      // 3. Check if user is an EXPLICIT COLLABORATOR (in the DB)
      const collaborator = await pool.query(
        "SELECT role FROM tree_collaborators WHERE tree_id = $1 AND user_id = $2",
        [treeId, userId]
      );

      if (collaborator.rows.length > 0) {
        // User was specifically invited
        const userRole = collaborator.rows[0].role;
        req.userRole = userRole;

        // Check if their specific role is strong enough
        if (requiredRole === 'editor' && userRole === 'viewer') {
          return res.status(403).json({ message: "Edit permission required" });
        }
        return next();
      }

      // 4. "PUBLIC VIEW" LOGIC (The Change)
      // If user is NOT owner and NOT invited...
      
      if (requiredRole === 'viewer') {
        // ...but they only want to VIEW, let them in!
        req.userRole = 'viewer'; 
        return next();
      } else {
        // ...but they want to EDIT, block them!
        return res.status(403).json({ message: "You need permission to edit this tree." });
      }

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error in Permission Check");
    }
  };
};

module.exports = checkPermission;