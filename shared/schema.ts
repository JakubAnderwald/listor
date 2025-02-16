import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date"),
});

export const insertTodoSchema = createInsertSchema(todos).pick({
  text: true,
  completed: true,
  dueDate: true,
}).extend({
  dueDate: z.string().nullable().optional(),
});

// Make all fields optional for updates
export const updateTodoSchema = createInsertSchema(todos)
  .pick({
    text: true,
    completed: true,
    dueDate: true,
  })
  .partial(); // This makes all fields optional

export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
export type Todo = typeof todos.$inferSelect;