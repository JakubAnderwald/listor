import emailjs from '@emailjs/browser';

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = 'template_nfac5px'; // Hardcoding the template ID as specified

// Initialize EmailJS with the public key
emailjs.init(PUBLIC_KEY);

export const emailService = {
  async sendShareNotification(
    toEmail: string,
    fromName: string,
    listName: string
  ): Promise<boolean> {
    if (!PUBLIC_KEY || !SERVICE_ID) {
      console.error('EmailJS configuration is incomplete:', {
        hasPublicKey: !!PUBLIC_KEY,
        hasServiceId: !!SERVICE_ID
      });
      return false;
    }

    try {
      console.log('Attempting to send email with params:', {
        toEmail,
        fromName,
        listName,
        serviceId: SERVICE_ID,
        templateId: TEMPLATE_ID
      });

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