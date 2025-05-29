import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Plus, Share2, MoreVertical, Calendar, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { TaskListWithStats } from '../../types';
import { useLocation } from 'wouter';

interface TaskListViewProps {
  taskLists: TaskListWithStats[];
  onCreateList?: () => void;
  onEditList?: (listId: string) => void;
  onDeleteList?: (listId: string) => void;
  onShareList?: (listId: string) => void;
  loading?: boolean;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  taskLists,
  onCreateList,
  onEditList,
  onDeleteList,
  onShareList,
  loading = false
}) => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleOpenList = (listId: string) => {
    setLocation(`/list/${listId}`);
  };

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getPriorityColor = (overdueTasks: number) => {
    if (overdueTasks > 0) return 'destructive';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (taskLists.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No task lists yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first task list to start organizing your tasks
          </p>
          <Button onClick={onCreateList}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Task Lists</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal and shared task lists
          </p>
        </div>
        <Button onClick={onCreateList}>
          <Plus className="h-4 w-4 mr-2" />
          New List
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {taskLists.map((taskList) => {
          const progressPercentage = getProgressPercentage(taskList.completedTasks, taskList.totalTasks);
          const isOwner = taskList.ownerId === user?.uid;

          return (
            <Card key={taskList.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1" onClick={() => handleOpenList(taskList.id)}>
                    <CardTitle className="text-lg mb-1">{taskList.title}</CardTitle>
                    {taskList.description && (
                      <CardDescription className="text-sm line-clamp-2">
                        {taskList.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenList(taskList.id)}>
                        Open List
                      </DropdownMenuItem>
                      {isOwner && (
                        <>
                          <DropdownMenuItem onClick={() => onEditList?.(taskList.id)}>
                            Edit List
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onShareList?.(taskList.id)}>
                            Share List
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => onDeleteList?.(taskList.id)}
                          >
                            Delete List
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {taskList.isShared && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                  {taskList.overdueTasks > 0 && (
                    <Badge variant={getPriorityColor(taskList.overdueTasks)} className="text-xs">
                      {taskList.overdueTasks} Overdue
                    </Badge>
                  )}
                  {!isOwner && (
                    <Badge variant="outline" className="text-xs">
                      Collaborator
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0" onClick={() => handleOpenList(taskList.id)}>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium">
                      {taskList.completedTasks}/{taskList.totalTasks} tasks
                    </span>
                  </div>
                  
                  <Progress value={progressPercentage} className="h-2" />
                  
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{progressPercentage}% complete</span>
                    {taskList.pendingTasks > 0 && (
                      <span>{taskList.pendingTasks} remaining</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Updated {new Date(taskList.updatedAt).toLocaleDateString()}
                    </span>
                    {taskList.isShared && onShareList && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareList(taskList.id);
                        }}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};