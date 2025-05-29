import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { acceptListInvitation } from '../../services/taskService';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../hooks/use-toast';

interface InvitationHandlerProps {
  token: string;
}

type InvitationStatus = 'loading' | 'success' | 'error' | 'expired' | 'unauthorized';

interface InvitationDetails {
  listTitle: string;
  inviterName: string;
  permission: 'view' | 'edit';
}

export const InvitationHandler: React.FC<InvitationHandlerProps> = ({ token }) => {
  const [status, setStatus] = useState<InvitationStatus>('loading');
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('unauthorized');
      return;
    }

    // Validate token and get invitation details
    validateInvitation();
  }, [token, isAuthenticated]);

  const validateInvitation = async () => {
    try {
      // In a real implementation, you'd call an API to validate the token
      // and get invitation details before showing the accept button
      // For now, we'll simulate this
      setStatus('success');
      setDetails({
        listTitle: 'Shared Task List',
        inviterName: 'User',
        permission: 'edit'
      });
    } catch (error) {
      console.error('Error validating invitation:', error);
      setStatus('error');
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setIsAccepting(true);
    try {
      await acceptListInvitation(token);
      toast({
        title: 'Invitation accepted',
        description: 'You now have access to the shared task list.',
      });
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineInvitation = () => {
    toast({
      title: 'Invitation declined',
      description: 'You have declined the invitation.',
    });
    setLocation('/dashboard');
  };

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <CardTitle>Loading Invitation</CardTitle>
            <CardDescription>
              Please wait while we process your invitation...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error' || status === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>
              {status === 'expired' ? 'Invitation Expired' : 'Invalid Invitation'}
            </CardTitle>
            <CardDescription>
              {status === 'expired' 
                ? 'This invitation has expired. Please ask for a new invitation.'
                : 'This invitation link is invalid or has already been used.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Task List Invitation</CardTitle>
          <CardDescription>
            You've been invited to collaborate on a task list
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {details && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Task List:
                </span>
                <p className="font-semibold">{details.listTitle}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Invited by:
                </span>
                <p className="font-semibold">{details.inviterName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Permission:
                </span>
                <p className="font-semibold capitalize">{details.permission} access</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAcceptInvitation}
              disabled={isAccepting}
              className="flex-1 flex items-center gap-2"
            >
              {isAccepting ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Accept Invitation
            </Button>
            <Button
              onClick={handleDeclineInvitation}
              variant="outline"
              disabled={isAccepting}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};