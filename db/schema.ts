import { pgTable, text, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  needsPasswordReset: boolean("needs_password_reset").default(false).notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  websiteUrl: text("website_url").notNull(),
  logoUrl: text("logo_url").notNull(),
  screenshotUrl: text("screenshot_url"),
  founderName: text("founder_name").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  lookingFor: text("looking_for").notNull(),
  plan: text("plan").notNull(),
  paymentStatus: text("payment_status").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  canvasX: integer("canvas_x").notNull(),
  canvasY: integer("canvas_y").notNull(),
  tileSize: text("tile_size").notNull(),
  vehicleId: text("vehicle_id").default("lada").notNull(),
  views: integer("views").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider").notNull(),
  providerPaymentId: text("provider_payment_id").notNull().unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  founderId: text("founder_id").references(() => users.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  senderId: text("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  email: text("email").notNull(),
  issueType: text("issue_type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
