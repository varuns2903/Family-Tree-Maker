const Tree = require('../models/Tree');
const Member = require('../models/Member'); // Needed for cascade delete

// @desc    Get all trees (Owned + Shared)
// @route   GET /api/trees
// @access  Private
const getTrees = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Query: Find trees where user is Owner OR Collaborator
    let trees = await Tree.find({
      $or: [
        { ownerId: userId },
        { 'collaborators.user': userId }
      ]
    })
      .populate('ownerId', 'name email') // Get owner details for shared trees
      .populate('collaborators.user', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    // 2. Member Counts Logic (Same as before)
    const treeIds = trees.map(t => t._id);
    const counts = await Member.aggregate([
      { $match: { treeId: { $in: treeIds } } },
      { $group: { _id: "$treeId", count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id] = c.count; });

    // 3. Process Trees to add 'currentUserRole'
    trees = trees.map(tree => {
      let role = 'viewer'; // Default fallback

      // Check if Owner
      // Note: ownerId might be an object due to populate, or string
      const ownerIdStr = tree.ownerId._id ? tree.ownerId._id.toString() : tree.ownerId.toString();
      
      if (ownerIdStr === userId) {
        role = 'owner';
      } else {
        // Check Collaborator List
        const collab = tree.collaborators.find(c => 
          (c.user._id ? c.user._id.toString() : c.user.toString()) === userId
        );
        if (collab) role = collab.role;
      }

      return {
        ...tree,
        membersCount: countMap[tree._id] || 0,
        currentUserRole: role // <--- FIELD FOR FRONTEND
      };
    });

    res.status(200).json(trees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new tree
// @route   POST /api/trees
// @access  Private
const createTree = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Please add a tree name');
    }

    const tree = await Tree.create({
      ownerId: req.user.id, // Comes from authMiddleware
      name,
      description,
    });

    res.status(201).json(tree);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get a single tree by ID (Owner OR Collaborator)
// @route   GET /api/trees/:id
// @access  Private
const getTreeById = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      res.status(404);
      throw new Error('Tree not found');
    }

    const userId = req.user.id;

    // 1. Check if Owner
    const isOwner = tree.ownerId.toString() === userId;

    // 2. Check if Collaborator
    const isCollaborator = tree.collaborators.some(
      (c) => c.user.toString() === userId
    );

    // 3. Allow access if EITHER is true
    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Not authorized to view this tree');
    }

    res.status(200).json(tree);
  } catch (error) {
    const statusCode = res.statusCode === 200 ? 400 : res.statusCode;
    res.status(statusCode).json({ message: error.message });
  }
};

// @desc    Update a tree (Name/Description)
// @route   PUT /api/trees/:id
// @access  Private (Owner OR Editor)
const updateTree = async (req, res) => {
  try {
    const { name, description } = req.body;

    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      res.status(404);
      throw new Error('Tree not found');
    }

    // --- FIX STARTS HERE ---
    
    const userId = req.user.id;
    
    // 1. Check if Owner
    const isOwner = tree.ownerId.toString() === userId;
    
    // 2. Check if Editor
    const isEditor = tree.collaborators.some(
      (c) => c.user.toString() === userId && c.role === 'editor'
    );

    // 3. Allow if EITHER is true
    if (!isOwner && !isEditor) {
      res.status(403); // 403 Forbidden is better than 401 for permission issues
      throw new Error('Not authorized to update tree details');
    }

    // Update allowed fields
    if (name) tree.name = name;
    if (description !== undefined) tree.description = description;

    const updatedTree = await tree.save();

    res.status(200).json(updatedTree);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete tree and all its members
// @route   DELETE /api/trees/:id
// @access  Private
const deleteTree = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      res.status(404);
      throw new Error('Tree not found');
    }

    // Check user ownership
    if (tree.ownerId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // CASCADE DELETE: Remove all members associated with this tree first
    await Member.deleteMany({ treeId: tree._id });

    // Remove the tree itself
    // Note: In newer Mongoose versions use deleteOne()
    await tree.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Tree and all members deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Join a tree via Share Token
// @route   POST /api/trees/join/:shareToken
const joinTree = async (req, res) => {
  try {
    const { shareToken } = req.params;
    const tree = await Tree.findOne({ shareToken });

    if (!tree) {
      res.status(404);
      throw new Error('Invalid or expired invite link');
    }

    const userId = req.user._id;

    // Check if owner
    if (tree.ownerId.toString() === userId.toString()) {
      return res.status(200).json({ message: 'You are the owner', treeId: tree._id });
    }

    // Check if already a collaborator
    const exists = tree.collaborators.find(c => c.user.toString() === userId.toString());
    if (exists) {
      return res.status(200).json({ message: 'Already joined', treeId: tree._id });
    }

    // Add as Viewer
    tree.collaborators.push({ user: userId, role: 'viewer' });
    await tree.save();

    res.status(200).json({ message: 'Joined tree successfully', treeId: tree._id });
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get List of Collaborators
// @route   GET /api/trees/:id/collaborators
const getCollaborators = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id)
      .populate('collaborators.user', 'name email') // Fetch names
      .select('collaborators shareToken ownerId');

    res.status(200).json({
      shareToken: tree.shareToken,
      isOwner: req.user._id.equals(tree.ownerId), // Helper flag for frontend
      collaborators: tree.collaborators
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manage Roles (Promote, Demote, Remove, Request)
// @route   PUT /api/trees/:id/role
const manageRole = async (req, res) => {
  try {
    const { userId, action, role } = req.body; // action: 'update' | 'remove' | 'request'
    const tree = await Tree.findById(req.params.id);

    // CASE 1: User requesting edit access for themselves
    if (action === 'request') {
      const me = tree.collaborators.find(c => c.user.toString() === req.user._id.toString());
      if (me) {
        me.requestedEdit = true;
        await tree.save();
        return res.status(200).json({ message: 'Request sent' });
      }
    }

    // CASE 2: Owner Managing Others
    if (!req.user._id.equals(tree.ownerId)) {
      res.status(403);
      throw new Error('Only the owner can manage roles');
    }

    if (action === 'remove') {
      tree.collaborators = tree.collaborators.filter(c => c.user.toString() !== userId);
    }
    else if (action === 'add') {
        // Check if already exists to prevent duplicates
        const exists = tree.collaborators.find(c => c.user.toString() === userId);
        if (exists) {
            return res.status(400).json({ message: "User is already a collaborator" });
        }
        // Add new collaborator
        tree.collaborators.push({ user: userId, role: role || 'viewer', requestedEdit: false });
    }
    else if (action === 'update') {
      const collab = tree.collaborators.find(c => c.user.toString() === userId);
      if (collab) {
        if (role) collab.role = role;
        collab.requestedEdit = false; // Clear request flag if role updated
      }
    }

    await tree.save();
    // Return updated list so frontend can refresh UI
    const updatedTree = await Tree.findById(req.params.id).populate('collaborators.user', 'name email');
    res.status(200).json(updatedTree.collaborators);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getTrees,
  createTree,
  getTreeById,
  updateTree,
  deleteTree,
  joinTree,
  getCollaborators,
  manageRole
};