import React from 'react';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { TaskWithSubtasks } from '../../types';
import { cn } from '../../lib/utils';

interface TaskProgressProps {
  task: TaskWithSubtasks;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({
  task,
  showLabel = true,
  size = 'md',
  className
}) => {
  const { subtaskStats } = task;
  const hasSubtasks = subtaskStats.total > 0;
  const progressPercentage = hasSubtasks 
    ? Math.round((subtaskStats.completed / subtaskStats.total) * 100)
    : task.status === 'completed' ? 100 : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const getProgressHeight = () => {
    switch (size) {
      case 'sm': return 'h-1';
      case 'md': return 'h-2';
      case 'lg': return 'h-3';
      default: return 'h-2';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  if (!hasSubtasks) {
    // For tasks without subtasks, show simple completion status
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {task.status === 'completed' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-gray-400" />
        )}
        {showLabel && (
          <span className={cn("text-gray-600 dark:text-gray-400", getTextSize())}>
            {task.status === 'completed' ? 'Completed' : 'Not Started'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-gray-500" />
            <span className={cn("text-gray-600 dark:text-gray-400", getTextSize())}>
              Progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", getTextSize())}>
              {subtaskStats.completed}/{subtaskStats.total}
            </span>
            <Badge 
              variant={progressPercentage === 100 ? "default" : "secondary"} 
              className="text-xs"
            >
              {progressPercentage}%
            </Badge>
          </div>
        </div>
      )}
      
      <Progress 
        value={progressPercentage} 
        className={cn(getProgressHeight(), "w-full")}
      />
      
      {showLabel && subtaskStats.pending > 0 && (
        <div className={cn("text-gray-500 dark:text-gray-400", getTextSize())}>
          {subtaskStats.pending} remaining
        </div>
      )}
    </div>
  );
};

interface TaskProgressSummaryProps {
  tasks: TaskWithSubtasks[];
  className?: string;
}

export const TaskProgressSummary: React.FC<TaskProgressSummaryProps> = ({
  tasks,
  className
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const tasksWithSubtasks = tasks.filter(task => task.subtaskStats.total > 0);
  
  const totalSubtasks = tasksWithSubtasks.reduce((sum, task) => sum + task.subtaskStats.total, 0);
  const completedSubtasks = tasksWithSubtasks.reduce((sum, task) => sum + task.subtaskStats.completed, 0);
  
  const overallTaskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overallSubtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className={cn("space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg", className)}>
      <h3 className="font-medium text-sm">Overall Progress</h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Tasks</span>
            <span className="text-sm font-medium">{completedTasks}/{totalTasks}</span>
          </div>
          <Progress value={overallTaskProgress} className="h-2" />
          <div className="text-xs text-gray-500 mt-1">{overallTaskProgress}% complete</div>
        </div>
        
        {totalSubtasks > 0 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">Subtasks</span>
              <span className="text-sm font-medium">{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <Progress value={overallSubtaskProgress} className="h-2" />
            <div className="text-xs text-gray-500 mt-1">{overallSubtaskProgress}% complete</div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{completedTasks}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{totalTasks - completedTasks}</div>
          <div className="text-xs text-gray-500">Remaining</div>
        </div>
      </div>
    </div>
  );
};