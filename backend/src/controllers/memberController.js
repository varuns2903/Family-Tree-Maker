const Member = require('../models/Member');

// @desc    Get all members for a specific tree (Formatted for Balkan JS)
// @route   GET /api/trees/:treeId/members
// @access  Private
const getMembers = async (req, res) => {
  try {    
    const { treeId } = req.params;    
    const members = await Member.find({ treeId });

    const nodes = members.map((m) => ({
      id: m._id,
      mid: m.mid,
      fid: m.fid,
      pids: m.pids,
      name: m.name,
      gender: m.gender,
      img: m.img,
      birthDate: m.birthDate,
      deathDate: m.deathDate,
      isAlive: m.isAlive,
      contactNo: m.contactNo,
      ...Object.fromEntries(m.data || new Map()) // Convert Map to object
    }));    

    res.status(200).json({
      role: req.treeRole || 'owner', 
      members: nodes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new member with smart relationship linking
// @route   POST /api/trees/:treeId/members
const addMember = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { 
      // Basic Info
      name, gender, birthDate, deathDate, isAlive, img, contactNo, data,
      // Relationship Context
      relativeId,     // The ID of the person you clicked "Add Relative" on
      relationType,   // 'child', 'spouse', 'father', 'mother', 'sibling'
      // Explicit Parents (New Logic for Multiple Spouses)
      mid, fid,
      // Explicit Partners
      pids,
      linkChildrenIds
    } = req.body;

    // 1. Prepare the new member object
    // We prioritize the explicit mid/fid if sent (e.g. from the "Select Parent" modal)
    let newMemberData = {
      treeId,
      name,
      gender,
      mid: mid || null, // Priority: Explicit ID
      fid: fid || null, // Priority: Explicit ID
      pids: pids || [],
      img: img || 'https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png',
      birthDate,
      deathDate: isAlive === false ? deathDate : null,
      isAlive: isAlive !== undefined ? isAlive : true,
      contactNo: contactNo || null,
      data: data || {}
    };    

    // 2. Resolve Relationships based on type (Fallback/Derivation Logic)
    if (relativeId && relationType) {
      const relative = await Member.findById(relativeId);
      if (!relative) throw new Error('Relative not found');

      switch (relationType) {
        
        // CASE: Add Child
        case 'child':
          // Only derive parents if they weren't explicitly provided
          if (!newMemberData.mid && !newMemberData.fid) {
            if (relative.gender === 'male') {
              newMemberData.fid = relative._id;
            } else {
              newMemberData.mid = relative._id;
            }
          }
          break;

        // CASE: Add Spouse
        case 'spouse':
          newMemberData.pids = [relative._id];
          break;

        // CASE: Add Sibling
        case 'sibling':
          newMemberData.mid = relative.mid;
          newMemberData.fid = relative.fid;
          break;

        // CASE: Add Father
        case 'father':
          newMemberData.gender = 'male'; // Force gender
          // Check if Relative already has a mother. If so, link Father & Mother as spouses
          if (relative.mid) {
             newMemberData.pids = [relative.mid];
          }
          break;

        // CASE: Add Mother
        case 'mother':
          newMemberData.gender = 'female'; // Force gender
          // Check if Relative already has a father.
          if (relative.fid) {
             newMemberData.pids = [relative.fid];
          }
          break;
          
        default:
          break;
      }
    }

    // 3. Create the New Member in DB
    const newMember = await Member.create(newMemberData);

    // 4. POST-CREATION UPDATES (Linking back to the existing relative)
    if (relativeId && relationType) {
      const relative = await Member.findById(relativeId);
      if (!relative) throw new Error('Relative not found');
      
      // Update Spouse (reciprocal link)
      if (relationType === 'spouse') {
        await Member.findByIdAndUpdate(relativeId, { 
          $addToSet: { pids: newMember._id } 
        });
      }
      
      // Update Parent (Link Child -> New Parent)
      if (relationType === 'father') {
        await Member.findByIdAndUpdate(relativeId, { fid: newMember._id });
        // Link spouses if applicable
        if(relative.mid) {
             await Member.findByIdAndUpdate(relative.mid, { $addToSet: { pids: newMember._id } });
        }
      }
      
      if (relationType === 'mother') {
        await Member.findByIdAndUpdate(relativeId, { mid: newMember._id });
        // Link spouses if applicable
        if(relative.fid) {
             await Member.findByIdAndUpdate(relative.fid, { $addToSet: { pids: newMember._id } });
        }
      }
    }

    if (linkChildrenIds && Array.isArray(linkChildrenIds) && linkChildrenIds.length > 0) {
      
      // If the new member is Male, he becomes the Father (fid)
      // If the new member is Female, she becomes the Mother (mid)
      const updatePayload = (newMember.gender === 'male') 
        ? { fid: newMember._id } 
        : { mid: newMember._id };

      await Member.updateMany(
        { _id: { $in: linkChildrenIds } },
        updatePayload
      );
    }

    res.status(201).json({ id: newMember._id, ...newMember._doc });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a member
// @route   PUT /api/trees/:treeId/members/:memberId
const updateMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    let updates = req.body;

    // Logic: If update payload contains isAlive=true, clear deathDate
    if (updates.isAlive === true) {
      updates.deathDate = null;
    }

    const updatedMember = await Member.findByIdAndUpdate(memberId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedMember) {
      res.status(404);
      throw new Error('Member not found');
    }

    // Synchronize Partners if pids changed
    if (updates.pids && updates.pids.length > 0) {
      await Member.updateMany(
        { _id: { $in: updates.pids } },
        { $addToSet: { pids: memberId } }
      );
    }

    res.status(200).json({ id: updatedMember._id, ...updatedMember._doc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a member
// @route   DELETE /api/trees/:treeId/members/:memberId
const deleteMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404);
      throw new Error('Member not found');
    }

    // 1. Remove this member ID from their partners' `pids` arrays
    if (member.pids && member.pids.length > 0) {
      await Member.updateMany(
        { _id: { $in: member.pids } },
        { $pull: { pids: memberId } } 
      );
    }

    // 2. Unlink children (Set fid/mid to null)
    await Member.updateMany({ mid: memberId }, { mid: null });
    await Member.updateMany({ fid: memberId }, { fid: null });

    // 3. Delete the document
    await member.deleteOne();

    res.status(200).json({ id: memberId, message: 'Member deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Bulk Sync (Handle Drag & Drop, inline edits from Chart)
// @route   POST /api/trees/:treeId/members/sync
const syncMembers = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { addNodesData, updateNodesData, removeNodeId } = req.body;

    // 1. Handle Removals
    if (removeNodeId) {
      await Member.findByIdAndDelete(removeNodeId);
      await Member.updateMany(
        { pids: removeNodeId },
        { $pull: { pids: removeNodeId } }
      );
    }

    // 2. Handle Updates
    if (updateNodesData && updateNodesData.length > 0) {
      const updatePromises = updateNodesData.map(async (node) => {
        const updatePayload = {
          name: node.name,
          mid: node.mid || null,
          fid: node.fid || null,
          pids: node.pids || [],
        };
        return Member.findByIdAndUpdate(node.id, updatePayload);
      });
      await Promise.all(updatePromises);
    }

    // 3. Handle Additions
    if (addNodesData && addNodesData.length > 0) {
      const addPromises = addNodesData.map(async (node) => {
        return Member.create({
          treeId,
          _id: node.id,
          name: node.name || 'New Member',
          gender: node.gender || 'male',
          mid: node.mid || null,
          fid: node.fid || null,
          pids: node.pids || []
        });
      });
      await Promise.all(addPromises);
    }

    res.status(200).json({ message: 'Sync successful' });
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  syncMembers
};