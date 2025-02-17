import TodoList from "@/components/todo-list";
import AddTodo from "@/components/add-todo";
import ListSelector from "@/components/list-selector";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Todo, type List } from "@shared/schema";
import { useEffect, useState } from "react";
import { firebaseDB } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export default function Home() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  const { data: todos = [], isLoading: isLoadingTodos } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
    initialData: [],
  });

  const { data: lists = [], isLoading: isLoadingLists } = useQuery<List[]>({
    queryKey: ["lists"],
    initialData: [],
  });

  const { data: profile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => firebaseDB.getUserProfile(),
    enabled: !!user,
  });

  useEffect(() => {
    // Subscribe to real-time updates for todos and lists
    const unsubscribeTodos = firebaseDB.subscribeTodos((updatedTodos) => {
      queryClient.setQueryData(["/api/todos"], updatedTodos);
    });

    const unsubscribeLists = firebaseDB.subscribeLists((updatedLists) => {
      queryClient.setQueryData(["lists"], updatedLists);
    });

    return () => {
      unsubscribeTodos();
      unsubscribeLists();
    };
  }, [queryClient]);

  // Filter todos based on selected list
  const filteredTodos = selectedListId
    ? todos.filter((todo) => todo.listId === selectedListId)
    : todos;

  const isLoading = isLoadingTodos || isLoadingLists;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-4xl font-bold text-transparent">
            Listor
          </h1>
          {profile && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{profile.displayName}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <Avatar>
                <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                <AvatarFallback>
                  {profile.displayName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AddTodo />
          <div className="grid grid-cols-[250px_1fr] gap-6">
            <ListSelector
              lists={lists}
              selectedListId={selectedListId}
              onListSelect={setSelectedListId}
            />
            <TodoList
              todos={filteredTodos}
              isLoading={isLoading}
              showFilters
            />
          </div>
        </div>
      </div>
    </div>
  );
}