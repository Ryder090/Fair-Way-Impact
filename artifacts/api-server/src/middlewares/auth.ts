import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
