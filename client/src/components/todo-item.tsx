import { type Todo, RecurrenceType } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pencil, Trash2, X, Check, Calendar as CalendarIcon, RotateCw } from "lucide-react";
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
  const [editRecurrenceType, setEditRecurrenceType] = useState(todo.recurrenceType);
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
      case RecurrenceType.DAILY:
        return "Repeats daily";
      case RecurrenceType.WEEKLY:
        return "Repeats weekly";
      case RecurrenceType.MONTHLY:
        return "Repeats monthly";
      case RecurrenceType.YEARLY:
        return "Repeats yearly";
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
            onValueChange={setEditRecurrenceType}
          >
            <SelectTrigger className="w-[140px]">
              <RotateCw className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RecurrenceType.NONE}>Never</SelectItem>
              <SelectItem value={RecurrenceType.DAILY}>Daily</SelectItem>
              <SelectItem value={RecurrenceType.WEEKLY}>Weekly</SelectItem>
              <SelectItem value={RecurrenceType.MONTHLY}>Monthly</SelectItem>
              <SelectItem value={RecurrenceType.YEARLY}>Yearly</SelectItem>
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
              setEditRecurrenceType(todo.recurrenceType);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col">
            <span
              className={cn(
                todo.completed && "text-muted-foreground line-through",
                isOverdue && !todo.completed && "text-destructive font-medium"
              )}
              onDoubleClick={() => setIsEditing(true)}
            >
              {todo.text}
            </span>
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
                  {getRecurrenceText(todo.recurrenceType)}
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