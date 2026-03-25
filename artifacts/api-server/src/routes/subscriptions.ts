import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const PLAN_PRICES = {
  monthly: 10,
  yearly: 100,
};

// Prize pool gets 60% of subscription, charity gets user's chosen %, platform keeps rest
const PRIZE_POOL_PERCENT = 0.60;

const router: IRouter = Router();

router.get("/current", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [subscription] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
      .limit(1);

    if (!subscription) {
      return res.status(404).json({ error: "No active subscription" });
    }

    return res.json({
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
    });
  } catch (err) {
    req.log.error({ err }, "Get subscription error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const { plan, charityContributionPercent = 10 } = req.body;

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return res.status(400).json({ error: "Plan must be monthly or yearly" });
    }

    // Cancel existing subscription if any
    await db.update(subscriptionsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")));

    const amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
    const prizePoolContribution = amount * PRIZE_POOL_PERCENT;
    const charityContribution = amount * (charityContributionPercent / 100);

    const startDate = new Date();
    const renewalDate = new Date(startDate);
    if (plan === "monthly") {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }

    const [subscription] = await db.insert(subscriptionsTable).values({
      userId,
      plan,
      status: "active",
      startDate,
      renewalDate,
      amount: amount.toString(),
      prizePoolContribution: prizePoolContribution.toString(),
      charityContribution: charityContribution.toString(),
    }).returning();

    return res.status(201).json({
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
    });
  } catch (err) {
    req.log.error({ err }, "Create subscription error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const [subscription] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "active")))
      .limit(1);

    if (!subscription) {
      return res.status(404).json({ error: "No active subscription" });
    }

    await db.update(subscriptionsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(subscriptionsTable.id, subscription.id));

    return res.json({ message: "Subscription cancelled" });
  } catch (err) {
    req.log.error({ err }, "Cancel subscription error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
