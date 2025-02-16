import { type Todo, RecurrenceType, PriorityLevel } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pencil, Trash2, X, Check, Calendar as CalendarIcon, RotateCw, Flag } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { firebaseDB } from "@/lib/firebase";
import { format, isBefore, startOfDay } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editDueDate, setEditDueDate] = useState<string | null>(todo.dueDate);
  const [editRecurrenceType, setEditRecurrenceType] = useState<keyof typeof RecurrenceType>(todo.recurrenceType as keyof typeof RecurrenceType);
  const [editPriority, setEditPriority] = useState<keyof typeof PriorityLevel>(todo.priority as keyof typeof PriorityLevel);
  const { toast } = useToast();

  const isOverdue = todo.dueDate && isBefore(new Date(todo.dueDate), startOfDay(new Date()));

  const updateTodo = useMutation({
    mutationFn: async (data: Partial<Todo>) => {
      await firebaseDB.updateTodo(todo.id, data);
    },
    onSuccess: () => {
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update todo", variant: "destructive" });
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async () => {
      await firebaseDB.deleteTodo(todo.id);
    },
    onError: () => {
      toast({ title: "Failed to delete todo", variant: "destructive" });
    },
  });

  const getRecurrenceText = (type: string) => {
    switch (type) {
      case "daily":
        return "Repeats daily";
      case "weekly":
        return "Repeats weekly";
      case "monthly":
        return "Repeats monthly";
      case "yearly":
        return "Repeats yearly";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-500";
      case "medium":
        return "text-amber-600 dark:text-amber-500";
      case "low":
        return "text-emerald-600 dark:text-emerald-500";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) =>
          updateTodo.mutate({ completed: checked as boolean })
        }
      />

      {isEditing ? (
        <div className="flex flex-1 items-center gap-2">
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={editDueDate ? new Date(editDueDate) : undefined}
                onSelect={(date) => setEditDueDate(date ? date.toISOString() : null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select
            value={editRecurrenceType}
            onValueChange={(value: keyof typeof RecurrenceType) => setEditRecurrenceType(value)}
          >
            <SelectTrigger className="w-[140px]">
              <RotateCw className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Never</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={editPriority}
            onValueChange={(value: keyof typeof PriorityLevel) => setEditPriority(value)}
          >
            <SelectTrigger className="w-[140px]">
              <Flag className={cn("mr-2 h-4 w-4", getPriorityColor(editPriority))} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (editText.trim()) {
                updateTodo.mutate({
                  text: editText.trim(),
                  dueDate: editDueDate,
                  recurrenceType: editRecurrenceType,
                  priority: editPriority,
                });
              }
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsEditing(false);
              setEditText(todo.text);
              setEditDueDate(todo.dueDate);
              setEditRecurrenceType(todo.recurrenceType as keyof typeof RecurrenceType);
              setEditPriority(todo.priority as keyof typeof PriorityLevel);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  todo.completed && "text-muted-foreground line-through",
                  isOverdue && !todo.completed && "text-destructive font-medium"
                )}
                onDoubleClick={() => setIsEditing(true)}
              >
                {todo.text}
              </span>
              <Flag className={cn("h-4 w-4", getPriorityColor(todo.priority))} />
            </div>
            <div className="flex gap-2 items-center">
              {todo.dueDate && (
                <span className={cn(
                  "text-sm",
                  isOverdue && !todo.completed ? "text-destructive" : "text-muted-foreground"
                )}>
                  Due: {format(new Date(todo.dueDate), "PPP")}
                </span>
              )}
              {todo.recurrenceType !== RecurrenceType.NONE && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <RotateCw className="h-3 w-3" />
                  {getRecurrenceText(todo.recurrenceType as string)}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteTodo.mutate()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}