import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onListShared = functions.database
  .ref('/users/{userId}/lists/{listId}/sharedWith/{emailKey}')
  .onCreate(async (snapshot, context) => {
    try {
      const email = snapshot.val();
      const { userId, listId } = context.params;

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

      if (targetUserId) {
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
      }

      return null;
    } catch (error) {
      console.error('Error processing list share:', error);
      return null;
    }
  });