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
      description: m.description, // Added description to response
      weddings: m.weddings,       // Added weddings to response
      ...(m.data || {})           // ✅ FIXED: Spread plain object directly
    }));    

    res.status(200).json({
      role: req.treeRole || 'owner', 
      members: nodes
    });
  } catch (error) {
    console.log(error);
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
      name, gender, birthDate, deathDate, isAlive, img, contactNo, data, description,
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
      description: description || "",
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

    // 5. Link Existing Children (if selected during Add Child/Spouse)
    if (linkChildrenIds && Array.isArray(linkChildrenIds) && linkChildrenIds.length > 0) {
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
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a member
// @route   PUT /api/trees/:treeId/members/:memberId
const updateMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    let updates = req.body;

    // Logic 1: Clear death date if marked alive
    if (updates.isAlive === true) {
      updates.deathDate = null;
    }

    // 1. Update the Current Member
    const updatedMember = await Member.findByIdAndUpdate(memberId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedMember) {
      res.status(404);
      throw new Error('Member not found');
    }

    // Logic 2: Synchronize Partners (pids)
    if (updates.pids && updates.pids.length > 0) {
      await Member.updateMany(
        { _id: { $in: updates.pids } },
        { $addToSet: { pids: memberId } }
      );
    }

    // Logic 3: Synchronize Wedding Dates (Bi-directional update) [NEW]
    if (updates.weddings && Array.isArray(updates.weddings)) {
        const syncPromises = updates.weddings.map(async (w) => {
            if (!w.spouseId || !w.date) return;

            const spouse = await Member.findById(w.spouseId);
            if (!spouse) return;

            // Ensure weddings array exists
            if (!spouse.weddings) spouse.weddings = [];

            // Find existing record of marriage to CURRENT member
            const existingRecord = spouse.weddings.find(
                rec => rec.spouseId.toString() === memberId.toString()
            );

            if (existingRecord) {
                existingRecord.date = w.date; // Update date
            } else {
                // Add new record
                spouse.weddings.push({ 
                    spouseId: memberId, 
                    date: w.date 
                });
            }
            return spouse.save();
        });

        await Promise.all(syncPromises);
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

// @desc    Link two existing members manually
// @route   PUT /api/trees/:treeId/members/link
const linkMember = async (req, res) => {
    try {
        const { memberId, relativeId, relationship } = req.body;
        
        const member = await Member.findById(memberId);
        const relative = await Member.findById(relativeId);
        
        if (!member || !relative) throw new Error("Member not found");

        if (relationship === 'child') {
             
             const update = member.gender === 'male' 
                ? { fid: member._id } 
                : { mid: member._id };
             
             await Member.findByIdAndUpdate(relativeId, update);

        } else if (relationship === 'spouse') {
            await Member.findByIdAndUpdate(memberId, { $addToSet: { pids: relative._id }});
            await Member.findByIdAndUpdate(relativeId, { $addToSet: { pids: member._id }});

        } else if (relationship === 'father') {
            await Member.findByIdAndUpdate(memberId, { fid: relative._id });
            
            if (member.mid) {
                await Member.findByIdAndUpdate(member.mid, { $addToSet: { pids: relative._id }});
                await Member.findByIdAndUpdate(relative._id, { $addToSet: { pids: member.mid }});
            }

        } else if (relationship === 'mother') {
            await Member.findByIdAndUpdate(memberId, { mid: relative._id });

            if (member.fid) {
                await Member.findByIdAndUpdate(member.fid, { $addToSet: { pids: relative._id }});
                await Member.findByIdAndUpdate(relative._id, { $addToSet: { pids: member.fid }});
            }
        }

        res.status(200).json({ message: "Linked successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  linkMember
};