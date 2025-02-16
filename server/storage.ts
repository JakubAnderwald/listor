import { type Todo, type InsertTodo, type UpdateTodo } from "@shared/schema";

export interface IStorage {
  getTodos(): Promise<Todo[]>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, todo: UpdateTodo): Promise<Todo>;
  deleteTodo(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private todos: Map<number, Todo>;
  private currentId: number;

  constructor() {
    this.todos = new Map();
    this.currentId = 1;
  }

  async getTodos(): Promise<Todo[]> {
    return Array.from(this.todos.values());
  }

  async createTodo(insertTodo: InsertTodo): Promise<Todo> {
    const id = this.currentId++;
    const todo: Todo = {
      id,
      text: insertTodo.text,
      completed: insertTodo.completed ?? false,
      dueDate: insertTodo.dueDate ?? null,
    };
    this.todos.set(id, todo);
    return todo;
  }

  async updateTodo(id: number, updateTodo: UpdateTodo): Promise<Todo> {
    const existingTodo = this.todos.get(id);
    if (!existingTodo) {
      throw new Error("Todo not found");
    }

    const updatedTodo: Todo = {
      ...existingTodo,
      ...(updateTodo.text !== undefined && { text: updateTodo.text }),
      ...(updateTodo.completed !== undefined && { completed: updateTodo.completed }),
      ...(updateTodo.dueDate !== undefined && { dueDate: updateTodo.dueDate }),
    };

    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  async deleteTodo(id: number): Promise<void> {
    if (!this.todos.has(id)) {
      throw new Error("Todo not found");
    }
    this.todos.delete(id);
  }
}

export const storage = new MemStorage();