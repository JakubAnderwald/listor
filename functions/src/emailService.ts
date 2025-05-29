import * as functions from 'firebase-functions';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.BREVO_API_KEY || '');

interface InvitationEmailData {
  inviteeEmail: string;
  inviterName: string;
  listTitle: string;
  permission: 'view' | 'edit';
  invitationUrl: string;
}

export const sendInvitationEmail = async (data: InvitationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const { inviteeEmail, inviterName, listTitle, permission, invitationUrl } = data;
    
    const htmlContent = createHtmlTemplate(inviterName, listTitle, permission, invitationUrl);
    const textContent = createTextTemplate(inviterName, listTitle, permission, invitationUrl);
    
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.to = [{ email: inviteeEmail }];
    sendSmtpEmail.sender = { name: 'Listor', email: 'noreply@listor.eu' };
    sendSmtpEmail.subject = `${inviterName} invited you to collaborate on "${listTitle}"`;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    return {
      success: true,
      messageId: result.body.messageId
    };
  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

const createHtmlTemplate = (inviterName: string, listTitle: string, permission: string, invitationUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task List Invitation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .content { margin-bottom: 30px; }
        .invitation-details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .permission-badge { display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Listor</div>
          <h1>You've been invited to collaborate!</h1>
        </div>
        
        <div class="content">
          <p>Hi there!</p>
          <p><strong>${inviterName}</strong> has invited you to collaborate on their task list.</p>
          
          <div class="invitation-details">
            <h3>📋 ${listTitle}</h3>
            <p>Permission level: <span class="permission-badge">${permission.toUpperCase()}</span></p>
            <p>
              ${permission === 'view' 
                ? 'You can view tasks and track progress.' 
                : 'You can view, add, edit, and complete tasks.'
              }
            </p>
          </div>
          
          <p>Click the button below to accept the invitation and start collaborating:</p>
          
          <div style="text-align: center;">
            <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
          </div>
          
          <p><small>If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${invitationUrl}">${invitationUrl}</a></small></p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${inviterName} via Listor.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const createTextTemplate = (inviterName: string, listTitle: string, permission: string, invitationUrl: string): string => {
  return `
You've been invited to collaborate on Listor!

${inviterName} has invited you to collaborate on their task list: "${listTitle}"

Permission level: ${permission.toUpperCase()}
${permission === 'view' 
  ? 'You can view tasks and track progress.' 
  : 'You can view, add, edit, and complete tasks.'
}

To accept the invitation, click this link:
${invitationUrl}

If you didn't expect this invitation, you can safely ignore this email.

---
This invitation was sent via Listor
  `;
};