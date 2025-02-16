import { type Todo } from "@shared/schema";
import TodoItem from "./todo-item";
import { Skeleton } from "@/components/ui/skeleton";
import { isWithinInterval, startOfDay, addDays, parseISO, isBefore } from "date-fns";

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

  const today = startOfDay(new Date());
  const in7Days = addDays(today, 7);

  const filterTodos = (filter: string) => {
    switch (filter) {
      case "all":
        return todos;
      case "active":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
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
        return [...overdueTodos, ...todayTodos];
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
        return [...overdueTodos, ...weekTodos];
      }
      default:
        return todos;
    }
  };

  return (
    <div className="space-y-2">
      {filterTodos("all").map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}