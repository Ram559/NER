import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.header("x-admin-token");
  if (token !== env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Admin token required" });
  }
  next();
}
