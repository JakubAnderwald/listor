import { useState } from "react";
import { Plus } from "lucide-react";
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
}

export default function ListSelector({
  lists,
  selectedListId,
  onListSelect,
}: ListSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
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
        <Button
          variant={selectedListId === null ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => onListSelect(null)}
        >
          All Lists
        </Button>
        {lists.map((list) => (
          <Button
            key={list.id}
            variant={selectedListId === list.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
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
        ))}
      </div>
    </div>
  );
}
