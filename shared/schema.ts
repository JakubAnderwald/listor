import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date"),
});

// Define a more precise schema for the todo
export const todoSchema = z.object({
  id: z.number(),
  text: z.string(),
  completed: z.boolean(),
  dueDate: z.string().nullable(),
});

export const insertTodoSchema = createInsertSchema(todos)
  .pick({
    text: true,
    completed: true,
    dueDate: true,
  })
  .extend({
    dueDate: z.string().nullable(),
  });

// Make all fields optional for updates
export const updateTodoSchema = createInsertSchema(todos)
  .pick({
    text: true,
    completed: true,
    dueDate: true,
  })
  .partial()
  .extend({
    dueDate: z.string().nullable().optional(),
  });

export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
export type Todo = z.infer<typeof todoSchema>;