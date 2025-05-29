import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export individual function modules
export { sendListInvitation } from './sendListInvitation';
export { acceptListInvitation } from './acceptListInvitation';
export { generateRecurringTasks } from './generateRecurringTasks';