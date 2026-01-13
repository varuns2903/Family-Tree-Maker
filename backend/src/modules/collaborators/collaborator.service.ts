import { CollaboratorModel } from "./collaborator.model";
import { TreeRole } from "../../utils/permissions";
import { TreeModel } from "../trees/tree.model";

export const inviteCollaborator = async (
  treeId: string,
  targetUserId: string,
  invitedBy: string,
  inviterRole: TreeRole,
  role: "VIEWER" | "EDITOR",
) => {
  const tree = await TreeModel.findById(treeId);

  if (!tree) {
    throw { statusCode: 404, message: "Tree not found" };
  }

  if (tree.ownerId.toString() === targetUserId) {
    throw {
      statusCode: 400,
      message: "Owner cannot be added as collaborator",
    };
  }

  const existingCollaborator = await CollaboratorModel.findOne({
    treeId,
    userId: targetUserId,
  });

  if (existingCollaborator) {
    throw {
      statusCode: 409,
      message: "User is already a collaborator on this tree",
    };
  }

  if (inviterRole === "EDITOR" && role !== "VIEWER") {
    throw {
      statusCode: 403,
      message: "Editors can only invite viewers",
    };
  }

  return CollaboratorModel.create({
    treeId,
    userId: targetUserId,
    role,
    invitedBy,
  });
};

export const updateCollaboratorRole = async (
  treeId: string,
  targetUserId: string,
  newRole: "VIEWER" | "EDITOR",
  requestedBy: string,
) => {
  if (targetUserId === requestedBy) {
    throw {
      statusCode: 400,
      message: "You cannot change your own role",
    };
  }

  const collaborator = await CollaboratorModel.findOne({
    treeId,
    userId: targetUserId,
  });

  if (!collaborator) {
    throw {
      statusCode: 404,
      message: "Collaborator not found",
    };
  }

  collaborator.role = newRole;
  await collaborator.save();

  return collaborator;
};

export const removeCollaborator = async (treeId: string, userId: string) => {
  return CollaboratorModel.findOneAndDelete({
    treeId,
    userId,
  });
};
