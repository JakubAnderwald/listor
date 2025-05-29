import { 
  ref, 
  push, 
  set, 
  update, 
  remove, 
  get, 
  query, 
  orderByChild, 
  equalTo,
  onValue,
  off,
  serverTimestamp
} from 'firebase/database';
import { database, auth } from './firebase';
import { 
  TaskList, 
  Task, 
  Subtask, 
  CreateTaskListData, 
  UpdateTaskListData,
  CreateTaskData,
  UpdateTaskData,
  CreateSubtaskData,
  UpdateSubtaskData,
  TaskListWithStats,
  TaskWithSubtasks,
  RecurrencePattern
} from '../types';
import { calculateNextOccurrence } from '../utils/recurrenceValidation';

// Helper function to create next recurring task instance
const createNextRecurringTask = async (completedTask: any): Promise<void> => {
  if (!completedTask.recurrencePattern || !completedTask.dueDate) return;

  const currentDueDate = new Date(completedTask.dueDate);
  const nextDueDate = calculateNextOccurrence(currentDueDate, completedTask.recurrencePattern);

  // Exit early if no valid next date can be calculated
  if (!nextDueDate) {
    console.log('No next occurrence calculated for recurring task:', completedTask.id);
    return;
  }

  // Create new task with updated due date
  const newTaskData: CreateTaskData = {
    listId: completedTask.listId,
    title: completedTask.title,
    description: completedTask.description || '',
    priority: completedTask.priority,
    dueDate: nextDueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    assignedTo: completedTask.assignedTo,
    isRecurring: true,
    recurrencePattern: completedTask.recurrencePattern
  };

  try {
    await createTask(newTaskData);
    console.log('Next recurring task created successfully');
  } catch (error) {
    console.error('Failed to create next recurring task:', error);
  }
};

// Task List Services
export const createTaskList = async (data: CreateTaskListData): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const listsRef = ref(database, 'taskLists');
  const newListRef = push(listsRef);
  
  const taskList: Omit<TaskList, 'id'> = {
    title: data.title,
    description: data.description,
    ownerId: auth.currentUser.uid,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    isShared: false,
  };

  await set(newListRef, taskList);
  return newListRef.key!;
};

