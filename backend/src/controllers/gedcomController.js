const fs = require('fs');
const gedcomParser = require('parse-gedcom');
const parse = gedcomParser.parse || gedcomParser; 

const mongoose = require('mongoose');
const Tree = require('../models/Tree');
const Member = require('../models/Member');

// --- HELPERS (Import) ---

const parseGedcomDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

const cleanID = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') return (val.value || val.data || '').toString().trim();
  return String(val).trim();
};

const getFamData = (node, tagName) => {
  const children = node.tree || node.children || [];
  const found = children.find(child => {
      const t = child.tag || child.type;
      return t && t.trim().toUpperCase() === tagName;
  });
  if (found && (found.data.pointer)) {    
    return String(found.data.pointer).trim();
  }
  return null;
};

const getIndiData = (node, tagName) => {
  const children = node.tree || node.children || [];
  const found = children.find(child => {
      const t = child.tag || child.type;
      return t && t.trim().toUpperCase() === tagName;
  });
  if (found && (found.value)) {    
    return String(found.value || found.data).trim();
  }
  return null;
};

const findSubNode = (node, tagName) => {
  const children = node.tree || node.children || [];
  return children.find(child => {
      const t = child.tag || child.type;
      return t && t.trim().toUpperCase() === tagName;
  });
};

// --- HELPERS (Export) ---

const formatGedcomDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  // Format: 10 JAN 1990
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

// ---------------------------

const importGedcom = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // 1. Read & Clean
    let fileContent = fs.readFileSync(req.file.path, 'utf-8').trim();
    if (fileContent.charCodeAt(0) === 0xFEFF) fileContent = fileContent.slice(1);

    let gedcom = parse(fileContent);

    console.log("Parsed GEDCOM:", gedcom);

    // Normalize
    if (!Array.isArray(gedcom)) {
      if (gedcom.children && Array.isArray(gedcom.children)) gedcom = gedcom.children;
      else if (gedcom.tree && Array.isArray(gedcom.tree)) gedcom = gedcom.tree;
      else {
        const values = Object.values(gedcom);
        if (values.length > 0 && (values[0].tag || values[0].pointer)) gedcom = values;
        else throw new Error("Could not extract nodes from GEDCOM.");
      }
    }

    // 2. Create Tree
    const newTree = await Tree.create({
      name: req.body.treeName || 'Imported Tree',
      description: 'Imported via GEDCOM',
      ownerId: req.user.id,
      collaborators: []
    });

    const treeId = newTree._id;

    // --- MAPPING ---
    const indiMap = new Map(); 
    const families = [];

    // 3. PASS 1: Individuals
    gedcom.forEach(node => {
      let tag = node.tag || node.type;
      if (!tag) return;
      tag = tag.trim().toUpperCase(); 
      
      if (tag === 'INDI') {
        const gedcomId = cleanID(node.data.xref_id);
        
        let name = getIndiData(node, 'NAME') || 'Unknown';
        name = name.replace(/\//g, '').replace(/\s+/g, ' ').trim(); 
        
        let gender = 'male';
        const sex = getIndiData(node, 'SEX');
        if (sex === 'F') gender = 'female';
        else if (sex && sex !== 'M') gender = 'other';

        const birtNode = findSubNode(node, 'BIRT');
        const deathNode = findSubNode(node, 'DEAT');
        
        const birthDate = parseGedcomDate(birtNode ? getIndiData(birtNode, 'DATE') : null);
        const deathDate = parseGedcomDate(deathNode ? getIndiData(deathNode, 'DATE') : null);
        const isAlive = !deathDate && !deathNode;

        const memberDoc = new Member({
          _id: new mongoose.Types.ObjectId(),
          treeId: treeId,
          name,
          gender,
          birthDate,
          deathDate,
          isAlive,
          mid: null,
          fid: null,
          pids: [],
          img: "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png"
        });

        if (gedcomId) {
          indiMap.set(gedcomId, memberDoc);
        }

      } else if (tag === 'FAM') {
        families.push(node);
      }
    });

    // 4. PASS 2: Families
    families.forEach(fam => {
      const husbGedId = cleanID(getFamData(fam, 'HUSB'));
      const wifeGedId = cleanID(getFamData(fam, 'WIFE'));
      
      const childrenNodes = (fam.tree || fam.children || []).filter(n => {
          const t = n.tag || n.type;
          return t && t.trim().toUpperCase() === 'CHIL';
      });
      const chilGedIds = childrenNodes.map(n => cleanID(n.data.pointer));
      const husband = indiMap.get(husbGedId);
      const wife = indiMap.get(wifeGedId);

      if (husband && wife) {
        if (!husband.pids.includes(wife._id)) husband.pids.push(wife._id);
        if (!wife.pids.includes(husband._id)) wife.pids.push(husband._id);
      }

      chilGedIds.forEach(childId => {
        const child = indiMap.get(childId);
        if (child) {
          if (husband) child.fid = husband._id;
          if (wife) child.mid = wife._id;
        }
      });
    });

    // 5. Save
    const membersToSave = Array.from(indiMap.values());
    if (membersToSave.length > 0) {
      await Member.insertMany(membersToSave);
    }

    try { fs.unlinkSync(req.file.path); } catch (e) {}

    res.status(201).json({ message: 'Import successful', treeId });

  } catch (error) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ message: 'Import failed: ' + error.message });
  }
};

