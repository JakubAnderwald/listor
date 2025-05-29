import React, { useState } from 'react';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { TaskList } from '../../types';

interface DeleteTaskListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskList?: TaskList;
  onConfirm: (listId: string) => Promise<void>;
  loading?: boolean;
}

export const DeleteTaskListDialog: React.FC<DeleteTaskListDialogProps> = ({
  open,
  onOpenChange,
  taskList,
  onConfirm,
  loading = false
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!taskList) return;
    
    setError(null);
    
    try {
      await onConfirm(taskList.id);
      onOpenChange(false);
    } catch (error: any) {
      setError(error.message || 'Failed to delete task list. Please try again.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setError(null);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Task List
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>"{taskList?.title}"</strong>?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              This action cannot be undone. All tasks and subtasks in this list will be permanently deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete List
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};