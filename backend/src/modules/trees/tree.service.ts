import { TreeModel } from "./tree.model";
import { CollaboratorModel } from "../collaborators/collaborator.model";

export const createTree = async (
  ownerId: string,
  name: string,
  description?: string
) => {
  return TreeModel.create({
    ownerId,
    name,
    description
  });
};

export const getMyTrees = async (userId: string) => {
  const owned = await TreeModel.find({ ownerId: userId });

  const sharedTreeIds = await CollaboratorModel.find({
    userId
  }).distinct("treeId");

  const shared = await TreeModel.find({
    _id: { $in: sharedTreeIds }
  });

  return { owned, shared };
};

export const updateTree = async (
  treeId: string,
  updates: Partial<{ name: string; description: string }>
) => {
  return TreeModel.findByIdAndUpdate(treeId, updates, {
    new: true
  });
};

export const changeVisibility = async (
  treeId: string,
  visibility: "PRIVATE" | "PUBLIC"
) => {
  return TreeModel.findByIdAndUpdate(
    treeId,
    { visibility },
    { new: true }
  );
};
