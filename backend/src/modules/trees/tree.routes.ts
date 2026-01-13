import { Router } from "express";
import { create, listMine, update, setVisibility } from "./tree.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireTreeRole } from "../../middlewares/role.middleware";
import { collaboratorRoutes } from "../collaborators/collaborator.routes";

export const treeRoutes = Router();

treeRoutes.post("/", requireAuth, create);
treeRoutes.get("/mine", requireAuth, listMine);

treeRoutes.put(
  "/:id",
  requireAuth,
  requireTreeRole(["OWNER", "EDITOR"]),
  update,
);

treeRoutes.put(
  "/:id/visibility",
  requireAuth,
  requireTreeRole(["OWNER"]),
  setVisibility,
);

treeRoutes.use("/:id/collaborators", collaboratorRoutes);
