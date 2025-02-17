import { type Todo } from "@shared/schema";
import TodoItem from "./todo-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
}

export default function TodoList({ todos, isLoading }: TodoListProps) {
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  // Separate active and completed todos
  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);
  const hasActiveTodos = activeTodos.length > 0;
  const hasCompletedTodos = completedTodos.length > 0;

  return (
    <div className="space-y-4">
      {!hasActiveTodos && !hasCompletedTodos ? (
        <div className="py-8 text-center text-muted-foreground">
          No todos to display
        </div>
      ) : (
        <div className="space-y-4">
          {hasActiveTodos && (
            <div className="space-y-2">
              {activeTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}

          {hasCompletedTodos && (
            <Collapsible
              open={isCompletedOpen}
              onOpenChange={setIsCompletedOpen}
              className="space-y-2"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex w-full items-center justify-between p-2"
                >
                  <span className="text-sm text-muted-foreground">
                    Completed ({completedTodos.length})
                  </span>
                  {isCompletedOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                {completedTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
}