export const updateTaskList = async (listId: string, data: UpdateTaskListData): Promise<void> => {
  const listRef = ref(database, `taskLists/${listId}`);
  const updates: any = {
    updatedAt: serverTimestamp(),
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;

  await update(listRef, updates);
};

export const deleteTaskList = async (listId: string): Promise<void> => {
  // Delete all tasks and subtasks in the list first
  const tasksSnapshot = await get(query(ref(database, 'tasks'), orderByChild('listId'), equalTo(listId)));
  const tasks = tasksSnapshot.val() || {};

  const updates: Record<string, null> = {};
  
  // Mark list for deletion
  updates[`taskLists/${listId}`] = null;

  // Mark all tasks for deletion
  for (const taskId in tasks) {
    updates[`tasks/${taskId}`] = null;
    
    // Get subtasks for this task
    const subtasksSnapshot = await get(query(ref(database, 'subtasks'), orderByChild('taskId'), equalTo(taskId)));
    const subtasks = subtasksSnapshot.val() || {};
    
    // Mark all subtasks for deletion
    for (const subtaskId in subtasks) {
      updates[`subtasks/${subtaskId}`] = null;
    }
  }

  await update(ref(database), updates);
};

export const getUserTaskLists = async (): Promise<TaskListWithStats[]> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const listsSnapshot = await get(ref(database, 'taskLists'));
  const allLists = listsSnapshot.val() || {};
  
  const userLists: TaskListWithStats[] = [];

  for (const listId in allLists) {
    const list = allLists[listId];
    // Include lists owned by user or shared with user
    if (list.ownerId === auth.currentUser.uid || 
        (list.sharedWith && list.sharedWith[auth.currentUser.uid])) {
      
      // Get tasks for this list to calculate stats
      let totalTasks = 0;
      let completedTasks = 0;
      let pendingTasks = 0;
      let overdueTasks = 0;
      
      try {
        const tasksSnapshot = await get(query(ref(database, 'tasks'), orderByChild('listId'), equalTo(listId)));
        const tasks = tasksSnapshot.val() || {};
        
        const taskArray = Object.entries(tasks).map(([id, task]) => ({ ...task as Task, id }));
        totalTasks = taskArray.length;
        completedTasks = taskArray.filter(task => task.status === 'completed').length;
        pendingTasks = taskArray.filter(task => task.status === 'pending').length;
        overdueTasks = taskArray.filter(task => 
          task.dueDate && 
          new Date(task.dueDate) < new Date() && 
          task.status !== 'completed'
        ).length;
      } catch (error) {
        console.warn('Could not fetch tasks for list', listId, '- using zero stats');
        // Continue with zero stats if tasks can't be fetched
      }

      userLists.push({
        ...list,
        id: listId,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
      });
    }
  }

  return userLists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

// Task Services
export const createTask = async (data: CreateTaskData): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');



  const tasksRef = ref(database, 'tasks');
  const newTaskRef = push(tasksRef);
  
  const task: any = {
    listId: data.listId,
    title: data.title,
    priority: data.priority,
    status: 'pending',
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isRecurring: data.isRecurring || false,
  };

  // Add optional fields only if they have values
  if (data.description) {
    task.description = data.description;
  }
  if (data.dueDate) {
    task.dueDate = data.dueDate;
  }
  if (data.assignedTo) {
    task.assignedTo = data.assignedTo;
  }
  if (data.recurrencePattern) {
    // Clean up undefined values from recurrence pattern
    const cleanRecurrencePattern: any = {
      type: data.recurrencePattern.type,
      interval: data.recurrencePattern.interval
    };
    
    // Only add optional fields if they have values
    if (data.recurrencePattern.daysOfWeek && data.recurrencePattern.daysOfWeek.length > 0) {
      cleanRecurrencePattern.daysOfWeek = data.recurrencePattern.daysOfWeek;
    }
    if (data.recurrencePattern.endDate) {
      cleanRecurrencePattern.endDate = data.recurrencePattern.endDate;
    }
    
    task.recurrencePattern = cleanRecurrencePattern;
  }

  try {
    console.log('Creating task with data:', { data, task });
    
    // Try to set the task data
    await set(newTaskRef, task);
    console.log('Task data set successfully, ID:', newTaskRef.key);
    
    // Update list's updatedAt timestamp
    await update(ref(database, `taskLists/${data.listId}`), {
      updatedAt: serverTimestamp()
    });
    console.log('Task list updated successfully');

    return newTaskRef.key!;
  } catch (error: any) {
    console.error('Error creating task:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      details: error
    });
    console.error('Task data was:', data);
    console.error('Processed task object:', task);
    console.error('Auth user:', auth.currentUser?.uid);
    console.error('Database ref path:', newTaskRef.toString());
    throw error;
  }
};

export const updateTask = async (taskId: string, data: UpdateTaskData): Promise<void> => {
  // First get the current task data to check if it's recurring
  const taskSnapshot = await get(ref(database, `tasks/${taskId}`));
  const currentTask = taskSnapshot.val();
  
  const taskRef = ref(database, `tasks/${taskId}`);
  const updates: any = {
    updatedAt: serverTimestamp(),
  };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.status !== undefined) {
    updates.status = data.status;
    if (data.status === 'completed') {
      updates.completedAt = serverTimestamp();
      updates.completedBy = auth.currentUser?.uid;
    } else {
      updates.completedAt = null;
      updates.completedBy = null;
    }
  }
  if (data.dueDate !== undefined) updates.dueDate = data.dueDate;
  if (data.assignedTo !== undefined) updates.assignedTo = data.assignedTo;
  if (data.isRecurring !== undefined) updates.isRecurring = data.isRecurring;
  if (data.recurrencePattern !== undefined) updates.recurrencePattern = data.recurrencePattern;

  await update(taskRef, updates);

  // If task is being marked as completed and it's recurring, create next instance
  if (data.status === 'completed' && currentTask?.isRecurring && currentTask?.recurrencePattern) {
    await createNextRecurringTask(currentTask);
  }

  // Update list's updatedAt timestamp
  if (currentTask?.listId) {
    await update(ref(database, `taskLists/${currentTask.listId}`), {
      updatedAt: serverTimestamp()
    });
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  // Get task to find listId for timestamp update
  const taskSnapshot = await get(ref(database, `tasks/${taskId}`));
  const task = taskSnapshot.val();

  // Delete all subtasks first
  const subtasksSnapshot = await get(query(ref(database, 'subtasks'), orderByChild('taskId'), equalTo(taskId)));
  const subtasks = subtasksSnapshot.val() || {};

  const updates: Record<string, null> = {};
  updates[`tasks/${taskId}`] = null;

  for (const subtaskId in subtasks) {
    updates[`subtasks/${subtaskId}`] = null;
  }

  await update(ref(database), updates);

  // Update list's updatedAt timestamp
  if (task?.listId) {
    await update(ref(database, `taskLists/${task.listId}`), {
      updatedAt: serverTimestamp()
    });
  }
};

