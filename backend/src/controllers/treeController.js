const pool = require("../config/db");
const treeService = require("../services/treeService");

// --- GET ALL TREES (Owned + Shared) ---
exports.getAllTrees = async (req, res) => {
  try {
    const userId = req.user.id;

    const trees = await pool.query(
      `SELECT t.id, t.name, t.created_at, 'owner' as role 
       FROM trees t WHERE t.user_id = $1
       UNION
       SELECT t.id, t.name, t.created_at, tc.role 
       FROM trees t 
       JOIN tree_collaborators tc ON t.id = tc.tree_id 
       WHERE tc.user_id = $1`,
      [userId]
    );

    res.json(trees.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- CREATE NEW TREE ---
exports.createTree = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Insert new tree
    const newTree = await pool.query(
      "INSERT INTO trees (user_id, name) VALUES ($1, $2) RETURNING *",
      [userId, name]
    );

    res.json(newTree.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- GET SINGLE TREE DETAILS ---
exports.getTree = async (req, res) => {
  try {
    const { id } = req.params; // treeId
    
    const tree = await pool.query("SELECT * FROM trees WHERE id = $1", [id]);
    
    // We can also fetch the root member stats here if needed
    const memberCount = await pool.query("SELECT count(*) FROM people WHERE tree_id = $1", [id]);

    res.json({ 
      ...tree.rows[0], 
      currentUserRole: req.userRole, // Injected by permissionMiddleware
      totalMembers: memberCount.rows[0].count 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- ADD ROOT MEMBER (The First Person) ---
// This handles the specific case of initializing an empty tree
exports.addRootMember = async (req, res) => {
  try {
    const { id } = req.params; // treeId
    
    // Destructure ALL possible fields from the body
    const { 
      name, 
      gender, 
      birthDate, 
      deathDate, 
      isAlive, 
      contactInfo 
    } = req.body;

    // 1. Check if tree already has members
    const existing = await pool.query("SELECT id FROM people WHERE tree_id = $1", [id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Tree is not empty. Use 'Add Relative' instead." });
    }

    // 2. Insert the new person with all fields
    // Note: We use COALESCE or defaults in the DB, but passing them explicitly is safer
    // is_placeholder defaults to FALSE in DB, so we don't need to pass it for a root creation
    const newPerson = await pool.query(
      `INSERT INTO people (
         tree_id, 
         name, 
         gender, 
         birth_date, 
         death_date, 
         is_alive, 
         contact_info
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        id, 
        name, 
        gender, 
        birthDate || null,   // Handle empty strings/undefined as null
        deathDate || null, 
        isAlive !== undefined ? isAlive : true, // Default to true if not sent
        contactInfo || null
      ]
    );

    res.json(newPerson.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- GET FULL TREE (Nested JSON) ---
exports.getNestedTree = async (req, res) => {
  try {
    const { id } = req.params; // treeId
    
    // The permission middleware has already checked if we can view this tree
    const treeData = await treeService.getFullTreeJSON(id);
    
    if (!treeData) {
      // If tree exists but has no people, return empty object or specific message
      return res.json({ message: "Tree is empty", root: null });
    }

    res.json(treeData);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error building tree");
  }
};