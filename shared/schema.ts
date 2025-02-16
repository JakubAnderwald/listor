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
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date"),
  recurrenceType: text("recurrence_type").notNull().default(RecurrenceType.NONE),
  originalDueDate: timestamp("original_due_date"), // To maintain the original pattern
  priority: text("priority").notNull().default(PriorityLevel.MEDIUM),
});

// Define a more precise schema for the todo
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
    PriorityLevel.LOW,
    PriorityLevel.MEDIUM,
    PriorityLevel.HIGH,
  ]).default(PriorityLevel.MEDIUM),
});

export const insertTodoSchema = createInsertSchema(todos)
  .pick({
    text: true,
    completed: true,
    dueDate: true,
    recurrenceType: true,
    originalDueDate: true,
    priority: true,
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
      "low",
      "medium",
      "high"
    ], {
      errorMap: () => ({ message: "Please select a valid priority level" })
    }).default("medium"),
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

// Make all fields optional for updates
export const updateTodoSchema = createInsertSchema(todos)
  .pick({
    text: true,
    completed: true,
    dueDate: true,
    recurrenceType: true,
    originalDueDate: true,
    priority: true,
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

export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
export type Todo = z.infer<typeof todoSchema>;