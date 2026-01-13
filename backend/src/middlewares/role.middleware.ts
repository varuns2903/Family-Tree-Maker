import { Request, Response, NextFunction } from "express";
import { resolveTreeRole, TreeRole } from "../utils/permissions";

type TreeParams = {
  id: string;
};

export const requireTreeRole =
  (allowed: TreeRole[]) =>
  async (req: Request<TreeParams>, res: Response, next: NextFunction) => {
    const treeId = req.params.id;

    const role = await resolveTreeRole(req.user!.id, treeId);

    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
