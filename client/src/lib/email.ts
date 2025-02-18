import emailjs from '@emailjs/browser';

if (!import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
  console.error('EmailJS public key is not set');
}

if (!import.meta.env.VITE_EMAILJS_SERVICE_ID) {
  console.error('EmailJS service ID is not set');
}

if (!import.meta.env.VITE_EMAILJS_TEMPLATE_ID) {
  console.error('EmailJS template ID is not set');
}

export const emailService = {
  async sendShareNotification(
    toEmail: string,
    fromName: string,
    listName: string
  ): Promise<boolean> {
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: toEmail,
          from_name: fromName,
          list_name: listName,
          app_name: 'Listor',
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  },
};
