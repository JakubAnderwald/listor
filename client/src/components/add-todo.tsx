import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTodoSchema, RecurrenceType } from "@shared/schema";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, RotateCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { firebaseDB } from "@/lib/firebase";

export default function AddTodo() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertTodoSchema),
    defaultValues: {
      text: "",
      completed: false,
      dueDate: null,
      recurrenceType: RecurrenceType.NONE,
      originalDueDate: null,
    },
  });

  const createTodo = useMutation({
    mutationFn: async (data: { text: string; completed: boolean; dueDate: string | null; recurrenceType: string; originalDueDate: string | null }) => {
      await firebaseDB.createTodo(data);
    },
    onSuccess: () => {
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create todo", variant: "destructive" });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createTodo.mutate(data))}
        className="flex gap-2"
      >
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  placeholder="What needs to be done?"
                  {...field}
                  autoComplete="off"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex-shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(new Date(field.value), "PPP") : <span>Set due date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recurrenceType"
          render={({ field }) => (
            <FormItem className="flex-shrink-0">
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger className="w-[140px]">
                  <RotateCw className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Repeat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RecurrenceType.NONE}>Never</SelectItem>
                  <SelectItem value={RecurrenceType.DAILY}>Daily</SelectItem>
                  <SelectItem value={RecurrenceType.WEEKLY}>Weekly</SelectItem>
                  <SelectItem value={RecurrenceType.MONTHLY}>Monthly</SelectItem>
                  <SelectItem value={RecurrenceType.YEARLY}>Yearly</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createTodo.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add Todo
        </Button>
      </form>
    </Form>
  );
}