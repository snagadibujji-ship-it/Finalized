import {
  pgTable,
  text,
  serial,
  timestamp,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shopStatusEnum = pgEnum("shop_status", [
  "pending",
  "active",
  "suspended",
]);

export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => usersTable.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  area: text("area").notNull(),
  logoUrl: text("logo_url"),
  status: shopStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({
  id: true,
  createdAt: true,
});

export const selectShopSchema = createSelectSchema(shopsTable);

export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;
