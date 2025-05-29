import React, { useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { TaskListForm } from '../components/tasks/TaskListForm';
import { LoadingState } from '../components/ui/LoadingSpinner';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useTaskLists } from '../hooks/useTaskLists';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { logout } from '../services/authService';
import { useLocation } from 'wouter';
import { Plus, List, Users, Activity, LogOut, Settings } from 'lucide-react';
import type { CreateTaskListData, UpdateTaskListData } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { taskLists, loading } = useTaskLists();
  const { createTaskList } = useTaskOperations();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateTaskList = async (data: CreateTaskListData | UpdateTaskListData) => {
    if ('title' in data && data.title) {
      await createTaskList(data as CreateTaskListData);
      setShowCreateForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.displayName || user?.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Task Lists Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <List className="h-6 w-6" />
                My Task Lists
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Create and manage your task lists</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New List
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : taskLists.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 dark:text-gray-500">
                <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No task lists yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first task list to start organizing your tasks
                </p>
                <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Create Your First List
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskLists.map((list) => (
                <Card 
                  key={list.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/list/${list.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{list.title}</span>
                      {list.isShared && <Users className="h-4 w-4 text-blue-500" />}
                    </CardTitle>
                    {list.description && (
                      <CardDescription className="line-clamp-2">
                        {list.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Tasks</span>
                        <span className="font-medium">{list.totalTasks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Completed</span>
                        <span className="font-medium text-green-600">{list.completedTasks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Pending</span>
                        <span className="font-medium text-orange-600">{list.pendingTasks}</span>
                      </div>
                      {list.overdueTasks > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Overdue</span>
                          <span className="font-medium text-red-600">{list.overdueTasks}</span>
                        </div>
                      )}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${list.totalTasks > 0 ? (list.completedTasks / list.totalTasks) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {list.totalTasks > 0 ? Math.round((list.completedTasks / list.totalTasks) * 100) : 0}% complete
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Stats
              </CardTitle>
              <CardDescription>Your task overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Lists</span>
                  <span className="font-medium">{taskLists.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</span>
                  <span className="font-medium">{taskLists.reduce((sum, list) => sum + list.totalTasks, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="font-medium text-green-600">{taskLists.reduce((sum, list) => sum + list.completedTasks, 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Shared Lists
              </CardTitle>
              <CardDescription>Lists shared with others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {taskLists.filter(list => list.isShared).length} shared lists
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sharing features available
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Getting started with Listor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• Create lists to organize tasks</p>
                <p>• Add subtasks for detailed planning</p>
                <p>• Share lists with family or friends</p>
                <p>• Set due dates and priorities</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List Form Modal */}
        <TaskListForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSubmit={handleCreateTaskList}
        />
      </div>
    </div>
  );
}