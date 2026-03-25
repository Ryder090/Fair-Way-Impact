import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { drawsTable, drawParticipantsTable, winnersTable, subscriptionsTable, scoresTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const PLAN_MONTHLY_PRIZE = 10 * 0.60; // £6 per monthly subscriber
const PLAN_YEARLY_PRIZE = (100 / 12) * 0.60; // £5 per yearly subscriber per month

function parseNumbers(str: string | null | undefined): number[] {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
}

function countMatches(userNums: number[], drawnNums: number[]): number {
  return userNums.filter(n => drawnNums.includes(n)).length;
}

async function buildPrizePool(drawId?: number): Promise<{ totalPool: number; jackpotRollover: number }> {
  const activeSubs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
  let totalPool = 0;
  for (const sub of activeSubs) {
    totalPool += parseFloat(sub.prizePoolContribution);
  }

  // Find rolled-over jackpot from previous draw
  let jackpotRollover = 0;
  const prevDraws = await db.select().from(drawsTable)
    .where(and(eq(drawsTable.status, "completed"), eq(drawsTable.jackpotRolledOver, true)))
    .orderBy(desc(drawsTable.drawDate))
    .limit(1);

  if (prevDraws.length > 0 && (!drawId || prevDraws[0].id !== drawId)) {
    jackpotRollover = parseFloat(prevDraws[0].jackpotAmount);
  }

  return { totalPool, jackpotRollover };
}

router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let draws = await db.select().from(drawsTable).orderBy(desc(drawsTable.drawDate));
    if (status) {
      draws = draws.filter(d => d.status === status);
    }
    return res.json(draws.map(d => ({
      id: d.id,
      name: d.name,
      drawDate: d.drawDate,
      status: d.status,
      drawType: d.drawType,
      totalPool: parseFloat(d.totalPool),
      jackpotAmount: parseFloat(d.jackpotAmount),
      jackpotRolledOver: d.jackpotRolledOver,
      participantCount: d.participantCount,
      createdAt: d.createdAt,
    })));
  } catch (err) {
    req.log.error({ err }, "Get draws error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/prize-pool", async (req, res) => {
  try {
    const { totalPool, jackpotRollover } = await buildPrizePool();
    const activeSubs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));

    return res.json({
      totalPool,
      fiveMatchPool: totalPool * 0.40 + jackpotRollover,
      fourMatchPool: totalPool * 0.35,
      threeMatchPool: totalPool * 0.25,
      jackpotRollover,
      activeSubscribers: activeSubs.length,
    });
  } catch (err) {
    req.log.error({ err }, "Get prize pool error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-participation", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const participations = await db.select().from(drawParticipantsTable)
      .where(eq(drawParticipantsTable.userId, userId))
      .orderBy(desc(drawParticipantsTable.createdAt));

    const result = [];
    for (const p of participations) {
      const [draw] = await db.select().from(drawsTable).where(eq(drawsTable.id, p.drawId)).limit(1);
      if (!draw) continue;

      // Find any winnings
      const [winner] = await db.select().from(winnersTable)
        .where(and(eq(winnersTable.drawId, p.drawId), eq(winnersTable.userId, userId)))
        .limit(1);

      result.push({
        drawId: p.drawId,
        drawName: draw.name,
        drawDate: draw.drawDate,
        status: draw.status,
        userNumbers: parseNumbers(p.userNumbers),
        matchCount: p.matchCount ?? null,
        prize: winner ? parseFloat(winner.prizeAmount) : null,
      });
    }

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get my participation error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:drawId", async (req, res) => {
  try {
    const drawId = parseInt(req.params.drawId);
    const [draw] = await db.select().from(drawsTable).where(eq(drawsTable.id, drawId)).limit(1);
    if (!draw) return res.status(404).json({ error: "Draw not found" });

    const winners = await db.select().from(winnersTable).where(eq(winnersTable.drawId, drawId));
    const winnerDetails = [];
    for (const w of winners) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId)).limit(1);
      winnerDetails.push({
        id: w.id,
        drawId: w.drawId,
        drawName: draw.name,
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
      });
    }

    const drawnNums = parseNumbers(draw.drawnNumbers);
    const totalPool = parseFloat(draw.totalPool);

    return res.json({
      id: draw.id,
      name: draw.name,
      drawDate: draw.drawDate,
      status: draw.status,
      drawType: draw.drawType,
      totalPool,
      jackpotAmount: parseFloat(draw.jackpotAmount),
      jackpotRolledOver: draw.jackpotRolledOver,
      participantCount: draw.participantCount,
      drawnNumbers: drawnNums.length > 0 ? drawnNums : null,
      prizeBreakdown: totalPool > 0 ? {
        fiveMatch: totalPool * 0.40,
        fourMatch: totalPool * 0.35,
        threeMatch: totalPool * 0.25,
      } : null,
      winners: winnerDetails,
      createdAt: draw.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get draw error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, drawDate, drawType } = req.body;
    if (!name || !drawDate || !drawType) {
      return res.status(400).json({ error: "name, drawDate, and drawType are required" });
    }

    const { totalPool, jackpotRollover } = await buildPrizePool();
    const activeSubs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));

    const [draw] = await db.insert(drawsTable).values({
      name,
      drawDate: new Date(drawDate),
      drawType,
      status: "upcoming",
      totalPool: totalPool.toString(),
      jackpotAmount: (totalPool * 0.40 + jackpotRollover).toString(),
      participantCount: activeSubs.length,
    }).returning();

    // Auto-enroll all active subscribers using their last 5 scores as their numbers
    for (const sub of activeSubs) {
      const scores = await db.select().from(scoresTable)
        .where(eq(scoresTable.userId, sub.userId))
        .orderBy(desc(scoresTable.datePlayed))
        .limit(5);

      if (scores.length > 0) {
        await db.insert(drawParticipantsTable).values({
          drawId: draw.id,
          userId: sub.userId,
          userNumbers: JSON.stringify(scores.map(s => s.score)),
        });
      }
    }

    return res.status(201).json({
      id: draw.id,
      name: draw.name,
      drawDate: draw.drawDate,
      status: draw.status,
      drawType: draw.drawType,
      totalPool: parseFloat(draw.totalPool),
      jackpotAmount: parseFloat(draw.jackpotAmount),
      jackpotRolledOver: draw.jackpotRolledOver,
      participantCount: draw.participantCount,
      createdAt: draw.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Create draw error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:drawId/simulate", requireAdmin, async (req, res) => {
  try {
    const drawId = parseInt(req.params.drawId);
    const [draw] = await db.select().from(drawsTable).where(eq(drawsTable.id, drawId)).limit(1);
    if (!draw) return res.status(404).json({ error: "Draw not found" });

    // Generate 5 random numbers from 1-45
    const drawn: number[] = [];
    while (drawn.length < 5) {
      const n = Math.floor(Math.random() * 45) + 1;
      if (!drawn.includes(n)) drawn.push(n);
    }

    const participants = await db.select().from(drawParticipantsTable).where(eq(drawParticipantsTable.drawId, drawId));
    const totalPool = parseFloat(draw.totalPool);

    let fiveMatch = 0, fourMatch = 0, threeMatch = 0;
    for (const p of participants) {
      const nums = parseNumbers(p.userNumbers);
      const matches = countMatches(nums, drawn);
      if (matches === 5) fiveMatch++;
      else if (matches === 4) fourMatch++;
      else if (matches === 3) threeMatch++;
    }

    const fiveMatchPool = totalPool * 0.40 + parseFloat(draw.jackpotAmount) * 0.40;
    const fourMatchPool = totalPool * 0.35;
    const threeMatchPool = totalPool * 0.25;

    return res.json({
      drawnNumbers: drawn,
      fiveMatchWinners: fiveMatch,
      fourMatchWinners: fourMatch,
      threeMatchWinners: threeMatch,
      fiveMatchPrize: fiveMatch > 0 ? fiveMatchPool / fiveMatch : 0,
      fourMatchPrize: fourMatch > 0 ? fourMatchPool / fourMatch : 0,
      threeMatchPrize: threeMatch > 0 ? threeMatchPool / threeMatch : 0,
      jackpotWouldRollover: fiveMatch === 0,
    });
  } catch (err) {
    req.log.error({ err }, "Simulate draw error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:drawId/execute", requireAdmin, async (req, res) => {
  try {
    const drawId = parseInt(req.params.drawId);
    const { drawnNumbers } = req.body;

    if (!drawnNumbers || drawnNumbers.length !== 5) {
      return res.status(400).json({ error: "Exactly 5 drawn numbers required" });
    }

    const [draw] = await db.select().from(drawsTable).where(eq(drawsTable.id, drawId)).limit(1);
    if (!draw) return res.status(404).json({ error: "Draw not found" });

    const participants = await db.select().from(drawParticipantsTable).where(eq(drawParticipantsTable.drawId, drawId));
    const totalPool = parseFloat(draw.totalPool);
    const jackpotPool = totalPool * 0.40 + parseFloat(draw.jackpotAmount) * 0.40;
    const fourPool = totalPool * 0.35;
    const threePool = totalPool * 0.25;

    const fiveMatchers: number[] = [], fourMatchers: number[] = [], threeMatchers: number[] = [];

    // Calculate matches for each participant
    for (const p of participants) {
      const nums = parseNumbers(p.userNumbers);
      const matches = countMatches(nums, drawnNumbers);
      await db.update(drawParticipantsTable).set({ matchCount: matches }).where(eq(drawParticipantsTable.id, p.id));

      if (matches === 5) fiveMatchers.push(p.userId);
      else if (matches === 4) fourMatchers.push(p.userId);
      else if (matches === 3) threeMatchers.push(p.userId);
    }

    const jackpotRolledOver = fiveMatchers.length === 0;

    // Create winner records
    if (fiveMatchers.length > 0) {
      const prize = (jackpotPool / fiveMatchers.length).toString();
      for (const uid of fiveMatchers) {
        await db.insert(winnersTable).values({ drawId, userId: uid, matchType: "five_match", prizeAmount: prize });
      }
    }
    if (fourMatchers.length > 0) {
      const prize = (fourPool / fourMatchers.length).toString();
      for (const uid of fourMatchers) {
        await db.insert(winnersTable).values({ drawId, userId: uid, matchType: "four_match", prizeAmount: prize });
      }
    }
    if (threeMatchers.length > 0) {
      const prize = (threePool / threeMatchers.length).toString();
      for (const uid of threeMatchers) {
        await db.insert(winnersTable).values({ drawId, userId: uid, matchType: "three_match", prizeAmount: prize });
      }
    }

    const [updated] = await db.update(drawsTable)
      .set({
        status: "completed",
        drawnNumbers: JSON.stringify(drawnNumbers),
        jackpotRolledOver,
        updatedAt: new Date(),
      })
      .where(eq(drawsTable.id, drawId))
      .returning();

    const winners = await db.select().from(winnersTable).where(eq(winnersTable.drawId, drawId));
    const winnerDetails = [];
    for (const w of winners) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId)).limit(1);
      winnerDetails.push({
        id: w.id,
        drawId: w.drawId,
        drawName: updated.name,
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
      });
    }

    return res.json({
      id: updated.id,
      name: updated.name,
      drawDate: updated.drawDate,
      status: updated.status,
      drawType: updated.drawType,
      totalPool: parseFloat(updated.totalPool),
      jackpotAmount: parseFloat(updated.jackpotAmount),
      jackpotRolledOver: updated.jackpotRolledOver,
      participantCount: updated.participantCount,
      drawnNumbers,
      prizeBreakdown: {
        fiveMatch: jackpotPool,
        fourMatch: fourPool,
        threeMatch: threePool,
      },
      winners: winnerDetails,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Execute draw error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
