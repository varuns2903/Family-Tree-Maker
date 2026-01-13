import { Request, Response } from "express";
import {
  inviteCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
} from "./collaborator.service";
import { resolveTreeRole } from "../../utils/permissions";

type TreeParams = { id: string };

export const invite = async (req: Request<TreeParams>, res: Response) => {
  const { userId, role } = req.body;

  const inviterRole = await resolveTreeRole(req.user!.id, req.params.id);

  if (!inviterRole) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const collaborator = await inviteCollaborator(
    req.params.id,
    userId,
    req.user!.id,
    inviterRole,
    role,
  );

  res.status(201).json({ success: true, data: collaborator });
};

export const changeRole = async (req: Request<TreeParams>, res: Response) => {
  const { userId, role } = req.body;

  const collaborator = await updateCollaboratorRole(
    req.params.id,
    userId,
    role,
    req.user!.id,
  );

  res.status(200).json({
    success: true,
    data: collaborator,
  });
};

export const remove = async (req: Request<TreeParams>, res: Response) => {
  await removeCollaborator(req.params.id, req.body.userId);

  res.status(204).send();
};
