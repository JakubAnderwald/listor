import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const insertTodoSchema = createInsertSchema(todos).pick({
  text: true,
  completed: true,
});

// Make all fields optional for updates
export const updateTodoSchema = createInsertSchema(todos)
  .pick({
    text: true,
    completed: true,
  })
  .partial(); // This makes all fields optional

export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
export type Todo = typeof todos.$inferSelect;