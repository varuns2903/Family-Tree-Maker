import { Router } from "express";
import { invite, changeRole, remove } from "./collaborator.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireTreeRole } from "../../middlewares/role.middleware";

export const collaboratorRoutes = Router({ mergeParams: true });

collaboratorRoutes.post(
  "/",
  requireAuth,
  requireTreeRole(["OWNER", "EDITOR"]),
  invite,
);

collaboratorRoutes.put(
  "/",
  requireAuth,
  requireTreeRole(["OWNER"]),
  changeRole,
);

collaboratorRoutes.delete("/", requireAuth, requireTreeRole(["OWNER"]), remove);
