import React from 'react';
import { useParams } from 'wouter';
import { InvitationHandler } from '../components/sharing/InvitationHandler';

export default function InvitationPage() {
  const { token } = useParams();

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Invitation Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The invitation link is missing or malformed.
          </p>
        </div>
      </div>
    );
  }

  return <InvitationHandler token={token} />;
}