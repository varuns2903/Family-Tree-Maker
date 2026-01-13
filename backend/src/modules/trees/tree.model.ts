import { Schema, model, Types } from "mongoose";

const treeSchema = new Schema(
  {
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    visibility: {
      type: String,
      enum: ["PRIVATE", "PUBLIC"],
      default: "PRIVATE"
    }
  },
  { timestamps: true }
);

export const TreeModel = model("Tree", treeSchema);