export const getTasksForList = async (listId: string): Promise<TaskWithSubtasks[]> => {
  const tasksSnapshot = await get(query(ref(database, 'tasks'), orderByChild('listId'), equalTo(listId)));
  const tasks = tasksSnapshot.val() || {};

  const tasksWithSubtasks: TaskWithSubtasks[] = [];

  for (const taskId in tasks) {
    const task = tasks[taskId];
    
    // Get subtasks for this task
    const subtasksSnapshot = await get(query(ref(database, 'subtasks'), orderByChild('taskId'), equalTo(taskId)));
    const subtasksData = subtasksSnapshot.val() || {};
    
    const subtasks = Object.entries(subtasksData).map(([id, subtask]) => ({
      ...subtask as Subtask,
      id
    }));

    const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
    const pendingSubtasks = subtasks.filter(s => s.status === 'pending').length;

    tasksWithSubtasks.push({
      id: taskId,
      ...task,
      subtasks,
      subtaskStats: {
        total: subtasks.length,
        completed: completedSubtasks,
        pending: pendingSubtasks,
      },
    });
  }

  return tasksWithSubtasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Subtask Services
export const createSubtask = async (data: CreateSubtaskData): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const subtasksRef = ref(database, 'subtasks');
  const newSubtaskRef = push(subtasksRef);
  
  const subtask: Omit<Subtask, 'id'> = {
    taskId: data.taskId,
    title: data.title,
    status: 'pending',
    order: data.order,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp() as any,
  };

  await set(newSubtaskRef, subtask);

  // Update task's updatedAt timestamp
  await update(ref(database, `tasks/${data.taskId}`), {
    updatedAt: serverTimestamp()
  });

  return newSubtaskRef.key!;
};

export const updateSubtask = async (subtaskId: string, data: UpdateSubtaskData): Promise<void> => {
  const subtaskRef = ref(database, `subtasks/${subtaskId}`);
  const updates: any = {};

  if (data.title !== undefined) updates.title = data.title;
  if (data.order !== undefined) updates.order = data.order;
  if (data.status !== undefined) {
    updates.status = data.status;
    if (data.status === 'completed') {
      updates.completedAt = serverTimestamp();
      updates.completedBy = auth.currentUser?.uid;
    } else {
      updates.completedAt = null;
      updates.completedBy = null;
    }
  }

  await update(subtaskRef, updates);

  // Update task's updatedAt timestamp
  const subtaskSnapshot = await get(subtaskRef);
  const subtask = subtaskSnapshot.val();
  if (subtask?.taskId) {
    await update(ref(database, `tasks/${subtask.taskId}`), {
      updatedAt: serverTimestamp()
    });
  }
};

export const deleteSubtask = async (subtaskId: string): Promise<void> => {
  // Get subtask to find taskId for timestamp update
  const subtaskSnapshot = await get(ref(database, `subtasks/${subtaskId}`));
  const subtask = subtaskSnapshot.val();

  await remove(ref(database, `subtasks/${subtaskId}`));

  // Update task's updatedAt timestamp
  if (subtask?.taskId) {
    await update(ref(database, `tasks/${subtask.taskId}`), {
      updatedAt: serverTimestamp()
    });
  }
};

