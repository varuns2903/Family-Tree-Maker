const Tree = require('../models/Tree');

// @desc    Check if user has specific permission level for a tree
// @params  requiredRole: 'viewer' | 'editor' | 'owner'
const checkAccess = (requiredRole) => async (req, res, next) => {
  try {
    // Handle different route param names (treeId for members routes, id for tree routes)
    const treeId = req.params.treeId || req.params.id;
    
    const tree = await Tree.findById(treeId);
    if (!tree) {
      res.status(404);
      throw new Error('Tree not found');
    }

    const userId = req.user._id.toString();
    const ownerId = tree.ownerId.toString();

    // 1. OWNER: Has access to everything
    if (userId === ownerId) {
      req.treeRole = 'owner'; // Attach role to request for later use
      return next();
    }

    // 2. CHECK COLLABORATORS
    const collaborator = tree.collaborators.find(c => c.user.toString() === userId);

    if (!collaborator) {
      res.status(403);
      throw new Error('You do not have access to this tree');
    }

    // 3. CHECK ROLE LEVEL
    // If route requires 'owner', fail (since we passed check #1)
    if (requiredRole === 'owner') {
      res.status(403);
      throw new Error('Only the owner can perform this action');
    }

    // If route requires 'editor', ensure user is editor
    if (requiredRole === 'editor' && collaborator.role !== 'editor') {
      res.status(403);
      throw new Error('View only access. You must be an Editor.');
    }

    // If route requires 'viewer', both 'viewer' and 'editor' pass
    req.treeRole = collaborator.role;
    next();

  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

module.exports = { checkAccess };