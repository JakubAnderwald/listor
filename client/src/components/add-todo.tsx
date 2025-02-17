import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTodoSchema, RecurrenceType, PriorityLevel } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, RotateCw, Flag } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { firebaseDB } from "@/lib/firebase";
import type { List } from "@shared/schema";
import { useEffect } from "react";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "!text-red-500 !fill-red-500 !stroke-red-500";
    case "medium":
      return "!text-amber-500 !fill-amber-500 !stroke-amber-500";
    case "low":
      return "!text-emerald-500 !fill-emerald-500 !stroke-emerald-500";
    default:
      return "";
  }
};

export default function AddTodo() {
  const { toast } = useToast();
  const { data: lists = [] } = useQuery<List[]>({
    queryKey: ["lists"],
    queryFn: () => Promise.resolve([]),  // Lists will be populated by Firebase subscription
  });

  // Find the Inbox list or use the first available list
  const defaultListId = lists.find(list => list.name === "Inbox")?.id ?? lists[0]?.id ?? 1;

  const form = useForm({
    resolver: zodResolver(insertTodoSchema),
    defaultValues: {
      text: "",
      completed: false,
      dueDate: null,
      recurrenceType: "none" as const,
      originalDueDate: null,
      priority: "none" as const,
      listId: defaultListId,
    },
  });

  // Update listId when lists change
  useEffect(() => {
    const inboxList = lists.find(list => list.name === "Inbox");
    if (inboxList) {
      form.setValue("listId", inboxList.id);
    }
  }, [lists, form]);

  const createTodo = useMutation({
    mutationFn: async (data: {
      text: string;
      completed: boolean;
      dueDate: string | null;
      recurrenceType: "none" | "daily" | "weekly" | "monthly" | "yearly";
      originalDueDate: string | null;
      priority: "none" | "low" | "medium" | "high";
      listId: number;
    }) => {
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
        className="flex flex-wrap gap-2"
      >
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-[200px]">
              <FormControl>
                <Input
                  placeholder="What needs to be done?"
                  {...field}
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listId"
          render={({ field }) => (
            <FormItem className="flex-shrink-0">
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select List" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        <span>{list.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
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
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                        form.formState.errors.dueDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(new Date(field.value), "PPP") : <span>Set due date</span>}
                    </Button>
                  </FormControl>
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
              <FormMessage />
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
                  <SelectItem value="none">Never</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem className="flex-shrink-0">
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger className="w-[140px]">
                  <Flag className={cn("mr-2 h-4 w-4", getPriorityColor(field.value))} />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createTodo.isPending} className="flex-shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Todo
        </Button>
      </form>
    </Form>
  );
}