import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, get, remove } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { Todo } from "@shared/schema";
import { format } from "date-fns";

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

// Initialize Firebase services
const database = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firebase Auth API
export const firebaseAuth = {
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  onAuthStateChanged(callback: (user: any) => void) {
    return auth.onAuthStateChanged(callback);
  }
};

// Firebase Database API
export const firebaseDB = {
  subscribeTodos: (callback: (todos: Todo[]) => void) => {
    const user = auth.currentUser;
    if (!user) return () => {};

    return onValue(ref(database, `users/${user.uid}/todos`), (snapshot) => {
      const data = snapshot.val();
      const todos: Todo[] = [];

      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            todos.push({
              id: parseInt(key),
              text: value.text || '',
              completed: !!value.completed,
              dueDate: value.dueDate || null
            });
          }
        });
      }

      callback(todos);
    });
  },

  async createTodo(todo: Omit<Todo, 'id'>) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to create todos');

    try {
      const todoData = {
        text: todo.text,
        completed: false,
        dueDate: todo.dueDate || null
      };

      const id = Date.now();
      await set(ref(database, `users/${user.uid}/todos/${id}`), todoData);
      return { ...todoData, id };
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  },

  async updateTodo(id: number, todo: Partial<Todo>) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update todos');

    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${id}`);
      const snapshot = await get(todoRef);
      const currentData = snapshot.val();

      if (!currentData) {
        throw new Error(`Todo with id ${id} not found`);
      }

      const mergedData = {
        ...currentData,
        ...(todo.text !== undefined && { text: todo.text }),
        ...(todo.completed !== undefined && { completed: todo.completed }),
        ...(todo.dueDate !== undefined && { dueDate: todo.dueDate })
      };

      await set(todoRef, mergedData);
      return { id, ...mergedData };
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  },

  async deleteTodo(id: number) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete todos');

    try {
      await remove(ref(database, `users/${user.uid}/todos/${id}`));
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  }
};