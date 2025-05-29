import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { subscribeToTasks, getTasksForList } from '../services/taskService';
import { TaskWithSubtasks } from '../types';

export const useTasks = (listId: string | null) => {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<TaskWithSubtasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !listId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Initial fetch
    getTasksForList(listId)
      .then(tasks => {
        setTasks(tasks);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    // Set up real-time subscription
    const unsubscribe = subscribeToTasks(listId, (tasks) => {
      setTasks(tasks);
      setLoading(false);
    });

    return unsubscribe;
  }, [isAuthenticated, listId]);

  return {
    tasks,
    loading,
    error,
    refetch: () => {
      if (isAuthenticated && listId) {
        getTasksForList(listId).then(setTasks).catch(err => setError(err.message));
      }
    }
  };
};