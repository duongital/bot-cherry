import {
  boolean,
  date,
  index,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema for better-auth (PostgreSQL).
 *
 * Field names (camelCase) are what better-auth's drizzle adapter reads;
 * column names match better-auth's default generated schema.
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const savedItem = pgTable(
  "saved_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    // "markdown" | "plain"; validated in the API.
    contentFormat: text("content_format").notNull().default("plain"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("saved_item_user_created_idx").on(t.userId, t.createdAt)],
);

export const tag = pgTable(
  "tag",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Canonical lowercase name.
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("tag_user_name_unique").on(t.userId, t.name),
    index("tag_user_idx").on(t.userId),
  ],
);

/**
 * One free-form note per tag. Kept separate from `tag` so a tag can exist
 * without a note and notes can grow without touching the tag row.
 */
export const tagNote = pgTable("tag_note", {
  tagId: text("tag_id")
    .primaryKey()
    .references(() => tag.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const savedItemTag = pgTable(
  "saved_item_tag",
  {
    savedItemId: text("saved_item_id")
      .notNull()
      .references(() => savedItem.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.savedItemId, t.tagId] }),
    index("saved_item_tag_tag_idx").on(t.tagId),
  ],
);


export const healthConversation = pgTable(
  "health_conversation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("health_conversation_user_updated_idx").on(t.userId, t.updatedAt),
  ],
);

export const symptomLog = pgTable(
  "symptom_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").references(
      () => healthConversation.id,
      { onDelete: "set null" },
    ),
    messageId: text("message_id"),
    logDate: date("log_date").notNull(),
    rawInput: text("raw_input").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("symptom_log_user_date_idx").on(t.userId, t.logDate)],
);

export const healthMessage = pgTable(
  "health_message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => healthConversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // "user" | "assistant"; validated by the API.
    role: text("role").notNull(),
    content: text("content").notNull(),
    form: jsonb("form"),
    logId: text("log_id").references(() => symptomLog.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("health_message_conversation_created_idx").on(
      t.conversationId,
      t.createdAt,
    ),
  ],
);

export const symptomLogEntry = pgTable(
  "symptom_log_entry",
  {
    id: text("id").primaryKey(),
    logId: text("log_id")
      .notNull()
      .references(() => symptomLog.id, { onDelete: "cascade" }),
    symptom: text("symptom").notNull(),
    present: boolean("present").notNull(),
    severity: smallint("severity"),
    note: text("note"),
  },
  (t) => [uniqueIndex("symptom_log_entry_log_symptom_unique").on(t.logId, t.symptom)],
);

export const schema = {
  user,
  session,
  account,
  verification,
  savedItem,
  tag,
  tagNote,
  savedItemTag,
  healthConversation,
  healthMessage,
  symptomLog,
  symptomLogEntry,
};
