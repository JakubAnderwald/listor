import emailjs from '@emailjs/browser';

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = 'template_nfac5px';
const APP_URL = import.meta.env.PROD ? 'https://listor.eu' : 'http://localhost:5000';

// Initialize EmailJS with the public key
if (!PUBLIC_KEY) {
  console.error('EmailJS PUBLIC_KEY is not configured. Please check your environment variables.');
  console.log('Current environment:', {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    base: import.meta.env.BASE_URL,
    appUrl: APP_URL
  });
} else {
  try {
    emailjs.init(PUBLIC_KEY);
    console.log('EmailJS initialized successfully with configuration:', {
      hasPublicKey: !!PUBLIC_KEY,
      hasServiceId: !!SERVICE_ID,
      templateId: TEMPLATE_ID,
      mode: import.meta.env.MODE,
      appUrl: APP_URL
    });
  } catch (error) {
    console.error('Failed to initialize EmailJS:', error);
  }
}

export const emailService = {
  async sendShareNotification(
    toEmail: string,
    fromName: string,
    listName: string
  ): Promise<boolean> {
    if (!PUBLIC_KEY || !SERVICE_ID) {
      console.error('EmailJS configuration is missing:', {
        hasPublicKey: !!PUBLIC_KEY,
        hasServiceId: !!SERVICE_ID,
        templateId: TEMPLATE_ID,
        mode: import.meta.env.MODE,
        base: import.meta.env.BASE_URL,
        appUrl: APP_URL
      });
      return false;
    }

    try {
      console.log('Attempting to send email with params:', {
        toEmail,
        fromName,
        listName,
        serviceId: SERVICE_ID,
        templateId: TEMPLATE_ID,
        hasPublicKey: !!PUBLIC_KEY,
        mode: import.meta.env.MODE,
        appUrl: APP_URL
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
      console.error('Error sending email notification:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        mode: import.meta.env.MODE,
        config: {
          hasPublicKey: !!PUBLIC_KEY,
          hasServiceId: !!SERVICE_ID,
          templateId: TEMPLATE_ID,
          appUrl: APP_URL
        }
      });
      return false;
    }
  },
};