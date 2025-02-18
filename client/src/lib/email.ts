import emailjs from '@emailjs/browser';

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

// Initialize EmailJS with the public key
if (PUBLIC_KEY) {
  emailjs.init(PUBLIC_KEY);
}

export const emailService = {
  async sendShareNotification(
    toEmail: string,
    fromName: string,
    listName: string
  ): Promise<boolean> {
    if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
      console.error('EmailJS configuration is incomplete:', {
        hasPublicKey: !!PUBLIC_KEY,
        hasServiceId: !!SERVICE_ID,
        hasTemplateId: !!TEMPLATE_ID
      });
      return false;
    }

    try {
      const response = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: toEmail,
          from_name: fromName,
          list_name: listName,
          app_name: 'Listor',
        }
      );

      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  },
};