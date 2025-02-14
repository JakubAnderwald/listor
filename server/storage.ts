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
    const todo: Todo = { ...insertTodo, id };
    this.todos.set(id, todo);
    return todo;
  }

  async updateTodo(id: number, updateTodo: UpdateTodo): Promise<Todo> {
    const existingTodo = this.todos.get(id);
    if (!existingTodo) {
      throw new Error("Todo not found");
    }
    // Only update the fields that are provided
    const updatedTodo = { ...existingTodo };
    if (updateTodo.text !== undefined) {
      updatedTodo.text = updateTodo.text;
    }
    if (updateTodo.completed !== undefined) {
      updatedTodo.completed = updateTodo.completed;
    }
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