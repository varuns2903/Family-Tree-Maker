const pool = require("../config/db");

// --- ADD COLLABORATOR ---
exports.addCollaborator = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { email, role } = req.body; // role = 'editor' or 'viewer'

    // 1. Find User by Email
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User with this email does not exist." });
    }
    const userIdToAdd = userRes.rows[0].id;

    // 2. Prevent Owner from adding themselves
    const treeRes = await pool.query("SELECT user_id FROM trees WHERE id = $1", [treeId]);
    if (treeRes.rows[0].user_id === userIdToAdd) {
      return res.status(400).json({ message: "You are already the owner." });
    }

    // 3. Insert into Collaborators
    // ON CONFLICT UPDATE handles if they are already shared (updates role)
    const newCollab = await pool.query(
      `INSERT INTO tree_collaborators (tree_id, user_id, role) 
       VALUES ($1, $2, $3)
       ON CONFLICT (tree_id, user_id) 
       DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [treeId, userIdToAdd, role]
    );

    res.json(newCollab.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- REMOVE COLLABORATOR ---
exports.removeCollaborator = async (req, res) => {
  try {
    const { treeId, userId } = req.params;

    // Only owner can do this (Handled by middleware checkPermission('owner'))
    await pool.query(
      "DELETE FROM tree_collaborators WHERE tree_id = $1 AND user_id = $2",
      [treeId, userId]
    );

    res.json({ message: "Collaborator removed" });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- LIST COLLABORATORS ---
exports.getCollaborators = async (req, res) => {
  try {
    const { treeId } = req.params;

    const result = await pool.query(`
      SELECT tc.id, tc.role, u.id as user_id, u.name, u.email 
      FROM tree_collaborators tc
      JOIN users u ON u.id = tc.user_id
      WHERE tc.tree_id = $1
    `, [treeId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- 1. VIEWER: Request Access ---
exports.requestAccess = async (req, res) => {
  try {
    const { treeId } = req.params;
    const userId = req.user.id;

    // Check if already an editor
    const existing = await pool.query(
      "SELECT role FROM tree_collaborators WHERE tree_id = $1 AND user_id = $2",
      [treeId, userId]
    );
    if (existing.rows.length > 0 && existing.rows[0].role === 'editor') {
      return res.status(400).json({ message: "You are already an editor." });
    }

    // Create Request
    await pool.query(
      `INSERT INTO access_requests (tree_id, user_id) VALUES ($1, $2)
       ON CONFLICT (tree_id, user_id) DO NOTHING`,
      [treeId, userId]
    );

    res.json({ message: "Request sent to owner." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- 2. OWNER: Get Pending Requests ---
exports.getPendingRequests = async (req, res) => {
  try {
    const { treeId } = req.params;
    
    const requests = await pool.query(`
      SELECT ar.id, u.name, u.email, u.id as user_id
      FROM access_requests ar
      JOIN users u ON u.id = ar.user_id
      WHERE ar.tree_id = $1 AND ar.status = 'pending'
    `, [treeId]);

    res.json(requests.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- 3. OWNER: Approve/Reject Request ---
exports.handleRequest = async (req, res) => {
  try {
    const { treeId, requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    // Get request details
    const reqData = await pool.query("SELECT user_id FROM access_requests WHERE id = $1", [requestId]);
    if (reqData.rows.length === 0) return res.status(404).json({ message: "Request not found" });
    
    const requesterId = reqData.rows[0].user_id;

    if (action === 'approve') {
      // Add to collaborators as Editor
      await pool.query(
        `INSERT INTO tree_collaborators (tree_id, user_id, role) 
         VALUES ($1, $2, 'editor')
         ON CONFLICT (tree_id, user_id) DO UPDATE SET role = 'editor'`,
        [treeId, requesterId]
      );
    }

    // Delete the request (or set status to 'approved'/'rejected' if you want history)
    // Here we delete it to keep it simple
    await pool.query("DELETE FROM access_requests WHERE id = $1", [requestId]);

    res.json({ message: `Request ${action}d` });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};