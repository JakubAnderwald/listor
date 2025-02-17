import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, get, remove } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { Todo, List } from "@shared/schema";
import { format, addDays, addMonths, addYears, parseISO } from "date-fns";

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

// Calculate next due date based on recurrence type
const getNextDueDate = (currentDueDate: string, recurrenceType: string): string => {
  const date = parseISO(currentDueDate);
  switch (recurrenceType) {
    case 'daily':
      return addDays(date, 1).toISOString();
    case 'weekly':
      return addDays(date, 7).toISOString();
    case 'monthly':
      return addMonths(date, 1).toISOString();
    case 'yearly':
      return addYears(date, 1).toISOString();
    default:
      return currentDueDate;
  }
};

// Firebase Auth API
export const firebaseAuth = {
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Create or update user profile
      if (result.user) {
        await firebaseDB.updateUserProfile({
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          lastLogin: new Date().toISOString(),
        });

        // Create default "Inbox" list if it doesn't exist
        const existingInbox = await firebaseDB.getListByName("Inbox");
        if (!existingInbox) {
          await firebaseDB.createList({
            name: "Inbox",
            color: "#6366f1" // Indigo color for inbox
          });
        }
      }

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
  async getUserProfile() {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to get user profile');

    try {
      const snapshot = await get(ref(database, `users/${user.uid}/profile`));
      return snapshot.val();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(profile: {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    lastLogin: string;
  }) {
    try {
      await set(ref(database, `users/${profile.uid}/profile`), profile);
      return profile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  subscribeLists: (callback: (lists: List[]) => void) => {
    const user = auth.currentUser;
    if (!user) return () => {};

    return onValue(ref(database, `users/${user.uid}/lists`), (snapshot) => {
      const data = snapshot.val();
      const lists: List[] = [];

      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            lists.push({
              id: parseInt(key),
              name: value.name,
              color: value.color,
              createdAt: value.createdAt,
            });
          }
        });
      }

      callback(lists);
    });
  },

  async createList(list: Omit<List, 'id' | 'createdAt'>) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to create lists');

    try {
      const listData = {
        name: list.name,
        color: list.color,
        createdAt: new Date().toISOString(),
      };

      const id = Date.now();
      await set(ref(database, `users/${user.uid}/lists/${id}`), listData);
      return { ...listData, id };
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  },

  async updateList(id: number, list: Partial<List>) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update lists');

    try {
      const listRef = ref(database, `users/${user.uid}/lists/${id}`);
      const snapshot = await get(listRef);
      const currentData = snapshot.val();

      if (!currentData) {
        throw new Error(`List with id ${id} not found`);
      }

      const mergedData = {
        ...currentData,
        ...(list.name !== undefined && { name: list.name }),
        ...(list.color !== undefined && { color: list.color }),
      };

      await set(listRef, mergedData);
      return { id, ...mergedData };
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  },

  async deleteList(id: number) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete lists');

    try {
      // First, delete all todos in this list
      const todosSnapshot = await get(ref(database, `users/${user.uid}/todos`));
      const todos = todosSnapshot.val();

      if (todos) {
        const deletions = Object.entries(todos)
          .filter(([_, todo]: [string, any]) => todo.listId === id)
          .map(([todoId]) => remove(ref(database, `users/${user.uid}/todos/${todoId}`)));

        await Promise.all(deletions);
      }

      // Then delete the list itself
      await remove(ref(database, `users/${user.uid}/lists/${id}`));
    } catch (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  },

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
              dueDate: value.dueDate || null,
              recurrenceType: value.recurrenceType || 'none',
              originalDueDate: value.originalDueDate || null,
              priority: value.priority || 'none',
              listId: value.listId
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
        dueDate: todo.dueDate || null,
        recurrenceType: todo.recurrenceType || 'none',
        originalDueDate: todo.dueDate || null,
        priority: todo.priority || 'none',
        listId: todo.listId
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
        ...(todo.dueDate !== undefined && { dueDate: todo.dueDate }),
        ...(todo.recurrenceType !== undefined && { recurrenceType: todo.recurrenceType }),
        ...(todo.priority !== undefined && { priority: todo.priority }),
        ...(todo.listId !== undefined && { listId: todo.listId })
      };

      await set(todoRef, mergedData);

      if (todo.completed && mergedData.completed && mergedData.recurrenceType !== 'none' && mergedData.dueDate) {
        const nextDueDate = getNextDueDate(mergedData.dueDate, mergedData.recurrenceType);
        const nextTodo = {
          text: mergedData.text,
          completed: false,
          dueDate: nextDueDate,
          recurrenceType: mergedData.recurrenceType,
          originalDueDate: mergedData.originalDueDate || mergedData.dueDate,
          priority: mergedData.priority,
          listId: mergedData.listId
        };

        const nextId = Date.now();
        await set(ref(database, `users/${user.uid}/todos/${nextId}`), nextTodo);
      }

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
  },

  async getListByName(name: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    try {
      const snapshot = await get(ref(database, `users/${user.uid}/lists`));
      const lists = snapshot.val();
      if (!lists) return null;

      const matchingList = Object.entries(lists).find(([_, list]: [string, any]) => list.name === name);
      return matchingList ? { id: parseInt(matchingList[0]), ...matchingList[1] } : null;
    } catch (error) {
      console.error('Error getting list by name:', error);
      throw error;
    }
  },
};