import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const response = await registerUser(name, email, password);

  res.status(201).json({
    success: true,
    data: response
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const response = await loginUser(email, password);

  res.status(200).json({
    success: true,
    data: response
  });
};
