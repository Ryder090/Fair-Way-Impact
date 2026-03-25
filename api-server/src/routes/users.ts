import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable, charitiesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [subscription] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
      .limit(1);

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
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get profile error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { firstName, lastName } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();

    const [subscription] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
      .limit(1);

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
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Update profile error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/charity", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { charityId, contributionPercent } = req.body;

    if (!charityId || !contributionPercent) {
      return res.status(400).json({ error: "charityId and contributionPercent are required" });
    }
    if (contributionPercent < 10 || contributionPercent > 50) {
      return res.status(400).json({ error: "Contribution percent must be between 10 and 50" });
    }

    const [charity] = await db.select().from(charitiesTable).where(eq(charitiesTable.id, charityId)).limit(1);
    if (!charity) return res.status(404).json({ error: "Charity not found" });

    const [user] = await db.update(usersTable)
      .set({ charityId, charityContributionPercent: contributionPercent.toString(), updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    const [subscription] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
      .limit(1);

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      charityId: user.charityId,
      charityName: charity.name,
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
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Select charity error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
