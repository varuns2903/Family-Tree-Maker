import { TreeModel } from "../modules/trees/tree.model";
import { CollaboratorModel } from "../modules/collaborators/collaborator.model";

export type TreeRole = "OWNER" | "EDITOR" | "VIEWER";

export const resolveTreeRole = async (
  userId: string,
  treeId: string,
): Promise<TreeRole | null> => {
  const tree = await TreeModel.findById(treeId);
  if (!tree) return null;

  if (tree.ownerId.toString() === userId) {
    return "OWNER";
  }

  const collaborator = await CollaboratorModel.findOne({
    treeId,
    userId,
  });

  return collaborator?.role ?? null;
};
