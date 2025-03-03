import { useState } from "react";
import { Plus, Trash2, Share2, Users } from "lucide-react";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface ListSelectorProps {
  lists: List[];
  selectedListId: number | null;
  onListSelect: (listId: number | null) => void;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  filterCounts: Record<string, number>;
}

const shareFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ShareFormValues = z.infer<typeof shareFormSchema>;

export default function ListSelector({
  lists,
  selectedListId,
  onListSelect,
  currentFilter,
  onFilterChange,
  filterCounts,
}: ListSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isManageShareOpen, setIsManageShareOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<List | null>(null);
  const [listToShare, setListToShare] = useState<List | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertListSchema),
    defaultValues: {
      name: "",
      color: "#000000",
    },
  });

  const shareForm = useForm({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      email: "",
    },
  });

  // Query shared users for the selected list
  const { data: sharedUsers = [] } = useQuery({
    queryKey: ["sharedUsers", listToShare?.id],
    queryFn: () =>
      listToShare
        ? firebaseDB.getSharedUsers(listToShare.id)
        : Promise.resolve([]),
    enabled: !!listToShare,
  });

  const createList = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      await firebaseDB.createList({
        ...data,
        sharedCount: 0, // Add the required sharedCount property
      });
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

  const shareList = useMutation({
    mutationFn: async ({ listId, email }: { listId: number; email: string }) => {
      await firebaseDB.shareList(listId, email);
    },
    onSuccess: () => {
      setIsShareOpen(false);
      setListToShare(null);
      shareForm.reset();
      toast({ title: "List shared successfully" });
    },
    onError: () => {
      toast({ title: "Failed to share list", variant: "destructive" });
    },
  });

  const unshareList = useMutation({
    mutationFn: async ({ listId, email }: { listId: number; email: string }) => {
      await firebaseDB.unshareList(listId, email);
    },
    onSuccess: () => {
      toast({ title: "User removed from shared list" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filters = [
    { id: "today", label: "Today" },
    { id: "next7days", label: "Next 7 Days" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-sm font-medium">Lists & Views</span>
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
        {lists.map((list) =>
          list.name === "Inbox" && (
            <div key={list.id} className="flex items-center gap-2">
              <Button
                variant={selectedListId === list.id ? "default" : "ghost"}
                className={cn(
                  "flex-1 justify-start",
                  selectedListId === list.id && "bg-primary"
                )}
                onClick={() => {
                  if (selectedListId !== list.id) {
                    onListSelect(list.id);
                  }
                }}
              >
                <div
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <span className="flex-1 text-left">{list.name}</span>
              </Button>
            </div>
          )
        )}

        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={
              selectedListId === null && currentFilter === filter.id
                ? "default"
                : "ghost"
            }
            className={cn(
              "w-full justify-start",
              selectedListId === null &&
                currentFilter === filter.id &&
                "bg-primary"
            )}
            onClick={() => {
              if (selectedListId !== null || currentFilter !== filter.id) {
                onListSelect(null);
                onFilterChange(filter.id);
              }
            }}
          >
            <span className="flex-1 text-left">{filter.label}</span>
            <span className="text-sm text-muted-foreground">
              ({filterCounts[filter.id]})
            </span>
          </Button>
        ))}

        {lists
          .filter((list) => list.name !== "Inbox")
          .map((list) => (
            <div key={list.id} className="flex items-center gap-2">
              <Button
                variant={selectedListId === list.id ? "default" : "ghost"}
                className={cn(
                  "flex-1 justify-start",
                  selectedListId === list.id && "bg-primary"
                )}
                onClick={() => {
                  if (selectedListId !== list.id) {
                    onListSelect(list.id);
                  }
                }}
              >
                <div
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <span className="flex-1 text-left">{list.name}</span>
                {list.sharedBy && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Shared)
                  </span>
                )}
              </Button>
              {!list.sharedBy && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setListToShare(list);
                      setIsShareOpen(true);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {list.sharedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                      onClick={() => {
                        setListToShare(list);
                        setIsManageShareOpen(true);
                      }}
                    >
                      <Users className="h-4 w-4" />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {list.sharedCount}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setListToDelete(list)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        }
      </div>

      <Dialog open={!!listToDelete} onOpenChange={() => setListToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{listToDelete?.name}"? All tasks
              in this list will be moved to Inbox.
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

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share List</DialogTitle>
            <DialogDescription>
              Enter the email address of the user you want to share
              "{listToShare?.name}" with.
            </DialogDescription>
          </DialogHeader>
          <Form {...shareForm}>
            <form
              onSubmit={shareForm.handleSubmit((data) =>
                listToShare &&
                shareList.mutate({ listId: listToShare.id, email: data.email })
              )}
              className="space-y-4"
            >
              <FormField
                control={shareForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="user@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsShareOpen(false);
                    setListToShare(null);
                    shareForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={shareList.isPending}>
                  Share
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageShareOpen} onOpenChange={setIsManageShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Sharing</DialogTitle>
            <DialogDescription>
              Manage users who have access to "{listToShare?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {sharedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                This list hasn't been shared with anyone yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sharedUsers.map((email) => (
                  <div key={email} className="flex items-center justify-between">
                    <span className="text-sm">{email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        listToShare &&
                        unshareList.mutate({ listId: listToShare.id, email })
                      }
                      disabled={unshareList.isPending}
                    >
                      {unshareList.isPending ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsManageShareOpen(false);
                setListToShare(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}