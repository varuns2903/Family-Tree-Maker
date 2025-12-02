const pool = require("../config/db");

// --- 1. GET PERSON DETAILS (The "One-Stop" Query) ---
// Fetches the person, plus their parents, spouses, children, and siblings.
exports.getPersonDetails = async (req, res) => {
  try {
    const { id } = req.params;    

    // A. Basic Info
    const personRes = await pool.query("SELECT * FROM people WHERE id = $1", [id]);
    if (personRes.rows.length === 0) return res.status(404).json({ message: "Person not found" });
    const person = personRes.rows[0];

    // B. Get Parents (Go UP via union_children -> unions -> partners)
    // We look for unions where this person is a child, then find the partners of that union
    const parentsRes = await pool.query(`
      SELECT p.id, p.name, p.gender, p.is_placeholder 
      FROM people p
      JOIN unions u ON (u.partner_a_id = p.id OR u.partner_b_id = p.id)
      JOIN union_children uc ON uc.union_id = u.id
      WHERE uc.child_id = $1
    `, [id]);

    // C. Get Spouses (Go SIDEWAYS via unions)
    // We look for unions where this person is Partner A or Partner B
    const spousesRes = await pool.query(`
      SELECT p.id, p.name, p.gender, p.is_placeholder, u.id as union_id, u.marriage_date 
      FROM people p
      JOIN unions u ON (u.partner_a_id = p.id OR u.partner_b_id = p.id)
      WHERE (u.partner_a_id = $1 OR u.partner_b_id = $1)
      AND p.id != $1
    `, [id]);

    // D. Get Children (Go DOWN via unions -> union_children)
    // We look for unions where this person is a partner, then find children of those unions
    const childrenRes = await pool.query(`
      SELECT p.id, p.name, p.gender, p.is_placeholder, uc.union_id 
      FROM people p
      JOIN union_children uc ON uc.child_id = p.id
      JOIN unions u ON u.id = uc.union_id
      WHERE u.partner_a_id = $1 OR u.partner_b_id = $1
    `, [id]);

    // E. Get Siblings (Go UP to parents, then DOWN to other children)
    // Children who share the same union_id as me
    const siblingsRes = await pool.query(`
      SELECT p.id, p.name, p.gender, p.is_placeholder 
      FROM people p
      JOIN union_children uc1 ON uc1.child_id = p.id
      WHERE uc1.union_id IN (
          SELECT union_id FROM union_children WHERE child_id = $1
      )
      AND p.id != $1
    `, [id]);

    res.json({
      ...person,
      parents: parentsRes.rows,
      spouses: spousesRes.rows,
      children: childrenRes.rows,
      siblings: siblingsRes.rows
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- 2. ADD SPOUSE (Smart Merge Version) ---
exports.addSpouse = async (req, res) => {
  try {
    const { id } = req.params; // Current Person ID (Person B)
    const { 
      name, gender, birthDate, deathDate, isAlive, contactInfo, marriageDate 
    } = req.body;

    // 1. Fetch Current Person Info
    const currentPersonRes = await pool.query("SELECT tree_id, gender FROM people WHERE id = $1", [id]);
    if (currentPersonRes.rows.length === 0) return res.status(404).json({ message: "Person not found" });
    const { tree_id, gender: currentGender } = currentPersonRes.rows[0];

    // 2. Gender Validation
    if (currentGender === 'male' && gender !== 'female') return res.status(400).json({ message: "Invalid gender." });
    if (currentGender === 'female' && gender !== 'male') return res.status(400).json({ message: "Invalid gender." });

    // 3. Create the New Spouse (Person C)
    const newSpouse = await pool.query(
      `INSERT INTO people (tree_id, name, gender, birth_date, death_date, is_alive, contact_info) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tree_id, name, gender, birthDate || null, deathDate || null, isAlive !== undefined ? isAlive : true, contactInfo || null]
    );
    const spouseId = newSpouse.rows[0].id;

    // --- THE FIX STARTS HERE ---

    // 4. Check for an existing "Single Parent" Union for Person B
    // We look for a union where B is a partner, but the OTHER partner is NULL.
    const singleParentUnion = await pool.query(
      `SELECT id, partner_a_id, partner_b_id 
       FROM unions 
       WHERE (partner_a_id = $1 AND partner_b_id IS NULL) 
          OR (partner_b_id = $1 AND partner_a_id IS NULL)`,
      [id]
    );

    if (singleParentUnion.rows.length > 0) {
      // SCENARIO: MERGE INTO EXISTING UNION
      // Person B is already a "Single Parent" to someone (like A).
      // Instead of creating a new marriage, we put Person C into the empty slot.
      const unionId = singleParentUnion.rows[0].id;
      const union = singleParentUnion.rows[0];

      if (union.partner_a_id === null) {
        await pool.query("UPDATE unions SET partner_a_id = $1, marriage_date = $2 WHERE id = $3", [spouseId, marriageDate || null, unionId]);
      } else {
        await pool.query("UPDATE unions SET partner_b_id = $1, marriage_date = $2 WHERE id = $3", [spouseId, marriageDate || null, unionId]);
      }
      
      console.log(`Merged Spouse ${spouseId} into existing Single-Parent Union ${unionId}`);
    } 
    else {
      // SCENARIO: CREATE NEW UNION
      // Person B is not a single parent (or is already married to others).
      // Create a fresh marriage link.
      await pool.query(
        `INSERT INTO unions (tree_id, partner_a_id, partner_b_id, marriage_date) VALUES ($1, $2, $3, $4)`,
        [tree_id, id, spouseId, marriageDate || null]
      );
    }

    res.json(newSpouse.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- 3. ADD CHILD (Complete) ---
exports.addChild = async (req, res) => {
  try {
    const { id } = req.params; // The "Main" Parent ID
    
    // Destructure ALL fields + otherParentId
    const { 
      name, 
      gender, 
      birthDate, 
      deathDate,      // <-- Added
      isAlive,        // <-- Added
      contactInfo,    // <-- Added
      otherParentId 
    } = req.body;

    // 1. Fetch Parent Info
    const parentRes = await pool.query("SELECT tree_id FROM people WHERE id = $1", [id]);
    if (parentRes.rows.length === 0) return res.status(404).json({ message: "Person not found" });
    const tree_id = parentRes.rows[0].tree_id;

    let unionId;

    // 2. Determine Union (Explicit vs Inferred Logic)
    if (otherParentId) {
      // User explicitly selected the spouse
      const specificUnion = await pool.query(
        `SELECT id FROM unions 
         WHERE (partner_a_id = $1 AND partner_b_id = $2) 
            OR (partner_a_id = $2 AND partner_b_id = $1)`,
        [id, otherParentId]
      );

      if (specificUnion.rows.length === 0) {
        return res.status(400).json({ message: "These two people are not married/linked. Add spouse first." });
      }
      unionId = specificUnion.rows[0].id;
    } else {
      // Try to Infer
      const allUnions = await pool.query(
        "SELECT id FROM unions WHERE partner_a_id = $1 OR partner_b_id = $1",
        [id]
      );
      const count = allUnions.rows.length;

      if (count === 0) {
        const newUnion = await pool.query(
          "INSERT INTO unions (tree_id, partner_a_id) VALUES ($1, $2) RETURNING id",
          [tree_id, id]
        );
        unionId = newUnion.rows[0].id;
      } else if (count === 1) {
        unionId = allUnions.rows[0].id;
      } else {
        return res.status(400).json({ 
          message: "Ambiguous: Multiple spouses found. Please specify 'otherParentId'.",
          code: "MULTIPLE_SPOUSES"
        });
      }
    }

    // 3. Create Child (With ALL fields)
    const newChild = await pool.query(
      `INSERT INTO people (
         tree_id, name, gender, birth_date, death_date, is_alive, contact_info
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        tree_id, 
        name, 
        gender, 
        birthDate || null,
        deathDate || null, 
        isAlive !== undefined ? isAlive : true,
        contactInfo || null
      ]
    );
    const childId = newChild.rows[0].id;

    // 4. Link Child to Union
    await pool.query(
      "INSERT INTO union_children (union_id, child_id) VALUES ($1, $2)",
      [unionId, childId]
    );

    res.json(newChild.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- 4. UPDATE MEMBER ---
exports.updatePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, birthDate, deathDate, isAlive, contactInfo } = req.body;

    const updated = await pool.query(
      `UPDATE people 
       SET name = $1, gender = $2, birth_date = $3, death_date = $4, is_alive = $5, contact_info = $6
       WHERE id = $7 RETURNING *`,
      [name, gender, birthDate, deathDate, isAlive, contactInfo, id]
    );

    if (updated.rows.length === 0) return res.status(404).json({ message: "Person not found" });
    res.json(updated.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- 5. DELETE MEMBER (Cascade vs Keep) ---
exports.deletePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.query; // 'cascade' or 'keep'

    if (mode === 'keep') {
      // Option A: Anonymize (Ghost Node)
      await pool.query(
        `UPDATE people 
         SET name = 'Unknown', contact_info = NULL, birth_date = NULL, death_date = NULL, is_placeholder = TRUE 
         WHERE id = $1`,
        [id]
      );
      res.json({ message: "Member anonymized, descendants preserved." });

    } else if (mode === 'cascade') {
      // Option B: Hard Delete (DB Cascade handles links, but we might want to manually clean up children)
      // Note: Pure SQL 'ON DELETE CASCADE' on unions deletes the marriage record, 
      // but DOES NOT delete the children's `people` records. 
      // To truly cascade delete CHILDREN, we need a recursive query.
      
      // For simplicity in this MVP: We delete the person.
      // This will delete their marriage links. The children will become orphans in the DB (unconnected).
      // A full recursive delete is complex logic usually handled by a stored procedure or robust service function.
      
      await pool.query("DELETE FROM people WHERE id = $1", [id]);
      res.json({ message: "Member deleted." });
    } else {
      res.status(400).json({ message: "Invalid mode. Use ?mode=cascade or ?mode=keep" });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- 6. ADD PARENT ---
exports.addParent = async (req, res) => {
  try {
    const { id } = req.params; // Child ID
    
    // Destructure ALL fields
    const { 
      name, gender, birthDate, deathDate, isAlive, contactInfo, marriageDate 
    } = req.body;

    // 1. Fetch Child Info
    const childRes = await pool.query("SELECT tree_id FROM people WHERE id = $1", [id]);
    if (childRes.rows.length === 0) return res.status(404).json({ message: "Child not found" });
    const tree_id = childRes.rows[0].tree_id;

    // 2. Check if Child is already part of a Union (i.e., has parents)
    const unionLinkRes = await pool.query(
      "SELECT union_id FROM union_children WHERE child_id = $1", 
      [id]
    );

    let parentId;
    let unionId;

    // --- SCENARIO 1: No Parents exist (Create new Union) ---
    if (unionLinkRes.rows.length === 0) {
      
      // A. Create Parent
      const newParent = await pool.query(
        `INSERT INTO people (tree_id, name, gender, birth_date, death_date, is_alive, contact_info) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [tree_id, name, gender, birthDate || null, deathDate || null, isAlive !== undefined ? isAlive : true, contactInfo || null]
      );
      parentId = newParent.rows[0].id;

      // B. Create Union (Partner A = Parent, Partner B = NULL)
      const newUnion = await pool.query(
        `INSERT INTO unions (tree_id, partner_a_id, marriage_date) VALUES ($1, $2, $3) RETURNING id`,
        [tree_id, parentId, marriageDate || null]
      );
      unionId = newUnion.rows[0].id;

      // C. Link Child to Union
      await pool.query(
        "INSERT INTO union_children (union_id, child_id) VALUES ($1, $2)",
        [unionId, id]
      );

      return res.json(newParent.rows[0]);
    }

    // --- SCENARIO 2: Parents exist (Update existing Union) ---
    else {
      unionId = unionLinkRes.rows[0].union_id;
      
      // Fetch the Union to see who is already there
      const unionRes = await pool.query("SELECT * FROM unions WHERE id = $1", [unionId]);
      const union = unionRes.rows[0];

      // Check if Union is full
      if (union.partner_a_id && union.partner_b_id) {
        return res.status(400).json({ message: "Child already has two parents." });
      }

      // Check Gender Compatibility with existing parent
      const existingParentId = union.partner_a_id || union.partner_b_id;
      const existingParentRes = await pool.query("SELECT gender FROM people WHERE id = $1", [existingParentId]);
      const existingGender = existingParentRes.rows[0].gender;

      if (existingGender === 'male' && gender !== 'female') {
        return res.status(400).json({ message: "Existing father requires a female spouse." });
      }
      if (existingGender === 'female' && gender !== 'male') {
        return res.status(400).json({ message: "Existing mother requires a male spouse." });
      }

      // A. Create New Parent
      const newParent = await pool.query(
        `INSERT INTO people (tree_id, name, gender, birth_date, death_date, is_alive, contact_info) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [tree_id, name, gender, birthDate || null, deathDate || null, isAlive !== undefined ? isAlive : true, contactInfo || null]
      );
      parentId = newParent.rows[0].id;

      // B. Update the Union (Fill the empty slot)
      if (!union.partner_a_id) {
        await pool.query("UPDATE unions SET partner_a_id = $1 WHERE id = $2", [parentId, unionId]);
      } else {
        await pool.query("UPDATE unions SET partner_b_id = $1 WHERE id = $2", [parentId, unionId]);
      }

      return res.json(newParent.rows[0]);
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};