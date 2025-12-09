const Tree = require('../models/Tree');
const Member = require('../models/Member'); // Needed for cascade delete

// @desc    Get all trees for the logged-in user (with member count)
// @route   GET /api/trees
// @access  Private
const getTrees = async (req, res) => {
  try {
    let trees = await Tree.find({ ownerId: req.user.id })
      .sort({ updatedAt: -1 })
      .lean(); // returns plain JS objects → allows adding custom fields

    // Add member count for each tree
    const treeIds = trees.map(t => t._id);
    const counts = await Member.aggregate([
      { $match: { treeId: { $in: treeIds } } },
      { $group: { _id: "$treeId", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id] = c.count;
    });

    trees = trees.map(tree => ({
      ...tree,
      membersCount: countMap[tree._id] || 0
    }));

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

// @desc    Get a single tree by ID (to verify ownership)
// @route   GET /api/trees/:id
// @access  Private
const getTreeById = async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      res.status(404);
      throw new Error('Tree not found');
    }

    // Ensure the logged-in user owns this tree
    if (tree.ownerId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized');
    }

    res.status(200).json(tree);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a tree
// @route   PUT /api/trees/:id
// @access  Private
const updateTree = async (req, res) => {
  try {
    const { name, description } = req.body;

    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      res.status(404);
      throw new Error('Tree not found');
    }

    // Ensure user owns the tree
    if (tree.ownerId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized');
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

module.exports = {
  getTrees,
  createTree,
  getTreeById,
  updateTree,
  deleteTree,
};