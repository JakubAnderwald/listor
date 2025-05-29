import { TaskWithSubtasks, TaskFilter, TaskSort } from '../types';

export const applyTaskFilters = (tasks: TaskWithSubtasks[], filter: TaskFilter): TaskWithSubtasks[] => {
  return tasks.filter(task => {
    // Status filter
    if (filter.status && filter.status !== 'all') {
      if (task.status !== filter.status) return false;
    }

    // Priority filter
    if (filter.priority && filter.priority !== 'all') {
      if (task.priority !== filter.priority) return false;
    }

    // Assigned to filter
    if (filter.assignedTo && filter.assignedTo !== 'all') {
      if (task.assignedTo !== filter.assignedTo) return false;
    }

    // Due date range filter
    if (filter.dueDateRange) {
      if (filter.dueDateRange.start && task.dueDate) {
        if (new Date(task.dueDate) < new Date(filter.dueDateRange.start)) return false;
      }
      if (filter.dueDateRange.end && task.dueDate) {
        if (new Date(task.dueDate) > new Date(filter.dueDateRange.end)) return false;
      }
    }

    return true;
  });
};

export const sortTasks = (tasks: TaskWithSubtasks[], sort: TaskSort): TaskWithSubtasks[] => {
  return [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) comparison = 0;
        else if (!a.dueDate) comparison = 1;
        else if (!b.dueDate) comparison = -1;
        else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      default:
        comparison = 0;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
};

export const getFilteredAndSortedTasks = (
  tasks: TaskWithSubtasks[], 
  filter: TaskFilter, 
  sort: TaskSort
): TaskWithSubtasks[] => {
  const filteredTasks = applyTaskFilters(tasks, filter);
  return sortTasks(filteredTasks, sort);
};

export const getDefaultFilter = (): TaskFilter => ({
  status: 'all',
  priority: 'all',
  assignedTo: 'all',
});

export const getDefaultSort = (): TaskSort => ({
  field: 'createdAt',
  direction: 'desc',
});

export const isTaskOverdue = (task: TaskWithSubtasks): boolean => {
  if (!task.dueDate || task.status === 'completed') return false;
  return new Date(task.dueDate) < new Date();
};

export const isTaskDueToday = (task: TaskWithSubtasks): boolean => {
  if (!task.dueDate) return false;
  const today = new Date();
  const dueDate = new Date(task.dueDate);
  return dueDate.toDateString() === today.toDateString();
};

export const getTaskStats = (tasks: TaskWithSubtasks[]) => {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'completed').length;
  const pending = tasks.filter(task => task.status === 'pending').length;
  const overdue = tasks.filter(task => isTaskOverdue(task)).length;
  const dueToday = tasks.filter(task => isTaskDueToday(task)).length;

  return {
    total,
    completed,
    pending,
    overdue,
    dueToday,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};