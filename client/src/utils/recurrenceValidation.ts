import { RecurrencePattern } from '../types';

export interface RecurrenceValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateRecurrencePattern = (pattern: RecurrencePattern): RecurrenceValidationResult => {
  const errors: string[] = [];

  // Validate interval
  if (pattern.interval < 1) {
    errors.push('Interval must be at least 1');
  }
  
  if (pattern.interval > 365) {
    errors.push('Interval cannot exceed 365');
  }

  // Validate based on recurrence type
  switch (pattern.type) {
    case 'daily':
      if (pattern.interval > 30) {
        errors.push('Daily recurrence interval should not exceed 30 days');
      }
      break;

    case 'weekly':
      if (pattern.interval > 52) {
        errors.push('Weekly recurrence interval should not exceed 52 weeks');
      }
      
      if (pattern.daysOfWeek) {
        if (pattern.daysOfWeek.length === 0) {
          errors.push('At least one day of the week must be selected for weekly recurrence');
        }
        
        const invalidDays = pattern.daysOfWeek.filter(day => day < 0 || day > 6);
        if (invalidDays.length > 0) {
          errors.push('Invalid days of week selected');
        }
      }
      break;

    case 'monthly':
      if (pattern.interval > 12) {
        errors.push('Monthly recurrence interval should not exceed 12 months');
      }
      break;
  }

  // Validate end date
  if (pattern.endDate) {
    const endDate = new Date(pattern.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (endDate <= today) {
      errors.push('End date must be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateNextOccurrence = (
  lastDueDate: Date, 
  pattern: RecurrencePattern
): Date | null => {
  const { type, interval, daysOfWeek } = pattern;
  let nextDate = new Date(lastDueDate);

  switch (type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find the next occurrence based on selected days
        const currentDay = nextDate.getDay();
        let daysToAdd = interval * 7;
        
        // Find the next day of week occurrence
        const nextDayIndex = daysOfWeek.findIndex(day => day > currentDay);
        if (nextDayIndex !== -1) {
          daysToAdd = daysOfWeek[nextDayIndex] - currentDay;
        } else {
          // Go to next week, first selected day
          daysToAdd = 7 - currentDay + daysOfWeek[0];
        }
        
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      } else {
        nextDate.setDate(nextDate.getDate() + (interval * 7));
      }
      break;

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;

    default:
      return null;
  }

  // Check if end date is exceeded
  if (pattern.endDate && nextDate > new Date(pattern.endDate)) {
    return null;
  }

  return nextDate;
};

export const shouldGenerateRecurringTask = (
  lastDueDate: Date,
  pattern: RecurrencePattern,
  existingFutureTasks: Date[]
): boolean => {
  const nextOccurrence = calculateNextOccurrence(lastDueDate, pattern);
  
  if (!nextOccurrence) {
    return false;
  }

  const now = new Date();
  const daysUntilDue = Math.ceil((nextOccurrence.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Only generate tasks due within the next 7 days
  if (daysUntilDue > 7) {
    return false;
  }

  // Check if a task for this date already exists
  const taskAlreadyExists = existingFutureTasks.some(date => 
    date.toDateString() === nextOccurrence.toDateString()
  );

  return !taskAlreadyExists;
};

export const getRecurrenceDescription = (pattern: RecurrencePattern): string => {
  const { type, interval, daysOfWeek, endDate } = pattern;
  
  let description = '';
  
  switch (type) {
    case 'daily':
      description = interval === 1 ? 'Every day' : `Every ${interval} days`;
      break;
      
    case 'weekly':
      if (interval === 1) {
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const selectedDays = daysOfWeek.map(day => dayNames[day]).join(', ');
          description = `Weekly on ${selectedDays}`;
        } else {
          description = 'Every week';
        }
      } else {
        description = `Every ${interval} weeks`;
      }
      break;
      
    case 'monthly':
      description = interval === 1 ? 'Every month' : `Every ${interval} months`;
      break;
  }
  
  if (endDate) {
    const endDateObj = new Date(endDate);
    description += ` until ${endDateObj.toLocaleDateString()}`;
  }
  
  return description;
};