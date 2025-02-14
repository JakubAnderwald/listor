import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTodoSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { firebaseDB } from "@/lib/firebase";

export default function AddTodo() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertTodoSchema),
    defaultValues: {
      text: "",
      completed: false,
    },
  });

  const createTodo = useMutation({
    mutationFn: async (data: { text: string; completed: boolean }) => {
      await firebaseDB.createTodo(data);
    },
    onSuccess: () => {
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create todo", variant: "destructive" });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createTodo.mutate(data))}
        className="flex gap-2"
      >
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  placeholder="What needs to be done?"
                  {...field}
                  autoComplete="off"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createTodo.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add Todo
        </Button>
      </form>
    </Form>
  );
}