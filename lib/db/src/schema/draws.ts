import { pgTable, serial, text, timestamp, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const drawStatusEnum = pgEnum("draw_status", ["upcoming", "active", "completed"]);
export const drawTypeEnum = pgEnum("draw_type", ["random", "algorithmic"]);
export const matchTypeEnum = pgEnum("match_type", ["five_match", "four_match", "three_match"]);
export const winnerStatusEnum = pgEnum("winner_status", ["pending", "verified", "rejected", "paid"]);

export const drawsTable = pgTable("draws", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  drawDate: timestamp("draw_date").notNull(),
  status: drawStatusEnum("status").notNull().default("upcoming"),
  drawType: drawTypeEnum("draw_type").notNull().default("random"),
  totalPool: numeric("total_pool", { precision: 12, scale: 2 }).notNull().default("0"),
  jackpotAmount: numeric("jackpot_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  jackpotRolledOver: boolean("jackpot_rolled_over").notNull().default(false),
  participantCount: integer("participant_count").notNull().default(0),
  drawnNumbers: text("drawn_numbers"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const drawParticipantsTable = pgTable("draw_participants", {
  id: serial("id").primaryKey(),
  drawId: integer("draw_id").notNull(),
  userId: integer("user_id").notNull(),
  userNumbers: text("user_numbers").notNull(),
  matchCount: integer("match_count"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const winnersTable = pgTable("winners", {
  id: serial("id").primaryKey(),
  drawId: integer("draw_id").notNull(),
  userId: integer("user_id").notNull(),
  matchType: matchTypeEnum("match_type").notNull(),
  prizeAmount: numeric("prize_amount", { precision: 12, scale: 2 }).notNull(),
  status: winnerStatusEnum("status").notNull().default("pending"),
  proofImageUrl: text("proof_image_url"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDrawSchema = createInsertSchema(drawsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDraw = z.infer<typeof insertDrawSchema>;
export type Draw = typeof drawsTable.$inferSelect;

export const insertWinnerSchema = createInsertSchema(winnersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type Winner = typeof winnersTable.$inferSelect;
