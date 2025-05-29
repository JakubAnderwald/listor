import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { storage, auth } from './firebase';

export interface UploadResult {
  downloadURL: string;
  filePath: string;
}

// Upload user avatar
export const uploadAvatar = async (file: File, userId: string): Promise<UploadResult> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Create a reference to the avatar file
  const avatarRef = ref(storage, `avatars/${userId}/${file.name}`);
  
  // Upload the file
  const snapshot = await uploadBytes(avatarRef, file);
  
  // Get the download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // Update the user's profile with the new avatar URL
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      photoURL: downloadURL
    });
  }
  
  return {
    downloadURL,
    filePath: snapshot.ref.fullPath
  };
};

// Delete user avatar
export const deleteAvatar = async (filePath: string): Promise<void> => {
  const avatarRef = ref(storage, filePath);
  await deleteObject(avatarRef);
  
  // Remove the avatar URL from the user's profile
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      photoURL: null
    });
  }
};

// Generate a default avatar URL based on user initials
export const generateDefaultAvatar = (displayName: string): string => {
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
  
  // Using a simple avatar service for default avatars
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=200`;
};

// Validate image file
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  // Check file dimensions (optional - can be implemented with FileReader)
  return { isValid: true };
};