// Real-time listeners
export const subscribeToTaskLists = (callback: (taskLists: TaskListWithStats[]) => void): (() => void) => {
  if (!auth.currentUser) {
    // Return empty unsubscribe function if not authenticated
    return () => {};
  }

  const listsRef = ref(database, 'taskLists');
  
  const unsubscribe = onValue(listsRef, async () => {
    try {
      const taskLists = await getUserTaskLists();
      callback(taskLists);
    } catch (error) {
      console.error('Error fetching task lists:', error);
    }
  });

  return () => off(listsRef, 'value', unsubscribe);
};

export const subscribeToTasks = (listId: string, callback: (tasks: TaskWithSubtasks[]) => void): (() => void) => {
  const tasksRef = ref(database, 'tasks');
  const subtasksRef = ref(database, 'subtasks');
  
  const updateTasks = async () => {
    try {
      const tasks = await getTasksForList(listId);
      callback(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const unsubscribeTasks = onValue(tasksRef, updateTasks);
  const unsubscribeSubtasks = onValue(subtasksRef, updateTasks);

  return () => {
    off(tasksRef, 'value', unsubscribeTasks);
    off(subtasksRef, 'value', unsubscribeSubtasks);
  };
};

// Sharing and Collaboration Services
export const sendListInvitation = async (listId: string, inviteeEmail: string, permission: 'view' | 'edit'): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  // Verify the user owns the task list
  const listSnapshot = await get(ref(database, `taskLists/${listId}`));
  if (!listSnapshot.exists() || listSnapshot.val().ownerId !== auth.currentUser.uid) {
    throw new Error('Only list owner can send invitations');
  }

  const taskList = listSnapshot.val();
  const invitationsRef = ref(database, 'invitations');
  const newInvitationRef = push(invitationsRef);
  
  const invitation = {
    listId,
    inviterEmail: auth.currentUser.email,
    inviteeEmail,
    token: newInvitationRef.key,
    status: 'pending',
    permission,
    createdAt: serverTimestamp(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
    emailSent: false,
    emailError: null
  };

  // Save invitation to database first
  await set(newInvitationRef, invitation);

  // Send email through our backend service
  try {
    const invitationUrl = `https://listor.eu/invitation/${newInvitationRef.key}`;
    
    const response = await fetch('/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteeEmail,
        inviterName: auth.currentUser.displayName || auth.currentUser.email || 'Someone',
        listTitle: taskList.title,
        permission,
        invitationUrl
      }),
    });

    const emailResult = await response.json();
    
    // Update invitation with email status
    await update(newInvitationRef, {
      emailSent: emailResult.success,
      emailSentAt: emailResult.success ? serverTimestamp() : null,
      emailError: emailResult.error || null
    });

    if (!emailResult.success) {
      console.warn('Email sending failed:', emailResult.error);
    }
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    // Update invitation with error status
    await update(newInvitationRef, {
      emailSent: false,
      emailError: 'Failed to send email'
    });
  }

  return newInvitationRef.key!;
};

export const getListInvitations = async (listId: string): Promise<any[]> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  try {
    const invitationsSnapshot = await get(
      query(ref(database, 'invitations'), orderByChild('listId'), equalTo(listId))
    );
    
    if (!invitationsSnapshot.exists()) return [];
    
    const invitations = invitationsSnapshot.val();
    if (!invitations) return [];
    
    return Object.entries(invitations).map(([id, invitation]: [string, any]) => ({
      id,
      ...invitation,
    }));
  } catch (error) {
    console.error('Error fetching invitations:', error);
    // Return empty array instead of throwing, as this is a non-critical feature
    return [];
  }
};

