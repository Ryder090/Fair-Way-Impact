import { pgTable, serial, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const charitiesTable = pgTable("charities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  totalContributions: numeric("total_contributions", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCharitySchema = createInsertSchema(charitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCharity = z.infer<typeof insertCharitySchema>;
export type Charity = typeof charitiesTable.$inferSelect;
