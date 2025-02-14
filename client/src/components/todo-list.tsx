import { type Todo } from "@shared/schema";
import TodoItem from "./todo-item";
import { Skeleton } from "@/components/ui/skeleton";

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
}

export default function TodoList({ todos, isLoading }: TodoListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No todos to display
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