export const resendInvitation = async (invitationId: string): Promise<void> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const invitationRef = ref(database, `invitations/${invitationId}`);
  const invitationSnapshot = await get(invitationRef);
  
  if (!invitationSnapshot.exists()) {
    throw new Error('Invitation not found');
  }

  const invitation = invitationSnapshot.val();
  
  // Verify the current user is the inviter
  if (invitation.inviterEmail !== auth.currentUser.email) {
    throw new Error('Only the inviter can resend invitations');
  }

  // Get task list details for email
  const listSnapshot = await get(ref(database, `taskLists/${invitation.listId}`));
  if (!listSnapshot.exists()) {
    throw new Error('Task list not found');
  }
  const taskList = listSnapshot.val();

  // Update the invitation with new expiry and reset status
  await update(invitationRef, {
    status: 'pending',
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
    resentAt: serverTimestamp(),
    emailSent: false,
    emailError: null
  });

  // Send email through our backend service
  try {
    const invitationUrl = `https://listor.eu/invitation/${invitationId}`;
    
    const response = await fetch('/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteeEmail: invitation.inviteeEmail,
        inviterName: auth.currentUser.displayName || auth.currentUser.email || 'Someone',
        listTitle: taskList.title,
        permission: invitation.permission,
        invitationUrl
      }),
    });

    const emailResult = await response.json();
    
    // Update invitation with email status
    await update(invitationRef, {
      emailSent: emailResult.success,
      emailSentAt: emailResult.success ? serverTimestamp() : null,
      emailError: emailResult.error || null
    });

    if (!emailResult.success) {
      console.warn('Email resending failed:', emailResult.error);
      throw new Error('Failed to send invitation email');
    }
  } catch (error) {
    console.error('Failed to resend invitation email:', error);
    // Update invitation with error status
    await update(invitationRef, {
      emailSent: false,
      emailError: 'Failed to send email'
    });
    throw error;
  }
};

export const deleteInvitation = async (invitationId: string): Promise<void> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const invitationRef = ref(database, `invitations/${invitationId}`);
  const invitationSnapshot = await get(invitationRef);
  
  if (!invitationSnapshot.exists()) {
    throw new Error('Invitation not found');
  }

  const invitation = invitationSnapshot.val();
  
  // Verify the current user is the inviter
  if (invitation.inviterEmail !== auth.currentUser.email) {
    throw new Error('Only the inviter can delete invitations');
  }

  // Delete the invitation
  await remove(invitationRef);
};

export const acceptListInvitation = async (token: string): Promise<void> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const invitationRef = ref(database, `invitations/${token}`);
  const invitationSnapshot = await get(invitationRef);
  
  if (!invitationSnapshot.exists()) {
    throw new Error('Invitation not found or expired');
  }

  const invitation = invitationSnapshot.val();
  
  if (invitation.status !== 'pending') {
    throw new Error('Invitation has already been processed');
  }

  if (Date.now() > invitation.expiresAt) {
    throw new Error('Invitation has expired');
  }

  if (invitation.inviteeEmail !== auth.currentUser.email) {
    throw new Error('This invitation is not for your email address');
  }

  // Add user to the shared list
  const updates: any = {};
  updates[`taskLists/${invitation.listId}/sharedWith/${auth.currentUser.uid}`] = {
    permission: invitation.permission,
    addedAt: serverTimestamp(),
    addedBy: invitation.inviterEmail,
  };
  updates[`taskLists/${invitation.listId}/isShared`] = true;
  updates[`invitations/${token}/status`] = 'accepted';

  await update(ref(database), updates);
};

export const removeUserAccess = async (listId: string, userId: string): Promise<void> => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  // Verify the current user owns the list
  const listSnapshot = await get(ref(database, `taskLists/${listId}`));
  if (!listSnapshot.exists() || listSnapshot.val().ownerId !== auth.currentUser.uid) {
    throw new Error('You do not have permission to modify this list');
  }

  const updates: any = {};
  updates[`taskLists/${listId}/sharedWith/${userId}`] = null;

  // Check if there are any remaining shared users
  const remainingSharedUsers = listSnapshot.val().sharedWith || {};
  delete remainingSharedUsers[userId];
  
  if (Object.keys(remainingSharedUsers).length === 0) {
    updates[`taskLists/${listId}/isShared`] = false;
  }

  await update(ref(database), updates);
};

export const getListPermission = (taskList: TaskList, userId: string): 'owner' | 'edit' | 'view' | 'none' => {
  if (taskList.ownerId === userId) {
    return 'owner';
  }
  
  if (taskList.sharedWith && taskList.sharedWith[userId]) {
    return taskList.sharedWith[userId].permission as 'edit' | 'view';
  }
  
  return 'none';
};