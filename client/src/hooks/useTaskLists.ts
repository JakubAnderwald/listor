import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { subscribeToTaskLists, getUserTaskLists } from '../services/taskService';
import { TaskListWithStats } from '../types';

export const useTaskLists = () => {
  const { user, isAuthenticated } = useAuth();
  const [taskLists, setTaskLists] = useState<TaskListWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTaskLists([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Initial fetch
    getUserTaskLists()
      .then(lists => {
        setTaskLists(lists);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching task lists:', err);
        setError(err.message || 'Failed to fetch task lists');
        setLoading(false);
      });

    // Set up real-time subscription
    const unsubscribe = subscribeToTaskLists((lists) => {
      setTaskLists(lists);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      setTaskLists([]);
      setLoading(false);
      setError(null);
    };
  }, [isAuthenticated, user]);

  return {
    taskLists,
    loading,
    error,
    refetch: () => {
      if (isAuthenticated) {
        getUserTaskLists().then(setTaskLists).catch(err => setError(err.message));
      }
    }
  };
};