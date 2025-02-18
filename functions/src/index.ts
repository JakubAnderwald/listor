import { onValueCreated } from 'firebase-functions/v2/database';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onListShared = onValueCreated({
  ref: '/users/{userId}/lists/{listId}/sharedWith/{emailKey}',
  region: 'us-central1'
}, async (event) => {
  try {
    const email = event.data.val();
    const { userId, listId } = event.params;

    // Get list details
    const listSnapshot = await admin
      .database()
      .ref(`/users/${userId}/lists/${listId}`)
      .get();

    const list = listSnapshot.val();

    // Get owner details
    const ownerSnapshot = await admin
      .database()
      .ref(`/users/${userId}/profile`)
      .get();

    const owner = ownerSnapshot.val();

    if (!list || !owner) {
      console.error('List or owner details not found');
      return null;
    }

    // Create a notification in the target user's node
    const usersSnapshot = await admin.database().ref('users').get();
    const users = usersSnapshot.val();

    let targetUserId = null;
    for (const [uid, userData] of Object.entries(users)) {
      if (userData?.profile?.email === email) {
        targetUserId = uid;
        break;
      }
    }

    if (!targetUserId) {
      console.error('Target user not found:', email);
      return null;
    }

    const notificationId = Date.now();
    await admin
      .database()
      .ref(`users/${targetUserId}/notifications/${notificationId}`)
      .set({
        type: 'list_shared',
        message: `${owner.displayName} shared their list "${list.name}" with you`,
        createdAt: new Date().toISOString(),
        read: false,
        listId: listId,
        fromUser: {
          uid: userId,
          displayName: owner.displayName
        }
      });

    return null;
  } catch (error) {
    console.error('Error processing list share:', error);
    return null;
  }
});