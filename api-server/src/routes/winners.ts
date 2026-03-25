import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { winnersTable, drawsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

async function formatWinner(w: any) {
  const [draw] = await db.select().from(drawsTable).where(eq(drawsTable.id, w.drawId)).limit(1);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId)).limit(1);
  return {
    id: w.id,
    drawId: w.drawId,
    drawName: draw?.name ?? "",
    userId: w.userId,
    userEmail: user?.email ?? "",
    userFirstName: user?.firstName ?? "",
    userLastName: user?.lastName ?? "",
    matchType: w.matchType,
    prizeAmount: parseFloat(w.prizeAmount),
    status: w.status,
    proofImageUrl: w.proofImageUrl,
    adminNote: w.adminNote,
    createdAt: w.createdAt,
  };
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let winners = await db.select().from(winnersTable);
    if (status) {
      winners = winners.filter(w => w.status === status);
    }
    const formatted = await Promise.all(winners.map(formatWinner));
    return res.json(formatted);
  } catch (err) {
    req.log.error({ err }, "Get winners error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-winnings", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const winners = await db.select().from(winnersTable).where(eq(winnersTable.userId, userId));

    let totalWon = 0, totalPaid = 0, pendingAmount = 0;
    for (const w of winners) {
      const prize = parseFloat(w.prizeAmount);
      totalWon += prize;
      if (w.status === "paid") totalPaid += prize;
      if (w.status === "pending" || w.status === "verified") pendingAmount += prize;
    }

    const formatted = await Promise.all(winners.map(formatWinner));
    return res.json({ totalWon, totalPaid, pendingAmount, winners: formatted });
  } catch (err) {
    req.log.error({ err }, "Get my winnings error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:winnerId/submit-proof", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const winnerId = parseInt(req.params.winnerId);
    const { proofImageUrl } = req.body;

    if (!proofImageUrl) {
      return res.status(400).json({ error: "proofImageUrl is required" });
    }

    const [winner] = await db.select().from(winnersTable).where(eq(winnersTable.id, winnerId)).limit(1);
    if (!winner || winner.userId !== userId) {
      return res.status(404).json({ error: "Winner record not found" });
    }

    const [updated] = await db.update(winnersTable)
      .set({ proofImageUrl, updatedAt: new Date() })
      .where(eq(winnersTable.id, winnerId))
      .returning();

    return res.json(await formatWinner(updated));
  } catch (err) {
    req.log.error({ err }, "Submit proof error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:winnerId/verify", requireAdmin, async (req, res) => {
  try {
    const winnerId = parseInt(req.params.winnerId);
    const { approved, adminNote } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({ error: "approved (boolean) is required" });
    }

    const [updated] = await db.update(winnersTable)
      .set({
        status: approved ? "verified" : "rejected",
        adminNote,
        updatedAt: new Date(),
      })
      .where(eq(winnersTable.id, winnerId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Winner not found" });
    return res.json(await formatWinner(updated));
  } catch (err) {
    req.log.error({ err }, "Verify winner error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:winnerId/mark-paid", requireAdmin, async (req, res) => {
  try {
    const winnerId = parseInt(req.params.winnerId);
    const [updated] = await db.update(winnersTable)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(winnersTable.id, winnerId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Winner not found" });
    return res.json(await formatWinner(updated));
  } catch (err) {
    req.log.error({ err }, "Mark paid error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
