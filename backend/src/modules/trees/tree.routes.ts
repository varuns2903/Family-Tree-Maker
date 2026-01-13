import { Router } from "express";
import {
  create,
  listMine,
  update,
  setVisibility
} from "./tree.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

export const treeRoutes = Router();

treeRoutes.post("/", requireAuth, create);
treeRoutes.get("/mine", requireAuth, listMine);
treeRoutes.put("/:id", requireAuth, update);
treeRoutes.put("/:id/visibility", requireAuth, setVisibility);
