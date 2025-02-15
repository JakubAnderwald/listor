import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, update, remove } from "firebase/database";
import type { Todo } from "@shared/schema";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and references
const database = getDatabase(app);
const todosRef = ref(database, 'todos');

// Firebase Database API
export const firebaseDB = {
  subscribeTodos: (callback: (todos: Todo[]) => void) => {
    return onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      const todos: Todo[] = [];

      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            todos.push({
              id: parseInt(key),
              text: value.text || '',
              completed: !!value.completed
            });
          }
        });
      }

      callback(todos);
    });
  },

  async createTodo(todo: Omit<Todo, 'id'>) {
    try {
      // Create a new todo with specific fields to match validation rules
      const todoData = {
        text: todo.text,
        completed: false // Always start as not completed
      };

      const id = Date.now(); // Use timestamp as ID
      const todoRef = ref(database, `todos/${id}`);

      await update(todoRef, todoData);
      return { ...todoData, id };
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  },

  async updateTodo(id: number, todo: Partial<Todo>) {
    try {
      const updateData: Record<string, any> = {};
      if (todo.text !== undefined) updateData.text = todo.text;
      if (todo.completed !== undefined) updateData.completed = todo.completed;

      await update(ref(database, `todos/${id}`), updateData);
      return { id, ...todo };
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  },

  async deleteTodo(id: number) {
    try {
      await remove(ref(database, `todos/${id}`));
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  }
};