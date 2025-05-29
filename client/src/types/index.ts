// User types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  lastActive: string;
}

// Task List types
export interface TaskList {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  sharedWith?: Record<string, SharedUser>;
}

export interface SharedUser {
  permission: 'view' | 'edit';
  addedAt: string;
  addedBy: string;
}

// Task types
export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  dueDate?: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday is 0
  endDate?: string;
}

// Subtask types
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  status: 'pending' | 'completed';
  order: number;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
}

// Invitation types
export interface Invitation {
  id: string;
  listId: string;
  inviterEmail: string;
  inviteeEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  permission: 'view' | 'edit';
  createdAt: string;
  expiresAt: string;
}

// Form types for creating/updating entities
export interface CreateTaskListData {
  title: string;
  description?: string;
}

export interface UpdateTaskListData {
  title?: string;
  description?: string;
}

export interface CreateTaskData {
  listId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'completed';
  dueDate?: string;
  assignedTo?: string;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface CreateSubtaskData {
  taskId: string;
  title: string;
  order: number;
}

export interface UpdateSubtaskData {
  title?: string;
  status?: 'pending' | 'completed';
  order?: number;
}

// Filter and sort types
export interface TaskFilter {
  status?: 'pending' | 'completed' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'all';
  assignedTo?: string | 'all';
  dueDateRange?: {
    start?: string;
    end?: string;
  };
}

export interface TaskSort {
  field: 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  direction: 'asc' | 'desc';
}

// UI state types
export interface TaskListWithStats extends TaskList {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
  subtaskStats: {
    total: number;
    completed: number;
    pending: number;
  };
}

// Permission helpers
export type Permission = 'owner' | 'edit' | 'view' | 'none';

// Database structure interface
export interface DatabaseStructure {
  users: Record<string, User>;
  taskLists: Record<string, TaskList>;
  tasks: Record<string, Task>;
  subtasks: Record<string, Subtask>;
  invitations: Record<string, Invitation>;
}