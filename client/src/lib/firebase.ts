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
export const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

// Database references
const todosRef = ref(database, 'todos');

// Firebase Database API
export const firebaseDB = {
  subscribeTodos: (callback: (todos: Todo[]) => void) => {
    return onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      const todos: Todo[] = [];

      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          todos.push({
            id: parseInt(key),
            ...(value as Omit<Todo, 'id'>)
          });
        });
      }

      callback(todos);
    });
  },

  async createTodo(todo: Omit<Todo, 'id'>) {
    const newTodoRef = push(todosRef);
    const id = parseInt(newTodoRef.key!.slice(-8), 16);
    await update(todosRef, {
      [id]: todo
    });
    return { ...todo, id };
  },

  async updateTodo(id: number, todo: Partial<Todo>) {
    await update(ref(database, `todos/${id}`), todo);
    return { id, ...todo };
  },

  async deleteTodo(id: number) {
    await remove(ref(database, `todos/${id}`));
  }
};