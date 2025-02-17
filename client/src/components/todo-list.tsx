import { type Todo } from "@shared/schema";
import TodoItem from "./todo-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWithinInterval, startOfDay, addDays, parseISO, isBefore } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
  showFilters?: boolean;
}

export default function TodoList({ todos, isLoading, showFilters = true }: TodoListProps) {
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>("next7days");

  if (isLoading) {
    return (
      <div className={cn(showFilters && "grid grid-cols-[250px_1fr] gap-6")}>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const in7Days = addDays(today, 7);

  const filterTodos = (filter: string) => {
    let filteredTodos = todos;
    switch (filter) {
      case "all":
        break;
      case "active":
        filteredTodos = todos.filter((todo) => !todo.completed);
        break;
      case "completed":
        filteredTodos = todos.filter((todo) => todo.completed);
        break;
      case "today": {
        const overdueTodos = todos.filter(
          (todo) => todo.dueDate && isBefore(parseISO(todo.dueDate), today)
        );
        const todayTodos = todos.filter(
          (todo) =>
            todo.dueDate &&
            isWithinInterval(parseISO(todo.dueDate), {
              start: today,
              end: addDays(today, 1),
            })
        );
        filteredTodos = [...overdueTodos, ...todayTodos];
        break;
      }
      case "next7days": {
        const overdueTodos = todos.filter(
          (todo) => todo.dueDate && isBefore(parseISO(todo.dueDate), today)
        );
        const weekTodos = todos.filter(
          (todo) =>
            todo.dueDate &&
            isWithinInterval(parseISO(todo.dueDate), {
              start: today,
              end: in7Days,
            })
        );
        filteredTodos = [...overdueTodos, ...weekTodos];
        break;
      }
    }

    const activeTodos = filteredTodos.filter((todo) => !todo.completed);
    const completedTodos = filteredTodos.filter((todo) => todo.completed);

    return { activeTodos, completedTodos };
  };

  // Calculate counts of active todos for each filter
  const filterCounts = {
    all: todos.filter(todo => !todo.completed).length,
    active: todos.filter(todo => !todo.completed).length,
    completed: filterTodos("completed").activeTodos.length,
    today: filterTodos("today").activeTodos.length,
    next7days: filterTodos("next7days").activeTodos.length
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'today', label: 'Today' },
    { id: 'next7days', label: 'Next 7 Days' }
  ];

  const { activeTodos, completedTodos } = filterTodos(currentFilter);
  const hasActiveTodos = activeTodos.length > 0;
  const hasCompletedTodos = completedTodos.length > 0;

  if (!showFilters) {
    return (
      <div className="space-y-4">
        {!todos.length ? (
          <div className="py-8 text-center text-muted-foreground">
            No todos in this list
          </div>
        ) : (
          todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
        )}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", showFilters && "grid-cols-[250px_1fr]")}>
      {/* Left column - Filters */}
      {showFilters && (
        <div className="space-y-2">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={currentFilter === filter.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                currentFilter === filter.id && "bg-primary"
              )}
              onClick={() => setCurrentFilter(filter.id)}
            >
              <span className="flex-1 text-left">{filter.label}</span>
              <span className="text-sm text-muted-foreground">
                ({filterCounts[filter.id as keyof typeof filterCounts]})
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Right column - Tasks */}
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
    </div>
  );
}