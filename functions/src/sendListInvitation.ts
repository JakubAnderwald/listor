import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendInvitationEmail } from './emailService';

interface InvitationData {
  listId: string;
  inviteeEmail: string;
  permission: 'view' | 'edit';
}

export const sendListInvitation = functions.https.onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { listId, inviteeEmail, permission } = request.data as InvitationData;

  // Validate input
  if (!listId || !inviteeEmail || !permission) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const db = admin.database();
  const inviterEmail = request.auth.token.email;

  try {
    // Verify the user owns the task list
    const listSnapshot = await db.ref(`taskLists/${listId}`).once('value');
    const taskList = listSnapshot.val();

    if (!taskList || taskList.ownerId !== request.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only list owner can send invitations');
    }

    // Generate invitation token and ID
    const invitationId = db.ref('invitations').push().key;
    const token = invitationId; // Use the Firebase push key as the token

    const invitation = {
      listId,
      inviterEmail,
      inviteeEmail,
      token: token,
      status: 'pending',
      permission,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      emailSent: false,
      emailError: null
    };

    // Save invitation to database
    await db.ref(`invitations/${invitationId}`).set(invitation);

    // Get inviter's display name
    const inviterUser = await admin.auth().getUser(request.auth.uid);
    const inviterName = inviterUser.displayName || inviterEmail || 'Someone';

    // Send email invitation
    const invitationUrl = `https://listor.eu/invitation/${token}`;
    
    const emailResult = await sendInvitationEmail({
      inviteeEmail,
      inviterName,
      listTitle: taskList.title,
      permission,
      invitationUrl
    });

    // Update invitation with email status
    const emailUpdate: any = {
      emailSent: emailResult.success,
      emailSentAt: emailResult.success ? admin.database.ServerValue.TIMESTAMP : null,
      emailError: emailResult.error || null
    };

    await db.ref(`invitations/${invitationId}`).update(emailUpdate);
    
    return {
      success: true,
      invitationId,
      shareLink: invitationUrl,
      emailSent: emailResult.success,
      emailError: emailResult.error
    };

  } catch (error) {
    console.error('Error sending invitation:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send invitation');
  }
});