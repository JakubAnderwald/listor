import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface AcceptInvitationData {
  token: string;
}

export const acceptListInvitation = functions.https.onCall(async (data: AcceptInvitationData, context) => {
  // Verify user is authenticated
  if (!context || !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { token } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Invitation token is required');
  }

  const db = admin.database();
  const userEmail = context.auth.token.email;

  try {
    // Find invitation by token
    const invitationsSnapshot = await db.ref('invitations')
      .orderByChild('token')
      .equalTo(token)
      .once('value');

    const invitations = invitationsSnapshot.val();
    
    if (!invitations) {
      throw new functions.https.HttpsError('not-found', 'Invalid invitation token');
    }

    const invitationId = Object.keys(invitations)[0];
    const invitation = invitations[invitationId];

    // Verify invitation is valid
    if (invitation.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Invitation has already been processed');
    }

    if (invitation.expiresAt < Date.now()) {
      throw new functions.https.HttpsError('deadline-exceeded', 'Invitation has expired');
    }

    if (invitation.inviteeEmail !== userEmail) {
      throw new functions.https.HttpsError('permission-denied', 'Invitation is not for this user');
    }

    // Add user to the shared list
    const sharedUserData = {
      permission: invitation.permission,
      addedAt: admin.database.ServerValue.TIMESTAMP,
      addedBy: invitation.inviterEmail
    };

    const updates: { [key: string]: any } = {};
    updates[`taskLists/${invitation.listId}/sharedWith/${context.auth.uid}`] = sharedUserData;
    updates[`invitations/${invitationId}/status`] = 'accepted';

    await db.ref().update(updates);

    return {
      success: true,
      listId: invitation.listId
    };

  } catch (error) {
    console.error('Error accepting invitation:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to accept invitation');
  }
});