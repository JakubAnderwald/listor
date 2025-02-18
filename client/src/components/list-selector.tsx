import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListSchema, type List } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { firebaseDB } from "@/lib/firebase";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ListSelectorProps {
  lists: List[];
  selectedListId: number | null;
  onListSelect: (listId: number | null) => void;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  filterCounts: Record<string, number>;
}

export default function ListSelector({
  lists,
  selectedListId,
  onListSelect,
  currentFilter,
  onFilterChange,
  filterCounts,
}: ListSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<List | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertListSchema),
    defaultValues: {
      name: "",
      color: "#000000",
    },
  });

  const createList = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      await firebaseDB.createList(data);
    },
    onSuccess: () => {
      setIsOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create list", variant: "destructive" });
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: number) => {
      await firebaseDB.deleteList(id);
    },
    onSuccess: () => {
      setListToDelete(null);
      if (selectedListId === listToDelete?.id) {
        onListSelect(null);
      }
      toast({ title: "List deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete list", variant: "destructive" });
    },
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'today', label: 'Today' },
    { id: 'next7days', label: 'Next 7 Days' }
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2">
        <span className="text-sm font-medium px-2 py-1.5">Filters</span>
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={currentFilter === filter.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
              currentFilter === filter.id && "bg-primary"
            )}
            onClick={() => onFilterChange(filter.id)}
          >
            <span className="flex-1 text-left">{filter.label}</span>
            <span className="text-sm text-muted-foreground">
              ({filterCounts[filter.id]})
            </span>
          </Button>
        ))}
      </div>

      <hr className="border-border" />

      {/* Lists */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">Lists</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new list</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createList.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="List name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createList.isPending}>
                    Create List
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-1">
          {lists.map((list) => (
            <div key={list.id} className="flex items-center gap-2">
              <Button
                variant={selectedListId === list.id ? "default" : "ghost"}
                className={cn(
                  "flex-1 justify-start",
                  selectedListId === list.id && "bg-primary"
                )}
                onClick={() => onListSelect(list.id)}
              >
                <div
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <span className="flex-1 text-left">{list.name}</span>
              </Button>
              {list.name !== "Inbox" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setListToDelete(list)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!listToDelete} onOpenChange={() => setListToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{listToDelete?.name}"? All tasks in this list will be moved to Inbox.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setListToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => listToDelete && deleteList.mutate(listToDelete.id)}
              disabled={deleteList.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}