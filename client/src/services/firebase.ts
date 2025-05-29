import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAsgzvAQl_EXNp-YyF0GuvxOpnu7DAXKDQ",
  authDomain: "listor-76c28.firebaseapp.com",
  databaseURL: "https://listor-76c28-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "listor-76c28",
  storageBucket: "listor-76c28.firebasestorage.app",
  messagingSenderId: "334705407159",
  appId: "1:334705407159:web:7982eddea5444d70354932",
  measurementId: "G-BZENGZD3VP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;