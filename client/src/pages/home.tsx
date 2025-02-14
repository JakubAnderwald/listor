import TodoList from "@/components/todo-list";
import AddTodo from "@/components/add-todo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Todo } from "@shared/schema";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { firebaseDB } from "@/lib/firebase";

export default function Home() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const queryClient = useQueryClient();
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

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeTodos = todos.filter((todo) => !todo.completed).length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-3xl space-y-8 pt-12">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-bold text-transparent sm:text-6xl">
            Listor
          </h1>
          <p className="mt-4 text-muted-foreground">
            A simple, modern todo application
          </p>
        </div>

        <AddTodo />

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <span className="text-sm text-muted-foreground">
              {activeTodos} item{activeTodos !== 1 ? "s" : ""} left
            </span>
          </div>

          <TabsContent value={filter}>
            <TodoList todos={filteredTodos} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}