// ... (Keep existing imports and helpers)

// @desc    Export Tree to GEDCOM
// @route   GET /api/gedcom/export/:treeId
// @access  Private
const exportGedcom = async (req, res) => {
  try {
    const members = await Member.find({ treeId: req.params.treeId });
    const tree = await Tree.findById(req.params.treeId);

    if (!members.length) return res.status(404).json({ message: "Tree empty" });

    // --- PRE-CALCULATION PHASE ---

    // 1. Map Mongo IDs to GEDCOM IDs (@I1@)
    // We use .toString() to ensure strictly String keys
    const idMap = new Map();
    members.forEach((m, index) => idMap.set(m._id.toString(), `@I${index + 1}@`));

    // 2. Build Family Structure & Assign Family IDs (@F1@)
    // Key: "fid_mid" string, Value: Family Object
    const familyMap = new Map();
    let famCounter = 1;

    // Helper to get or create a family group
    const getOrCreateFamily = (fid, mid) => {
      const fidStr = fid ? fid.toString() : 'U';
      const midStr = mid ? mid.toString() : 'U';
      const key = `${fidStr}_${midStr}`;

      if (!familyMap.has(key)) {
        familyMap.set(key, {
          id: `@F${famCounter++}@`,
          husb: fid ? fid.toString() : null,
          wife: mid ? mid.toString() : null,
          children: []
        });
      }
      return familyMap.get(key);
    };

    // 3. Link Children to Families AND Record Links for Individuals
    const indiLinks = new Map(); // Key: GedcomID, Value: { famc: null, fams: [] }

    // Initialize link tracker for everyone
    members.forEach(m => {
      indiLinks.set(idMap.get(m._id.toString()), { famc: null, fams: [] });
    });

    members.forEach(m => {
      // If member has parents, add them to that family as a child
      if (m.fid || m.mid) {
        const fam = getOrCreateFamily(m.fid, m.mid);
        fam.children.push(m._id.toString());
        
        // Link Child -> Family (FAMC)
        const childGedId = idMap.get(m._id.toString());
        if (indiLinks.has(childGedId)) {
          indiLinks.get(childGedId).famc = fam.id;
        }
      }
    });

    // 4. Link Spouses -> Families (FAMS)
    // Iterate over the families we just created to link parents
    familyMap.forEach(fam => {
      if (fam.husb) {
        const husbGedId = idMap.get(fam.husb);
        if (indiLinks.has(husbGedId)) indiLinks.get(husbGedId).fams.push(fam.id);
      }
      if (fam.wife) {
        const wifeGedId = idMap.get(fam.wife);
        if (indiLinks.has(wifeGedId)) indiLinks.get(wifeGedId).fams.push(fam.id);
      }
    });

    // --- WRITING PHASE ---

    let gedcom = [
      '0 HEAD',
      '1 CHAR UTF-8',
      '1 SOUR LegacyBuilder',
      '1 GEDC',
      '2 VERS 5.5.1',
      '2 FORM LINEAGE-LINKED',
      '1 SUBM @SUBM@'
    ];

    gedcom.push('0 @SUBM@ SUBM');
    gedcom.push(`1 NAME ${req.user ? req.user.name : 'LegacyBuilder User'}`);

    // 5. Write Individuals
    members.forEach((m) => {
      const id = idMap.get(m._id.toString());
      const links = indiLinks.get(id);

      gedcom.push(`0 ${id} INDI`);
      
      const cleanName = m.name.trim();
      const parts = cleanName.split(' ');
      const surname = parts.length > 1 ? parts.pop() : '';
      const givenName = parts.join(' ');
      gedcom.push(`1 NAME ${givenName} /${surname}/`);
      
      gedcom.push(`1 SEX ${m.gender === 'female' ? 'F' : 'M'}`);
      
      if (m.birthDate) {
        const bDate = formatGedcomDate(m.birthDate);
        if (bDate) {
          gedcom.push('1 BIRT');
          gedcom.push(`2 DATE ${bDate}`);
        }
      }

      // Add Family Links (Standard GEDCOM Order: Birt, Deat, Famc, Fams)
      if (links && links.famc) {
        gedcom.push(`1 FAMC ${links.famc}`);
      }
      if (links && links.fams.length > 0) {
        links.fams.forEach(famId => gedcom.push(`1 FAMS ${famId}`));
      }
    });

    // 6. Write Families
    familyMap.forEach(fam => {
      gedcom.push(`0 ${fam.id} FAM`);
      
      if (fam.husb) {
        const hId = idMap.get(fam.husb);
        if (hId) gedcom.push(`1 HUSB ${hId}`);
      }
      
      if (fam.wife) {
        const wId = idMap.get(fam.wife);
        if (wId) gedcom.push(`1 WIFE ${wId}`);
      }

      fam.children.forEach(childId => {
        const cId = idMap.get(childId);
        if (cId) gedcom.push(`1 CHIL ${cId}`);
      });
    });

    gedcom.push('0 TRLR');

    // Send
    const gedcomString = gedcom.join('\n');
    const filename = (tree.name || 'family_tree').replace(/[^a-z0-9]/gi, '_').toLowerCase();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.ged`);
    res.send(gedcomString);

  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { importGedcom, exportGedcom };