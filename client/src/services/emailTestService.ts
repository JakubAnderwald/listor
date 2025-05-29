// Temporary email testing service for development
export const testEmailService = async (invitationData: {
  inviteeEmail: string;
  inviterName: string;
  listTitle: string;
  permission: 'view' | 'edit';
  invitationUrl: string;
}) => {
  try {
    // In a real deployment, this would be handled by the cloud function
    // For testing, we'll make a direct API call to verify email functionality
    const response = await fetch('/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invitationData),
    });

    if (!response.ok) {
      throw new Error('Failed to send test email');
    }

    const result = await response.json();
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email test failed:', error);
    return { success: false, error: (error as Error).message };
  }
};