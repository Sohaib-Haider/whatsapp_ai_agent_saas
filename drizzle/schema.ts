import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Business account linked to a user.
 * Each user can manage one or more WhatsApp Business accounts.
 * Stores WhatsApp API credentials and agent configuration.
 */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  whatsappPhoneNumber: varchar("whatsappPhoneNumber", { length: 20 }).notNull(),
  phoneNumberId: varchar("phoneNumberId", { length: 255 }).notNull(),
  accessToken: text("accessToken").notNull(),
  verifyToken: varchar("verifyToken", { length: 255 }).notNull(),
  agentName: varchar("agentName", { length: 255 }).notNull(),
  agentPersona: text("agentPersona"),
  systemPrompt: text("systemPrompt"),
  aiEnabled: boolean("aiEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Conversation between a business and a customer.
 * Tracks conversation state, AI toggle status, and escalation status.
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  customerPhoneNumber: varchar("customerPhoneNumber", { length: 20 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  aiEnabled: boolean("aiEnabled").default(true).notNull(),
  isEscalated: boolean("isEscalated").default(false).notNull(),
  isWaitingForHuman: boolean("isWaitingForHuman").default(false).notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  unreadCount: int("unreadCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Message in a conversation.
 * Stores all inbound and outbound messages with metadata.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  businessId: int("businessId").notNull(),
  whatsappMessageId: varchar("whatsappMessageId", { length: 255 }).unique(),
  senderType: mysqlEnum("senderType", ["customer", "business", "ai"]).notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "delivered", "read", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Escalation event tracking.
 * Records when a conversation is escalated and requires human attention.
 */
export const escalations = mysqlTable("escalations", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  businessId: int("businessId").notNull(),
  reason: varchar("reason", { length: 255 }),
  triggerMessage: text("triggerMessage"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Escalation = typeof escalations.$inferSelect;
export type InsertEscalation = typeof escalations.$inferInsert;

/**
 * Analytics snapshot for a business.
 * Stores aggregated metrics for dashboard display.
 */
export const analytics = mysqlTable("analytics", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  totalMessages: int("totalMessages").default(0).notNull(),
  aiMessages: int("aiMessages").default(0).notNull(),
  humanMessages: int("humanMessages").default(0).notNull(),
  activeConversations: int("activeConversations").default(0).notNull(),
  escalationCount: int("escalationCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

/**
 * Relations for Drizzle ORM.
 */
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, { fields: [businesses.userId], references: [users.id] }),
  conversations: many(conversations),
  messages: many(messages),
  escalations: many(escalations),
  analytics: many(analytics),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  business: one(businesses, { fields: [conversations.businessId], references: [businesses.id] }),
  messages: many(messages),
  escalations: many(escalations),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  business: one(businesses, { fields: [messages.businessId], references: [businesses.id] }),
}));

export const escalationsRelations = relations(escalations, ({ one }) => ({
  conversation: one(conversations, { fields: [escalations.conversationId], references: [conversations.id] }),
  business: one(businesses, { fields: [escalations.businessId], references: [businesses.id] }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  business: one(businesses, { fields: [analytics.businessId], references: [businesses.id] }),
}));
