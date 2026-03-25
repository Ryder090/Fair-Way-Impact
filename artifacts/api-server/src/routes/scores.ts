import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { scoresTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const scores = await db.select().from(scoresTable)
      .where(eq(scoresTable.userId, userId))
      .orderBy(desc(scoresTable.datePlayed))
      .limit(5);

    return res.json(scores.map(s => ({
      id: s.id,
      userId: s.userId,
      score: s.score,
      datePlayed: s.datePlayed,
      createdAt: s.createdAt,
    })));
  } catch (err) {
    req.log.error({ err }, "Get scores error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { score, datePlayed } = req.body;

    if (!score || !datePlayed) {
      return res.status(400).json({ error: "score and datePlayed are required" });
    }
    if (score < 1 || score > 45) {
      return res.status(400).json({ error: "Score must be between 1 and 45 (Stableford format)" });
    }

    // Enforce rolling window of 5 scores - delete oldest if at limit
    const existingScores = await db.select().from(scoresTable)
      .where(eq(scoresTable.userId, userId))
      .orderBy(desc(scoresTable.datePlayed));

    if (existingScores.length >= 5) {
      const oldest = existingScores[existingScores.length - 1];
      await db.delete(scoresTable).where(eq(scoresTable.id, oldest.id));
    }

    const [newScore] = await db.insert(scoresTable).values({
      userId,
      score,
      datePlayed,
    }).returning();

    return res.status(201).json({
      id: newScore.id,
      userId: newScore.userId,
      score: newScore.score,
      datePlayed: newScore.datePlayed,
      createdAt: newScore.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Add score error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:scoreId", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const scoreId = parseInt(req.params.scoreId);
    const { score, datePlayed } = req.body;

    if (!score || !datePlayed) {
      return res.status(400).json({ error: "score and datePlayed are required" });
    }
    if (score < 1 || score > 45) {
      return res.status(400).json({ error: "Score must be between 1 and 45 (Stableford format)" });
    }

    const [existing] = await db.select().from(scoresTable)
      .where(and(eq(scoresTable.id, scoreId), eq(scoresTable.userId, userId)))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Score not found" });

    const [updated] = await db.update(scoresTable)
      .set({ score, datePlayed })
      .where(eq(scoresTable.id, scoreId))
      .returning();

    return res.json({
      id: updated.id,
      userId: updated.userId,
      score: updated.score,
      datePlayed: updated.datePlayed,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Update score error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:scoreId", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const scoreId = parseInt(req.params.scoreId);

    const [existing] = await db.select().from(scoresTable)
      .where(and(eq(scoresTable.id, scoreId), eq(scoresTable.userId, userId)))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Score not found" });

    await db.delete(scoresTable).where(eq(scoresTable.id, scoreId));
    return res.json({ message: "Score deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete score error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
