import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable, scoresTable, charitiesTable, drawsTable, winnersTable } from "@workspace/db/schema";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    let users = await db.select().from(usersTable);

    if (search) {
      users = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.firstName.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = users.length;
    const paginated = users.slice((page - 1) * limit, page * limit);

    return res.json({
      users: paginated.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Admin get users error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:userId", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [subscription] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
      .limit(1);

    const scores = await db.select().from(scoresTable).where(eq(scoresTable.userId, userId)).limit(5);

    let charityName: string | null = null;
    if (user.charityId) {
      const [charity] = await db.select().from(charitiesTable).where(eq(charitiesTable.id, user.charityId)).limit(1);
      charityName = charity?.name ?? null;
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      charityId: user.charityId,
      charityName,
      charityContributionPercent: parseFloat(user.charityContributionPercent),
      subscription: subscription ? {
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        renewalDate: subscription.renewalDate,
        amount: parseFloat(subscription.amount),
        prizePoolContribution: parseFloat(subscription.prizePoolContribution),
        charityContribution: parseFloat(subscription.charityContribution),
        createdAt: subscription.createdAt,
      } : null,
      scores: scores.map(s => ({
        id: s.id,
        userId: s.userId,
        score: s.score,
        datePlayed: s.datePlayed,
        createdAt: s.createdAt,
      })),
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Admin get user error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/:userId", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { firstName, lastName, role, isActive } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
    if (!user) return res.status(404).json({ error: "User not found" });

    const [subscription] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
      .limit(1);
    const scores = await db.select().from(scoresTable).where(eq(scoresTable.userId, userId)).limit(5);

    let charityName: string | null = null;
    if (user.charityId) {
      const [charity] = await db.select().from(charitiesTable).where(eq(charitiesTable.id, user.charityId)).limit(1);
      charityName = charity?.name ?? null;
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      charityId: user.charityId,
      charityName,
      charityContributionPercent: parseFloat(user.charityContributionPercent),
      subscription: subscription ? {
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        renewalDate: subscription.renewalDate,
        amount: parseFloat(subscription.amount),
        prizePoolContribution: parseFloat(subscription.prizePoolContribution),
        charityContribution: parseFloat(subscription.charityContribution),
        createdAt: subscription.createdAt,
      } : null,
      scores: scores.map(s => ({
        id: s.id,
        userId: s.userId,
        score: s.score,
        datePlayed: s.datePlayed,
        createdAt: s.createdAt,
      })),
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Admin update user error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics", requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.select().from(usersTable);
    const activeSubscriptions = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
    const allDraws = await db.select().from(drawsTable);
    const allWinners = await db.select().from(winnersTable);
    const allCharities = await db.select().from(charitiesTable);

    let totalPrizePool = 0;
    let monthlyRevenue = 0;
    for (const sub of activeSubscriptions) {
      totalPrizePool += parseFloat(sub.prizePoolContribution);
      monthlyRevenue += parseFloat(sub.amount);
    }

    let totalCharityContributions = 0;
    for (const sub of activeSubscriptions) {
      totalCharityContributions += parseFloat(sub.charityContribution);
    }

    // Charity breakdown by subscriber count
    const charityBreakdown = allCharities.map(c => {
      const users = allUsers.filter(u => u.charityId === c.id);
      const contributions = activeSubscriptions
        .filter(s => users.some(u => u.id === s.userId))
        .reduce((sum, s) => sum + parseFloat(s.charityContribution), 0);
      return {
        charityId: c.id,
        charityName: c.name,
        totalContributions: contributions,
        subscriberCount: users.length,
      };
    });

    return res.json({
      totalUsers: allUsers.length,
      activeSubscribers: activeSubscriptions.length,
      monthlyRevenue,
      totalPrizePool,
      totalCharityContributions,
      totalDraws: allDraws.length,
      totalWinners: allWinners.length,
      charityBreakdown,
    });
  } catch (err) {
    req.log.error({ err }, "Get analytics error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
