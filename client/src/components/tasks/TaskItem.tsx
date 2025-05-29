import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreVertical, Calendar, User, Clock, Flag, Repeat } from 'lucide-react';
import { TaskWithSubtasks } from '../../types';
import { cn } from '../../lib/utils';

interface TaskItemProps {
  task: TaskWithSubtasks;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onAssign?: (taskId: string) => void;
  showAssignee?: boolean;
  className?: string;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onAssign,
  showAssignee = true,
  className
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleComplete = async () => {
    setIsToggling(true);
    try {
      await onToggleComplete(task.id, task.status !== 'completed');
    } finally {
      setIsToggling(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();
  const subtaskProgress = task.subtaskStats.total > 0 ? (task.subtaskStats.completed / task.subtaskStats.total) * 100 : 0;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      task.status === 'completed' && "opacity-75",
      isOverdue && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === 'completed'}
            onCheckedChange={handleToggleComplete}
            disabled={isToggling}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-sm leading-tight",
                  task.status === 'completed' && "line-through text-gray-500"
                )}>
                  {task.title}
                </h3>
                
                {task.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task.id)}>
                    Edit Task
                  </DropdownMenuItem>
                  {onAssign && (
                    <DropdownMenuItem onClick={() => onAssign(task.id)}>
                      Assign Task
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-red-600" 
                    onClick={() => onDelete(task.id)}
                  >
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Subtask Progress */}
            {task.subtaskStats.total > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    Subtasks: {task.subtaskStats.completed}/{task.subtaskStats.total}
                  </span>
                  <span className="text-gray-500">
                    {Math.round(subtaskProgress)}%
                  </span>
                </div>
                <Progress value={subtaskProgress} className="h-1" />
              </div>
            )}

            {/* Task Metadata */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                <Flag className="h-2 w-2 mr-1" />
                {task.priority}
              </Badge>

              {task.dueDate && (
                <Badge 
                  variant={isOverdue ? "destructive" : isDueToday ? "default" : "outline"} 
                  className="text-xs"
                >
                  <Calendar className="h-2 w-2 mr-1" />
                  {isOverdue ? "Overdue" : isDueToday ? "Due Today" : new Date(task.dueDate).toLocaleDateString()}
                </Badge>
              )}

              {task.assignedTo && showAssignee && (
                <Badge variant="outline" className="text-xs">
                  <User className="h-2 w-2 mr-1" />
                  Assigned
                </Badge>
              )}

              {task.isRecurring && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Repeat className="h-2 w-2 mr-1" />
                  {task.recurrencePattern ? 
                    `${task.recurrencePattern.type}` : 
                    'Recurring'
                  }
                </Badge>
              )}
            </div>

            {/* Timestamps */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>
                Created {new Date(task.createdAt).toLocaleDateString()}
              </span>
              {task.completedAt && (
                <span>
                  Completed {new Date(task.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};