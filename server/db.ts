import { eq, and, desc, asc, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  businesses,
  conversations,
  messages,
  escalations,
  analytics,
  type Business,
  type Conversation,
  type Message,
  type Escalation,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Business queries
export async function createBusiness(data: {
  userId: number;
  businessName: string;
  whatsappPhoneNumber: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  agentName: string;
  agentPersona?: string;
  systemPrompt?: string;
}): Promise<Business> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(businesses).values(data);
  const businessId = result[0]?.insertId;
  if (!businessId) throw new Error("Failed to create business");

  const created = await db.select().from(businesses).where(eq(businesses.id, businessId as number)).limit(1);
  return created[0]!;
}

export async function getBusinessById(id: number): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result[0];
}

export async function getBusinessesByUserId(userId: number): Promise<Business[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(businesses).where(eq(businesses.userId, userId));
}

export async function updateBusiness(id: number, data: Partial<Business>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(businesses).set(data).where(eq(businesses.id, id));
}

// Conversation queries
export async function createConversation(data: {
  businessId: number;
  customerPhoneNumber: string;
  customerName?: string;
}): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(data);
  const conversationId = result[0]?.insertId;
  if (!conversationId) throw new Error("Failed to create conversation");

  const created = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId as number))
    .limit(1);
  return created[0]!;
}

export async function getConversationById(id: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function getConversationByPhoneAndBusiness(
  businessId: number,
  phoneNumber: string
): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.businessId, businessId), eq(conversations.customerPhoneNumber, phoneNumber)))
    .limit(1);
  return result[0];
}

export async function getConversationsByBusinessId(businessId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(conversations)
    .where(eq(conversations.businessId, businessId))
    .orderBy(desc(conversations.lastMessageAt));
}

export async function updateConversation(id: number, data: Partial<Conversation>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

// Message queries
export async function createMessage(data: {
  conversationId: number;
  businessId: number;
  whatsappMessageId?: string;
  senderType: "customer" | "business" | "ai";
  content: string;
}): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data);
  const messageId = result[0]?.insertId;
  if (!messageId) throw new Error("Failed to create message");

  const created = await db.select().from(messages).where(eq(messages.id, messageId as number)).limit(1);
  return created[0]!;
}

export async function getMessagesByConversationId(conversationId: number, limit = 50): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(limit);
}

export async function updateMessage(id: number, data: Partial<Message>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(messages).set(data).where(eq(messages.id, id));
}

// Escalation queries
export async function createEscalation(data: {
  conversationId: number;
  businessId: number;
  reason?: string;
  triggerMessage?: string;
}): Promise<Escalation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(escalations).values(data);
  const escalationId = result[0]?.insertId;
  if (!escalationId) throw new Error("Failed to create escalation");

  const created = await db.select().from(escalations).where(eq(escalations.id, escalationId as number)).limit(1);
  return created[0]!;
}

export async function getEscalationsByBusinessId(businessId: number): Promise<Escalation[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(escalations)
    .where(and(eq(escalations.businessId, businessId), isNull(escalations.resolvedAt)))
    .orderBy(desc(escalations.createdAt));
}

export async function resolveEscalation(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(escalations).set({ resolvedAt: new Date() }).where(eq(escalations.id, id));
}

export async function deleteMessagesByConversationId(conversationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(messages).where(eq(messages.conversationId, conversationId));
}
