import { type Todo } from "@shared/schema";
import TodoItem from "./todo-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isWithinInterval, startOfDay, addDays, parseISO, isBefore } from "date-fns";
import { useState } from "react";

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
}

export default function TodoList({ todos, isLoading }: TodoListProps) {
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>("next7days");

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
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

  const { activeTodos } = filterTodos(currentFilter);

  // Calculate counts for each filter
  const filterCounts = {
    all: todos.length,
    active: todos.filter(todo => !todo.completed).length,
    completed: todos.filter(todo => todo.completed).length,
    today: filterTodos("today").activeTodos.length + filterTodos("today").completedTodos.length,
    next7days: filterTodos("next7days").activeTodos.length + filterTodos("next7days").completedTodos.length
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-end">
        <span className="text-sm text-muted-foreground">
          {activeTodos.length} item{activeTodos.length !== 1 ? "s" : ""} left
        </span>
      </div>

      <Tabs defaultValue="next7days" className="w-full" onValueChange={setCurrentFilter}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({filterCounts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({filterCounts.active})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterCounts.completed})</TabsTrigger>
          <TabsTrigger value="today">Today ({filterCounts.today})</TabsTrigger>
          <TabsTrigger value="next7days">Next 7 Days ({filterCounts.next7days})</TabsTrigger>
        </TabsList>

        {["all", "active", "completed", "today", "next7days"].map((filter) => {
          const { activeTodos, completedTodos } = filterTodos(filter);
          const hasActiveTodos = activeTodos.length > 0;
          const hasCompletedTodos = completedTodos.length > 0;

          return (
            <TabsContent key={filter} value={filter} className="mt-4">
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
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}