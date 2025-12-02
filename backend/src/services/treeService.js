const pool = require("../config/db");

const fetchTreeData = async (treeId) => {
  const people = await pool.query("SELECT * FROM people WHERE tree_id = $1", [treeId]);
  const unions = await pool.query("SELECT * FROM unions WHERE tree_id = $1", [treeId]);
  
  const links = await pool.query(`
    SELECT uc.union_id, uc.child_id 
    FROM union_children uc
    JOIN unions u ON u.id = uc.union_id
    WHERE u.tree_id = $1
  `, [treeId]);

  return { people: people.rows, unions: unions.rows, links: links.rows };
};

const buildNestedTree = (people, unions, links) => {
  const personMap = {};
  
  // 1. Initialize Everyone (Create the Enriched Objects)
  people.forEach(p => {
    personMap[p.id] = { ...p, spouses: [] };
  });

  // 2. Map Children IDs to Union IDs
  const unionChildrenMap = {};
  links.forEach(l => {
    if (!unionChildrenMap[l.union_id]) unionChildrenMap[l.union_id] = [];
    unionChildrenMap[l.union_id].push(l.child_id);
  });

  // 3. Process Unions (Update the Enriched Objects in personMap)
  unions.forEach(u => {
    const partnerA = personMap[u.partner_a_id];
    const partnerB = u.partner_b_id ? personMap[u.partner_b_id] : null; 
    
    const childrenIDs = unionChildrenMap[u.id] || [];
    // CRITICAL: Map children IDs to the ENRICHED objects in personMap
    const childrenObjects = childrenIDs.map(id => personMap[id]).filter(Boolean);

    // Link A -> B
    if (partnerA) {
      partnerA.spouses.push({
        id: partnerB?.id || null,
        name: partnerB?.name || "Unknown",
        gender: partnerB?.gender || "unknown",
        birth_date: partnerB?.birth_date || null,
        death_date: partnerB?.death_date || null,
        is_alive: partnerB?.is_alive || null,
        contact_info: partnerB?.contact_info || null,
        photoUrl: partnerB?.photo_url || null,
        unionId: u.id,
        children: childrenObjects 
      });
    }

    // Link B -> A
    if (partnerB) {
      partnerB.spouses.push({
        id: partnerA?.id || null,
        name: partnerA?.name || "Unknown",
        gender: partnerA?.gender || "unknown",
        birth_date: partnerA?.birth_date || null,
        death_date: partnerA?.death_date || null,
        is_alive: partnerA?.is_alive || null,
        contact_info: partnerA?.contact_info || null,
        photoUrl: partnerA?.photo_url || null,
        unionId: u.id,
        children: childrenObjects
      });
    }
  });

  // 4. Find Root (Logic uses raw IDs)
  const allChildIds = new Set(links.map(l => l.child_id));
  const rootCandidates = people.filter(p => !allChildIds.has(p.id));

  // --- THE FIX ---
  // We found the correct *ID* of the root, but we must return the 
  // *Object* from personMap, because that's the one containing the 'spouses' array.
  
  if (rootCandidates.length > 0) {
    const rootId = rootCandidates[0].id;
    return personMap[rootId]; // <--- RETURN THE ENRICHED OBJECT
  }

  return null; 
};

exports.getFullTreeJSON = async (treeId) => {
  const { people, unions, links } = await fetchTreeData(treeId);
  
  if (people.length === 0) return { message: "Tree is empty", root: null };
  
  const treeRoot = buildNestedTree(people, unions, links);
  return { root: treeRoot };
};