import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Calendar, Repeat, Clock, CheckCircle, Circle, Info } from 'lucide-react';
import { TaskWithSubtasks } from '../../types';
import { getRecurrenceDescription } from '../../utils/recurrenceValidation';

interface RecurringTaskHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringTask: TaskWithSubtasks;
  allTasks: TaskWithSubtasks[];
  onManageRecurrence: (taskId: string) => void;
}

export const RecurringTaskHistory: React.FC<RecurringTaskHistoryProps> = ({
  open,
  onOpenChange,
  recurringTask,
  allTasks,
  onManageRecurrence
}) => {
  const [relatedTasks, setRelatedTasks] = useState<TaskWithSubtasks[]>([]);

  useEffect(() => {
    if (recurringTask && allTasks) {
      // Find all tasks with the same title and recurrence pattern (including generated ones)
      const related = allTasks.filter(task => 
        task.title === recurringTask.title &&
        task.isRecurring &&
        (task.id === recurringTask.id || task.generatedFrom === recurringTask.id)
      ).sort((a, b) => {
        // Sort by due date, with tasks without due dates at the end
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      
      setRelatedTasks(related);
    }
  }, [recurringTask, allTasks]);

  const completedTasks = relatedTasks.filter(t => t.status === 'completed');
  const pendingTasks = relatedTasks.filter(t => t.status === 'pending');
  const overdueTasks = pendingTasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date()
  );

  const getTaskStatusIcon = (task: TaskWithSubtasks) => {
    if (task.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      return <Clock className="h-4 w-4 text-red-600" />;
    }
    
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const getTaskStatusBadge = (task: TaskWithSubtasks) => {
    if (task.status === 'completed') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    }
    
    if (task.dueDate && new Date(task.dueDate) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    return <Badge variant="outline">Pending</Badge>;
  };

  if (!recurringTask.isRecurring || !recurringTask.recurrencePattern) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Task History
          </DialogTitle>
          <DialogDescription>
            View the complete history and manage this recurring task pattern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{recurringTask.title}</CardTitle>
              {recurringTask.description && (
                <p className="text-sm text-gray-600">{recurringTask.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {getRecurrenceDescription(recurringTask.recurrencePattern)}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{pendingTasks.length}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
                  <div className="text-xs text-gray-500">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Instances</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {relatedTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Info className="h-8 w-8 mx-auto mb-2" />
                      <p>No task instances found</p>
                    </div>
                  ) : (
                    relatedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTaskStatusIcon(task)}
                          <div>
                            <div className="font-medium text-sm">
                              {task.dueDate ? (
                                <>
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                  {task.dueDate === new Date().toISOString().split('T')[0] && (
                                    <span className="ml-2 text-orange-600 font-semibold">Today</span>
                                  )}
                                </>
                              ) : (
                                'No due date'
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Created: {new Date(task.createdAt).toLocaleDateString()}
                              {task.completedAt && (
                                <> • Completed: {new Date(task.completedAt).toLocaleDateString()}</>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTaskStatusBadge(task)}
                          {task.id === recurringTask.id && (
                            <Badge variant="outline" className="text-xs">Original</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recurrence Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <div>New instances are automatically created based on the recurrence pattern.</div>
                <div>Completing a task instance doesn't affect future occurrences.</div>
                {recurringTask.recurrencePattern.endDate && (
                  <div>This recurrence will end on {new Date(recurringTask.recurrencePattern.endDate).toLocaleDateString()}.</div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onManageRecurrence(recurringTask.id)}>
              Manage Recurrence
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};