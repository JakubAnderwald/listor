import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const generateRecurringTasks = functions.pubsub.schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = admin.database();
    
    try {
      // Get all recurring tasks
      const tasksSnapshot = await db.ref('tasks')
        .orderByChild('isRecurring')
        .equalTo(true)
        .once('value');

      const tasks = tasksSnapshot.val();
      
      if (!tasks) {
        console.log('No recurring tasks found');
        return null;
      }

      const now = new Date();
      const updates: { [key: string]: any } = {};

      for (const taskId in tasks) {
        const task = tasks[taskId];
        
        if (!task.recurrencePattern || !task.dueDate) {
          continue;
        }

        const { type, interval, daysOfWeek, endDate } = task.recurrencePattern;
        const lastDueDate = new Date(task.dueDate);

        // Skip if recurrence has ended
        if (endDate && new Date(endDate) < now) {
          continue;
        }

        // Check if a future instance already exists for this recurrence
        const existingTasksSnapshot = await db.ref('tasks')
          .orderByChild('listId')
          .equalTo(task.listId)
          .once('value');
        
        const existingTasks = existingTasksSnapshot.val() || {};
        const hasFutureInstance = Object.values(existingTasks).some((t: any) => 
          t.title === task.title && 
          t.isRecurring && 
          t.dueDate && 
          new Date(t.dueDate) > now
        );

        if (hasFutureInstance) {
          continue;
        }

        // Calculate next due date
        let nextDueDate: Date | null = null;

        switch (type) {
          case 'daily':
            nextDueDate = new Date(lastDueDate);
            nextDueDate.setDate(nextDueDate.getDate() + interval);
            break;

          case 'weekly':
            if (daysOfWeek && daysOfWeek.length > 0) {
              // Find next occurrence based on days of week
              nextDueDate = new Date(lastDueDate);
              nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
              
              // Adjust to the correct day of week
              const targetDay = daysOfWeek[0]; // Use first day for simplicity
              const currentDay = nextDueDate.getDay();
              const daysToAdd = (targetDay - currentDay + 7) % 7;
              nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);
            } else {
              nextDueDate = new Date(lastDueDate);
              nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
            }
            break;

          case 'monthly':
            nextDueDate = new Date(lastDueDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + interval);
            break;
        }

        if (!nextDueDate || nextDueDate <= now) {
          continue;
        }

        // Only create tasks due within the next 7 days
        const daysDifference = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDifference <= 7) {
          const newTaskId = db.ref('tasks').push().key;
          
          if (newTaskId) {
            const newTask = {
              ...task,
              id: newTaskId,
              dueDate: nextDueDate.toISOString().split('T')[0],
              status: 'pending',
              completedAt: null,
              completedBy: null,
              createdAt: admin.database.ServerValue.TIMESTAMP,
              updatedAt: admin.database.ServerValue.TIMESTAMP,
              // Mark as generated from recurrence
              generatedFrom: taskId
            };

            updates[`tasks/${newTaskId}`] = newTask;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
        console.log(`Generated ${Object.keys(updates).length} recurring tasks`);
      } else {
        console.log('No new recurring tasks to generate');
      }

      return null;
    } catch (error) {
      console.error('Error generating recurring tasks:', error);
      return null;
    }
  });