import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';
import { TaskList, CreateTaskListData, UpdateTaskListData } from '../../types';

const createTaskListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

const updateTaskListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

type CreateFormData = z.infer<typeof createTaskListSchema>;
type UpdateFormData = z.infer<typeof updateTaskListSchema>;

interface TaskListFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskList?: TaskList; // If provided, this is an edit form
  onSubmit: (data: CreateTaskListData | UpdateTaskListData) => Promise<void>;
  loading?: boolean;
}

export const TaskListForm: React.FC<TaskListFormProps> = ({
  open,
  onOpenChange,
  taskList,
  onSubmit,
  loading = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!taskList;

  const form = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateTaskListSchema : createTaskListSchema),
    defaultValues: {
      title: taskList?.title || '',
      description: taskList?.description || '',
    },
  });

  const handleSubmit = async (data: CreateFormData | UpdateFormData) => {
    setError(null);
    
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      setError(error.message || 'Failed to save task list. Please try again.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Task List' : 'Create New Task List'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your task list details below.'
              : 'Create a new task list to organize your tasks.'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter list title"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter list description"
                      rows={3}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update List' : 'Create List'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};