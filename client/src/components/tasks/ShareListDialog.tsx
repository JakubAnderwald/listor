import React, { useState, useEffect } from 'react';
import { Mail, Users, Copy, Check, X, RefreshCw, Clock, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../auth/AuthProvider';
import { getListPermission, getListInvitations, resendInvitation, deleteInvitation } from '../../services/taskService';
import type { TaskList, SharedUser, Invitation } from '../../types';

interface ShareListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskList: TaskList;
  onSendInvitation: (email: string, permission: 'view' | 'edit') => Promise<void>;
  onRemoveAccess: (userId: string) => Promise<void>;
  loading?: boolean;
}

export const ShareListDialog: React.FC<ShareListDialogProps> = ({
  open,
  onOpenChange,
  taskList,
  onSendInvitation,
  onRemoveAccess,
  loading = false
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check user permission for this list
  const userPermission = user ? getListPermission(taskList, user.uid) : 'none';
  const canManageSharing = userPermission === 'owner';

  // Load invitations when dialog opens
  useEffect(() => {
    if (open && canManageSharing) {
      loadInvitations();
    }
  }, [open, canManageSharing, taskList.id]);

  const loadInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const invitationsList = await getListInvitations(taskList.id);
      setInvitations(invitationsList);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation(invitationId);
      toast({
        title: "Invitation Resent",
        description: "The invitation has been resent with a new expiration date."
      });
      await loadInvitations(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: error.message || "Could not resend invitation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await deleteInvitation(invitationId);
      toast({
        title: "Invitation Deleted",
        description: "The invitation has been deleted successfully."
      });
      await loadInvitations(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Failed to Delete",
        description: error.message || "Could not delete invitation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTestEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setInviting(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteeEmail: email,
          inviterName: user?.displayName || 'Test User',
          listTitle: taskList.title,
          permission: permission,
          invitationUrl: `https://listor.eu/invitation/test-token`
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test Email Sent",
          description: `Test invitation email sent to ${email} successfully`,
        });
        setEmail('');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Email Test Failed",
        description: error.message || "Could not send test email",
        variant: "destructive"
      });
    } finally {
      setInviting(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setInviting(true);
    try {
      await onSendInvitation(email, permission);
      setEmail('');
      setPermission('view');
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${email} with ${permission} access`
      });
      // Refresh invitations list
      if (canManageSharing) {
        await loadInvitations();
      }
    } catch (error) {
      toast({
        title: "Failed to Send Invitation",
        description: "There was an error sending the invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setInviting(false);
    }
  };

  const handleCopyShareLink = async () => {
    const shareLink = `${window.location.origin}/invitation/${taskList.id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleRemoveAccess = async (userId: string) => {
    try {
      await onRemoveAccess(userId);
      toast({
        title: "Access Removed",
        description: "User access has been removed from this list"
      });
    } catch (error) {
      toast({
        title: "Failed to Remove Access",
        description: "There was an error removing access. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sharedUsers = taskList.sharedWith ? Object.entries(taskList.sharedWith) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{taskList.title}"
          </DialogTitle>
          <DialogDescription>
            Share this task list with others to collaborate on tasks together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite by Email - Only show to owners */}
          {canManageSharing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Invite by Email</Label>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendInvitation()}
                    />
                  </div>
                  <Select value={permission} onValueChange={(value: 'view' | 'edit') => setPermission(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleSendInvitation}
                    disabled={!email || inviting}
                    size="sm"
                  >
                    {inviting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>

                </div>
                <p className="text-xs text-gray-500 mt-1">
                  View: Can see tasks • Edit: Can add, edit, and complete tasks
                </p>
              </div>
            </div>
          )}

          {/* Pending Invitations */}
          {canManageSharing && invitations.length > 0 && (
            <div className="space-y-3">
              <Label>Pending Invitations</Label>
              <div className="space-y-2">
                {loadingInvitations ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : (
                  invitations.map((invitation) => {
                    const isExpired = Date.now() > invitation.expiresAt;
                    const statusColor = 
                      invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      invitation.status === 'declined' ? 'bg-red-100 text-red-800' :
                      isExpired ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800';
                    
                    return (
                      <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{invitation.inviteeEmail}</span>
                            <Badge variant="outline" className={statusColor}>
                              {isExpired ? 'Expired' : invitation.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{invitation.permission} access</span>
                            <span>Sent {new Date(invitation.createdAt).toLocaleDateString()}</span>
                            {invitation.resentAt && (
                              <span>Resent {new Date(invitation.resentAt).toLocaleDateString()}</span>
                            )}
                            {invitation.emailSent && (
                              <span className="text-green-600">✓ Email delivered</span>
                            )}
                            {invitation.emailSent === false && invitation.emailError && (
                              <span className="text-red-600">⚠ Email failed</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {invitation.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvitation(invitation.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteInvitation(invitation.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {invitation.status === 'pending' && (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Share Link */}
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/invitation/${taskList.id}`}
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyShareLink}
                className="shrink-0"
              >
                {copiedLink ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Anyone with this link can request access to the list
            </p>
          </div>

          {/* Current Collaborators */}
          {sharedUsers.length > 0 && (
            <div className="space-y-3">
              <Label>Current Collaborators</Label>
              <div className="space-y-2">
                {sharedUsers.map(([userId, user]: [string, SharedUser]) => (
                  <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {userId.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{userId}</p>
                        <p className="text-xs text-gray-500">
                          Added {new Date(user.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.permission === 'edit' ? 'default' : 'secondary'}>
                        {user.permission}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAccess(userId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List Settings */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">List Visibility</p>
                <p className="text-xs text-gray-500">
                  {taskList.isShared ? 'Shared with others' : 'Private to you'}
                </p>
              </div>
              <Badge variant={taskList.isShared ? 'default' : 'secondary'}>
                {taskList.isShared ? 'Shared' : 'Private'}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};