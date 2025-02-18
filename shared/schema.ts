import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define recurring options as an enum
export const RecurrenceType = {
  NONE: "none",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

// Define priority levels as an enum
export const PriorityLevel = {
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

// Define the List schema
export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#000000"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date"),
  recurrenceType: text("recurrence_type").notNull().default(RecurrenceType.NONE),
  originalDueDate: timestamp("original_due_date"),
  priority: text("priority").notNull().default(PriorityLevel.MEDIUM),
  listId: serial("list_id").notNull(),
});

// List schemas
export const listSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  createdAt: z.string(),
  sharedBy: z.string().optional(),
});

export const insertListSchema = createInsertSchema(lists)
  .pick({
    name: true,
    color: true,
  })
  .extend({
    name: z.string().min(1, "List name is required"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  });

// Todo schemas
export const todoSchema = z.object({
  id: z.number(),
  text: z.string(),
  completed: z.boolean(),
  dueDate: z.string().nullable(),
  recurrenceType: z.enum([
    RecurrenceType.NONE,
    RecurrenceType.DAILY,
    RecurrenceType.WEEKLY,
    RecurrenceType.MONTHLY,
    RecurrenceType.YEARLY,
  ]).default(RecurrenceType.NONE),
  originalDueDate: z.string().nullable(),
  priority: z.enum([
    PriorityLevel.NONE,
    PriorityLevel.LOW,
    PriorityLevel.MEDIUM,
    PriorityLevel.HIGH,
  ]).default(PriorityLevel.NONE),
  listId: z.number(),
});

export const insertTodoSchema = createInsertSchema(todos)
  .pick({
    text: true,
    completed: true,
    dueDate: true,
    recurrenceType: true,
    originalDueDate: true,
    priority: true,
    listId: true,
  })
  .extend({
    dueDate: z.string().nullable(),
    recurrenceType: z.enum([
      "none",
      "daily",
      "weekly",
      "monthly",
      "yearly"
    ], {
      errorMap: () => ({ message: "Please select a valid repeat option" })
    }).default("none"),
    originalDueDate: z.string().nullable(),
    priority: z.enum([
      "none",
      "low",
      "medium",
      "high"
    ], {
      errorMap: () => ({ message: "Please select a valid priority level" })
    }).default("none"),
    listId: z.number(),
  })
  .refine(
    (data) => {
      return data.recurrenceType === "none" || (data.dueDate !== null && data.dueDate !== undefined);
    },
    {
      message: "Due date is required for recurring tasks",
      path: ["dueDate"],
    }
  );

export const updateTodoSchema = createInsertSchema(todos)
  .pick({
    text: true,
    completed: true,
    dueDate: true,
    recurrenceType: true,
    originalDueDate: true,
    priority: true,
    listId: true,
  })
  .partial()
  .extend({
    dueDate: z.string().nullable().optional(),
    recurrenceType: z.enum([
      RecurrenceType.NONE,
      RecurrenceType.DAILY,
      RecurrenceType.WEEKLY,
      RecurrenceType.MONTHLY,
      RecurrenceType.YEARLY,
    ]).optional(),
    originalDueDate: z.string().nullable().optional(),
    priority: z.enum([
      PriorityLevel.LOW,
      PriorityLevel.MEDIUM,
      PriorityLevel.HIGH,
    ]).optional(),
  });

export type List = z.infer<typeof listSchema>;
export type InsertList = z.infer<typeof insertListSchema>;
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
export type Todo = z.infer<typeof todoSchema>;