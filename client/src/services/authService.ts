import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { ref, set, serverTimestamp, get } from 'firebase/database';
import { auth, database } from './firebase';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
}

// Email/Password Authentication
export const loginWithEmail = async (credentials: LoginCredentials): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  return userCredential.user;
};

export const signupWithEmail = async (data: SignupData): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  
  // Update the user's display name
  await updateProfile(userCredential.user, {
    displayName: data.displayName
  });

  // Create user record in Realtime Database
  const userRef = ref(database, `users/${userCredential.user.uid}`);
  await set(userRef, {
    email: data.email,
    displayName: data.displayName,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp()
  });
  
  return userCredential.user;
};

// Google OAuth Authentication
export const loginWithGoogle = async (): Promise<User> => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  
  // Check if user already exists in database, if not create them
  const userRef = ref(database, `users/${userCredential.user.uid}`);
  const userSnapshot = await get(userRef);
  
  if (!userSnapshot.exists()) {
    await set(userRef, {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || 'User',
      avatarUrl: userCredential.user.photoURL,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });
  } else {
    // Update last active time for existing users
    await set(ref(database, `users/${userCredential.user.uid}/lastActive`), serverTimestamp());
  }
  
  return userCredential.user;
};

// Password Reset
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Sign Out
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Auth state observer
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};