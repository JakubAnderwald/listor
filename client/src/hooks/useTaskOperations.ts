import { useState } from 'react';
import { 
  createTaskList,
  updateTaskList,
  deleteTaskList,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask
} from '../services/taskService';
import { 
  CreateTaskListData,
  UpdateTaskListData,
  CreateTaskData,
  UpdateTaskData,
  CreateSubtaskData,
  UpdateSubtaskData
} from '../types';
import { useToast } from './use-toast';

export const useTaskOperations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOperation = async <T>(
    operation: () => Promise<T>,
    successMessage: string,
    errorMessage: string
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await operation();
      toast({
        title: "Success",
        description: successMessage,
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Task List Operations
  const createNewTaskList = (data: CreateTaskListData) =>
    handleOperation(
      () => createTaskList(data),
      "Task list created successfully",
      "Failed to create task list"
    );

  const updateExistingTaskList = (listId: string, data: UpdateTaskListData) =>
    handleOperation(
      () => updateTaskList(listId, data),
      "Task list updated successfully",
      "Failed to update task list"
    );

  const deleteExistingTaskList = (listId: string) =>
    handleOperation(
      () => deleteTaskList(listId),
      "Task list deleted successfully",
      "Failed to delete task list"
    );

  // Task Operations
  const createNewTask = (data: CreateTaskData) =>
    handleOperation(
      () => createTask(data),
      "Task created successfully",
      "Failed to create task"
    );

  const updateExistingTask = (taskId: string, data: UpdateTaskData) =>
    handleOperation(
      () => updateTask(taskId, data),
      "Task updated successfully",
      "Failed to update task"
    );

  const deleteExistingTask = (taskId: string) =>
    handleOperation(
      () => deleteTask(taskId),
      "Task deleted successfully",
      "Failed to delete task"
    );

  const toggleTaskCompletion = (taskId: string, completed: boolean) =>
    handleOperation(
      () => updateTask(taskId, { status: completed ? 'completed' : 'pending' }),
      completed ? "Task marked as completed" : "Task marked as pending",
      "Failed to update task status"
    );

  // Subtask Operations
  const createNewSubtask = (data: CreateSubtaskData) =>
    handleOperation(
      () => createSubtask(data),
      "Subtask created successfully",
      "Failed to create subtask"
    );

  const updateExistingSubtask = (subtaskId: string, data: UpdateSubtaskData) =>
    handleOperation(
      () => updateSubtask(subtaskId, data),
      "Subtask updated successfully",
      "Failed to update subtask"
    );

  const deleteExistingSubtask = (subtaskId: string) =>
    handleOperation(
      () => deleteSubtask(subtaskId),
      "Subtask deleted successfully",
      "Failed to delete subtask"
    );

  const toggleSubtaskCompletion = (subtaskId: string, completed: boolean) =>
    handleOperation(
      () => updateSubtask(subtaskId, { status: completed ? 'completed' : 'pending' }),
      completed ? "Subtask marked as completed" : "Subtask marked as pending",
      "Failed to update subtask status"
    );

  return {
    loading,
    // Task List Operations
    createTaskList: createNewTaskList,
    updateTaskList: updateExistingTaskList,
    deleteTaskList: deleteExistingTaskList,
    // Task Operations
    createTask: createNewTask,
    updateTask: updateExistingTask,
    deleteTask: deleteExistingTask,
    toggleTaskCompletion,
    // Subtask Operations
    createSubtask: createNewSubtask,
    updateSubtask: updateExistingSubtask,
    deleteSubtask: deleteExistingSubtask,
    toggleSubtaskCompletion,
  };
};