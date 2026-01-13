import { Schema, model, Types } from "mongoose";

const collaboratorSchema = new Schema(
  {
    treeId: {
      type: Types.ObjectId,
      ref: "Tree",
      required: true,
      index: true
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ["VIEWER", "EDITOR"],
      required: true
    },
    invitedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

collaboratorSchema.index({ treeId: 1, userId: 1 }, { unique: true });

export const CollaboratorModel = model(
  "TreeCollaborator",
  collaboratorSchema
);
