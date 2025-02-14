import { type Todo } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { firebaseDB } from "@/lib/firebase";

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const { toast } = useToast();

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (editText.trim()) {
                updateTodo.mutate({ text: editText.trim() });
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
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span
            className={cn("flex-1", todo.completed && "text-muted-foreground line-through")}
            onDoubleClick={() => setIsEditing(true)}
          >
            {todo.text}
          </span>
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