import { Request, Response } from "express";
import {
  createTree,
  getMyTrees,
  updateTree,
  changeVisibility
} from "./tree.service";

type TreeParams = {
  id: string;
};

export const create = async (req: Request, res: Response) => {
  const { name, description } = req.body;

  const tree = await createTree(req.user!.id, name, description);

  res.status(201).json({ success: true, data: tree });
};

export const listMine = async (req: Request, res: Response) => {
  const data = await getMyTrees(req.user!.id);

  res.status(200).json({ success: true, data });
};

export const update = async (
  req: Request<TreeParams>,
  res: Response
) => {
  const tree = await updateTree(req.params.id, req.body);

  res.status(200).json({ success: true, data: tree });
};

export const setVisibility = async (
  req: Request<TreeParams>,
  res: Response
) => {
  const tree = await changeVisibility(
    req.params.id,
    req.body.visibility
  );

  res.status(200).json({ success: true, data: tree });
};
