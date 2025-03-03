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
import { isWithinInterval, startOfDay, addDays, parseISO, isBefore } from "date-fns";
import { Notifications } from "@/components/notifications";

export default function Home() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>("all");

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
    const unsubscribeTodos = firebaseDB.subscribeTodos((updatedTodos) => {
      queryClient.setQueryData(["/api/todos"], updatedTodos);
    });

    const unsubscribeLists = firebaseDB.subscribeLists((updatedLists) => {
      queryClient.setQueryData(["lists"], updatedLists);
    });

    const setupInboxList = async () => {
      try {
        const existingInbox = await firebaseDB.getListByName("Inbox");

        if (!existingInbox) {
          await firebaseDB.createList({
            name: "Inbox",
            color: "#6366f1",
            sharedCount: 0
          });
          return;
        }

        const currentLists = queryClient.getQueryData<List[]>(["lists"]) || [];
        const allTodos = queryClient.getQueryData<Todo[]>(["/api/todos"]) || [];

        const orphanedTodos = allTodos.filter(todo =>
          !currentLists.some(list => list.id === todo.listId)
        );

        for (const todo of orphanedTodos) {
          await firebaseDB.updateTodo(todo.id, { listId: existingInbox.id });
        }
      } catch (error) {
        console.error('Error setting up Inbox list:', error);
      }
    };

    if (user) {
      setupInboxList();
    }

    return () => {
      unsubscribeTodos();
      unsubscribeLists();
    };
  }, [queryClient, user]);

  // Set Inbox as default when lists are loaded
  useEffect(() => {
    if (!isLoadingLists && lists.length > 0 && selectedListId === null) {
      const inboxList = lists.find(list => list.name === "Inbox");
      if (inboxList) {
        setSelectedListId(inboxList.id);
        setCurrentFilter("all");
      }
    }
  }, [isLoadingLists, lists, selectedListId]);

  const handleListSelect = (listId: number | null) => {
    setSelectedListId(listId);
    if (listId !== null) {
      setCurrentFilter("all");
    }
  };

  const filterTodos = () => {
    let filteredTodos = selectedListId
      ? todos.filter((todo) => todo.listId === selectedListId)
      : todos;

    const today = startOfDay(new Date());
    const in7Days = addDays(today, 7);

    switch (currentFilter) {
      case "today": {
        const overdueTodos = filteredTodos.filter(
          (todo) => todo.dueDate && isBefore(parseISO(todo.dueDate), today)
        );
        const todayTodos = filteredTodos.filter(
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
        const overdueTodos = filteredTodos.filter(
          (todo) => todo.dueDate && isBefore(parseISO(todo.dueDate), today)
        );
        const weekTodos = filteredTodos.filter(
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
        return filteredTodos;
    }
  };

  const getFilterCounts = () => {
    const today = startOfDay(new Date());
    const in7Days = addDays(today, 7);

    return {
      today: todos.filter(todo =>
        !todo.completed && todo.dueDate &&
        (isBefore(parseISO(todo.dueDate), today) ||
          isWithinInterval(parseISO(todo.dueDate), {
            start: today,
            end: addDays(today, 1),
          }))
      ).length,
      next7days: todos.filter(todo =>
        !todo.completed && todo.dueDate &&
        (isBefore(parseISO(todo.dueDate), today) ||
          isWithinInterval(parseISO(todo.dueDate), {
            start: today,
            end: in7Days,
          }))
      ).length,
    };
  };

  const getDefaultListId = () => {
    const inboxList = lists.find(list => list.name === "Inbox");
    return selectedListId ?? inboxList?.id ?? lists[0]?.id ?? 1;
  };

  const filteredTodos = filterTodos();
  const filterCounts = getFilterCounts();
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
              <Notifications />
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
          <AddTodo defaultListId={getDefaultListId()} />
          <div className="grid grid-cols-[250px_1fr] gap-6">
            <ListSelector
              lists={lists}
              selectedListId={selectedListId}
              onListSelect={handleListSelect}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              filterCounts={filterCounts}
            />
            <TodoList
              todos={filteredTodos}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}