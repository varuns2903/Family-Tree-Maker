import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshTokens,
  logoutUser
} from "./auth.service";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const response = await registerUser(name, email, password);

  res.status(201).json({ success: true, data: response });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const response = await loginUser(email, password);

  res.status(200).json({ success: true, data: response });
};

export const me = async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.id);

  res.status(200).json({ success: true, data: user });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: "Refresh token required" });
  }

  const tokens = await refreshTokens(refreshToken);

  res.status(200).json({ success: true, data: tokens });
};

export const logout = async (_req: Request, res: Response) => {
  await logoutUser();

  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};
