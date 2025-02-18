import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();

if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

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

      const msg = {
        to: email,
        from: 'noreply@listor.app', // Replace with your verified sender
        subject: `${owner.displayName} shared a list with you on Listor`,
        text: `${owner.displayName} has shared their list "${list.name}" with you on Listor. Log in to your account to view it.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6366f1;">Listor</h1>
            <p>${owner.displayName} has shared their list "${list.name}" with you.</p>
            <p>Log in to your Listor account to view the shared list.</p>
            <p>Best regards,<br>The Listor Team</p>
          </div>
        `,
      };

      await sgMail.send(msg);
      return null;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return null;
    }
  });
