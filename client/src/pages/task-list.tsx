import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft, Plus, Settings, MoreVertical, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskItem } from '../components/tasks/TaskItem';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { ShareListDialog } from '../components/tasks/ShareListDialog';
import { useTaskLists } from '../hooks/useTaskLists';
import { useTasks } from '../hooks/useTasks';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { getFilteredAndSortedTasks, getDefaultFilter, getDefaultSort } from '../utils/taskUtils';
import { sendListInvitation, removeUserAccess, getListPermission } from '../services/taskService';
import { useAuth } from '../components/auth/AuthProvider';
import type { CreateTaskData, UpdateTaskData, TaskFilter, TaskSort } from '../types';

export default function TaskListPage() {
  const { listId } = useParams();
  const [, setLocation] = useLocation();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>(getDefaultFilter());
  const [sort, setSort] = useState<TaskSort>(getDefaultSort());
  const [showShareDialog, setShowShareDialog] = useState(false);

  const { user } = useAuth();

  const { taskLists } = useTaskLists();
  const { tasks, loading: tasksLoading } = useTasks(listId || null);
  const { 
    createTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion 
  } = useTaskOperations();

  // Find the current list
  const currentList = taskLists.find(list => list.id === listId);

  if (!listId || !currentList) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Task List Not Found
          </h1>
          <Button onClick={() => setLocation('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const filteredAndSortedTasks = getFilteredAndSortedTasks(tasks, filter, sort);

  const handleCreateTask = async (data: CreateTaskData) => {
    await createTask(data);
    setShowTaskForm(false);
  };

  const handleUpdateTask = async (data: UpdateTaskData) => {
    if (editingTask) {
      await updateTask(editingTask, data);
      setEditingTask(null);
    }
  };

  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    await toggleTaskCompletion(taskId, completed);
  };

  const handleSendInvitation = async (email: string, permission: 'view' | 'edit') => {
    if (!listId) return;
    await sendListInvitation(listId, email, permission);
  };

  const handleRemoveAccess = async (userId: string) => {
    if (!listId) return;
    await removeUserAccess(listId, userId);
  };

  const currentTask = editingTask ? tasks.find(t => t.id === editingTask) : undefined;
  const userPermission = currentList && user ? getListPermission(currentList, user.uid) : 'none';
  const canEdit = userPermission === 'owner' || userPermission === 'edit';
  const canShare = userPermission === 'owner';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentList.title}
              </h1>
              {currentList.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {currentList.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button 
                onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            )}
            {canShare && (
              <Button 
                variant="outline" 
                onClick={() => setShowShareDialog(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentList.totalTasks}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {currentList.completedTasks}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {currentList.pendingTasks}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {currentList.overdueTasks}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <TaskFilters
          filter={filter}
          sort={sort}
          onFilterChange={setFilter}
          onSortChange={setSort}
          onClearFilters={() => {
            setFilter(getDefaultFilter());
            setSort(getDefaultSort());
          }}
          taskCount={filteredAndSortedTasks.length}
          className="mb-6"
        />

        {/* Tasks */}
        <div className="space-y-4">
          {tasksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 dark:text-gray-500">
                <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No tasks yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add your first task to get started with this list
                </p>
                <Button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Add Your First Task
                </Button>
              </div>
            </Card>
          ) : (
            filteredAndSortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={(taskId, completed) => handleToggleTask(taskId, completed)}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>

        {/* Task Form Modal */}
        <TaskForm
          open={showTaskForm || !!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              setShowTaskForm(false);
              setEditingTask(null);
            }
          }}
          listId={listId}
          task={currentTask}
          onSubmit={editingTask 
            ? (data) => handleUpdateTask(data as UpdateTaskData)
            : (data) => handleCreateTask(data as CreateTaskData)
          }
        />

        {/* Share Dialog */}
        {currentList && (
          <ShareListDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            taskList={currentList}
            onSendInvitation={handleSendInvitation}
            onRemoveAccess={handleRemoveAccess}
          />
        )}
      </div>
    </div>
  );
}