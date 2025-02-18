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

    // Create a map to track unique lists
    const listsMap = new Map<string, List>();

    // Subscribe to own lists
    const listsRef = ref(database, `users/${user.uid}/lists`);
    const ownListsUnsubscribe = onValue(listsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            const listId = parseInt(key);
            const uniqueId = `own_${listId}`;
            listsMap.set(uniqueId, {
              id: listId,
              name: value.name,
              color: value.color,
              createdAt: value.createdAt,
              sharedCount: value.sharedWith ? Object.keys(value.sharedWith).length : 0
            });
          }
        });
      }

      // Trigger callback with current lists
      callback(Array.from(listsMap.values()));
    });

    // Subscribe to shared lists
    const sharedWithMeRef = ref(database, `users/${user.uid}/sharedWithMe`);
    const sharedListsUnsubscribe = onValue(sharedWithMeRef, async (snapshot) => {
      const sharedData = snapshot.val();

      // Remove all previously shared lists from the map
      for (const [key] of listsMap.entries()) {
        if (key.startsWith('shared_')) {
          listsMap.delete(key);
        }
      }

      if (sharedData) {
        for (const [ownerUid, lists] of Object.entries(sharedData)) {
          if (!lists) continue;

          try {
            const ownerListsSnapshot = await get(ref(database, `users/${ownerUid}/lists`));
            const ownerLists = ownerListsSnapshot.val();

            if (ownerLists) {
              Object.entries(lists).forEach(([listId]) => {
                const list = ownerLists[listId];
                if (list) {
                  const uniqueId = `shared_${ownerUid}_${listId}`;
                  listsMap.set(uniqueId, {
                    id: parseInt(listId),
                    name: list.name,
                    color: list.color,
                    createdAt: list.createdAt,
                    sharedBy: ownerUid,
                    sharedCount: list.sharedWith ? Object.keys(list.sharedWith).length : 0
                  });
                }
              });
            }
          } catch (error) {
            console.error('Error fetching shared lists:', error);
          }
        }
      }

      // Trigger callback with updated lists including shared ones
      callback(Array.from(listsMap.values()));
    });

    return () => {
      ownListsUnsubscribe();
      sharedListsUnsubscribe();
    };
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

  // Update the shareList function to fix the user lookup
  async shareList(listId: number, email: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to share lists');

    try {
      // Prevent sharing with yourself
      if (email === user.email) {
        throw new Error('Cannot share a list with yourself');
      }

      // Get list details
      const listRef = ref(database, `users/${user.uid}/lists/${listId}`);
      const snapshot = await get(listRef);
      const listData = snapshot.val();

      if (!listData) {
        throw new Error(`List with id ${listId} not found`);
      }

      // Normalize email by replacing '.' with '_' for Firebase path
      const normalizedEmail = email.replace(/\./g, '_');

      // Add email to sharedWith
      await set(ref(database, `users/${user.uid}/lists/${listId}/sharedWith/${normalizedEmail}`), email);

      // Find user by email
      const usersRef = ref(database, 'users');
      const userSnapshot = await get(usersRef);
      const users = userSnapshot.val();

      if (!users) {
        throw new Error('User not found');
      }

      let targetUserId = null;
      for (const [uid, userData] of Object.entries(users)) {
        if (userData?.profile?.email === email) {
          targetUserId = uid;
          break;
        }
      }

      if (!targetUserId) {
        throw new Error('User not found');
      }

      // Prevent creating circular references
      if (targetUserId === user.uid) {
        throw new Error('Cannot share a list with yourself');
      }

      // Create shared reference
      await set(ref(database, `users/${targetUserId}/sharedWithMe/${user.uid}/${listId}`), true);

      // Create notification
      const notificationId = Date.now();
      await set(ref(database, `users/${targetUserId}/notifications/${notificationId}`), {
        type: 'list_shared',
        message: `${user.displayName} shared the list "${listData.name}" with you`,
        createdAt: new Date().toISOString(),
        read: false,
        listId: listId,
        fromUser: {
          uid: user.uid,
          displayName: user.displayName
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error sharing list:', error);
      throw error;
    }
  },

  async unshareList(listId: number, email: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to unshare lists');

    try {
      // First verify the list exists and user owns it
      const listRef = ref(database, `users/${user.uid}/lists/${listId}`);
      const listSnapshot = await get(listRef);
      const list = listSnapshot.val();

      if (!list) {
        console.error('List not found:', listId);
        throw new Error('List not found');
      }

      // Find user by email to remove shared reference
      const usersRef = ref(database, 'users');
      const userSnapshot = await get(usersRef);
      const users = userSnapshot.val();

      if (!users) {
        console.error('No users found in database');
        throw new Error('User not found');
      }

      let targetUserId = null;
      for (const [uid, userData] of Object.entries<any>(users)) {
        if (userData?.profile?.email === email) {
          targetUserId = uid;
          break;
        }
      }

      if (!targetUserId) {
        console.error('Target user not found for email:', email);
        throw new Error('User not found');
      }

      // Verify the list is actually shared with this user
      const normalizedEmail = email.replace(/\./g, '_');
      const sharedWithRef = ref(database, `users/${user.uid}/lists/${listId}/sharedWith/${normalizedEmail}`);
      const sharedWithSnapshot = await get(sharedWithRef);

      if (!sharedWithSnapshot.exists()) {
        console.error('List is not shared with this user:', email);
        throw new Error('List is not shared with this user');
      }

      // Remove from sharedWith
      await remove(sharedWithRef);

      // Remove from sharedWithMe
      const sharedWithMeRef = ref(database, `users/${targetUserId}/sharedWithMe/${user.uid}/${listId}`);
      await remove(sharedWithMeRef);

      return { success: true };
    } catch (error) {
      console.error('Error unsharing list:', error);
      throw error;
    }
  },

  async getSharedWithMe() {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to get shared lists');

    try {
      const sharedWithMeRef = ref(database, `users/${user.uid}/sharedWithMe`);
      const snapshot = await get(sharedWithMeRef);
      const sharedData = snapshot.val();

      if (!sharedData) return [];

      const sharedLists: List[] = [];
      for (const [ownerUid, lists] of Object.entries(sharedData)) {
        const listsRef = ref(database, `users/${ownerUid}/lists`);
        const listsSnapshot = await get(listsRef);
        const listsData = listsSnapshot.val();

        if (listsData) {
          Object.entries(listsData).forEach(([listId, list]: [string, any]) => {
            if (list && typeof list === 'object' && lists[listId]) {
              sharedLists.push({
                id: parseInt(listId),
                name: `${list.name} (Shared)`,
                color: list.color,
                createdAt: list.createdAt,
                sharedBy: ownerUid,
              });
            }
          });
        }
      }

      return sharedLists;
    } catch (error) {
      console.error('Error getting shared lists:', error);
      throw error;
    }
  },
  subscribeNotifications: (callback: (notifications: any[]) => void) => {
    const user = auth.currentUser;
    if (!user) return () => {};

    return onValue(ref(database, `users/${user.uid}/notifications`), (snapshot) => {
      const data = snapshot.val();
      const notifications: any[] = [];

      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            notifications.push({
              id: parseInt(key),
              ...value
            });
          }
        });
      }

      callback(notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });
  },

  async markNotificationAsRead(notificationId: number) {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    try {
      await set(ref(database, `users/${user.uid}/notifications/${notificationId}/read`), true);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  async cleanupSharedReferences() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Remove any self-references in sharedWithMe
      const sharedWithMeRef = ref(database, `users/${user.uid}/sharedWithMe/${user.uid}`);
      await remove(sharedWithMeRef);

      // Remove self email from sharedWith in own lists
      const listsRef = ref(database, `users/${user.uid}/lists`);
      const snapshot = await get(listsRef);
      const lists = snapshot.val();

      if (lists) {
        const normalizedEmail = user.email?.replace(/\./g, '_');
        if (normalizedEmail) {
          const updates: Record<string, null> = {};

          Object.keys(lists).forEach(listId => {
            if (lists[listId].sharedWith?.[normalizedEmail]) {
              updates[`users/${user.uid}/lists/${listId}/sharedWith/${normalizedEmail}`] = null;
            }
          });

          if (Object.keys(updates).length > 0) {
            await set(ref(database), updates);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up shared references:', error);
    }
  },
  // Add function to get shared users
  async getSharedUsers(listId: number): Promise<string[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to get shared users');

    try {
      const snapshot = await get(ref(database, `users/${user.uid}/lists/${listId}/sharedWith`));
      const sharedWith = snapshot.val();
      return sharedWith ? Object.values(sharedWith) : [];
    } catch (error) {
      console.error('Error getting shared users:', error);
      throw error;
    }
  },
};