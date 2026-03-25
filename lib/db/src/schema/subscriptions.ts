import { pgTable, serial, integer, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["monthly", "yearly"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "lapsed", "pending"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  renewalDate: timestamp("renewal_date"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  prizePoolContribution: numeric("prize_pool_contribution", { precision: 10, scale: 2 }).notNull(),
  charityContribution: numeric("charity_contribution", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
