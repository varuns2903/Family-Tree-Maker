import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

routes.use("/auth", authRoutes);