import { Router } from "express";
import {
  register,
  login,
  me,
  refresh,
  logout
} from "./auth.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", logout);
authRoutes.get("/me", requireAuth, me);
