import TodoList from "@/components/todo-list";
import AddTodo from "@/components/add-todo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Todo } from "@shared/schema";
import { useEffect } from "react";
import { firebaseDB } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Home() {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
    initialData: [],
  });

  useEffect(() => {
    // Subscribe to real-time updates
    firebaseDB.subscribeTodos((updatedTodos) => {
      queryClient.setQueryData(["/api/todos"], updatedTodos);
    });
  }, [queryClient]);

  const activeTodos = todos.filter((todo) => !todo.completed).length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-3xl space-y-8 pt-12">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-4xl font-bold text-transparent sm:text-6xl">
              Listor
            </h1>
            <p className="mt-4 text-muted-foreground">
              A simple, modern todo application
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={signOut}
            className="ml-4"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <AddTodo />

        <div className="flex items-end justify-end">
          <span className="text-sm text-muted-foreground">
            {activeTodos} item{activeTodos !== 1 ? "s" : ""} left
          </span>
        </div>

        <TodoList todos={todos} isLoading={isLoading} />
      </div>
    </div>
  );
}