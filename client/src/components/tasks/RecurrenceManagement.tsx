import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Repeat, Calendar, AlertTriangle, Edit, StopCircle } from 'lucide-react';
import { TaskWithSubtasks, RecurrencePattern } from '../../types';
import { getRecurrenceDescription } from '../../utils/recurrenceValidation';

interface RecurrenceManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithSubtasks;
  onModifyRecurrence: (taskId: string) => void;
  onStopRecurrence: (taskId: string) => Promise<void>;
  loading?: boolean;
}

export const RecurrenceManagement: React.FC<RecurrenceManagementProps> = ({
  open,
  onOpenChange,
  task,
  onModifyRecurrence,
  onStopRecurrence,
  loading = false
}) => {
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStopRecurrence = async () => {
    setError(null);
    try {
      await onStopRecurrence(task.id);
      setShowStopConfirm(false);
      onOpenChange(false);
    } catch (error: any) {
      setError(error.message || 'Failed to stop recurrence');
    }
  };

  const handleModifyRecurrence = () => {
    onModifyRecurrence(task.id);
    onOpenChange(false);
  };

  if (!task.isRecurring || !task.recurrencePattern) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Manage Recurring Task
            </DialogTitle>
            <DialogDescription>
              Modify or stop the recurrence pattern for this task.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Due: {task.dueDate}</span>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Current Recurrence Pattern</h4>
                <Badge variant="outline" className="text-sm">
                  {getRecurrenceDescription(task.recurrencePattern)}
                </Badge>
              </div>

              {task.recurrencePattern.endDate && (
                <div className="text-sm text-gray-600">
                  <strong>Ends:</strong> {new Date(task.recurrencePattern.endDate).toLocaleDateString()}
                </div>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Modifying the recurrence pattern will only affect future instances of this task. 
                  Existing completed or pending tasks will remain unchanged.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleModifyRecurrence}
              disabled={loading}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modify Pattern
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowStopConfirm(true)}
              disabled={loading}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop Recurring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Confirmation Dialog */}
      <Dialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Recurring Task?</DialogTitle>
            <DialogDescription>
              This will stop generating future instances of this recurring task. 
              Existing tasks will remain unchanged.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. You'll need to create a new recurring task 
              if you want to resume the pattern later.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleStopRecurrence}
              disabled={loading}
            >
              {loading ? 'Stopping...' : 'Stop Recurring'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};