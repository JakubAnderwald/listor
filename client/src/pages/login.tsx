import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const { signIn, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to home if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleSignIn = async () => {
    try {
      await signIn();
      setLocation("/");
    } catch (error) {
      toast({
        title: "Failed to sign in",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-1/2 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">Welcome to Listor</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to manage your todos
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="mr-2 h-4 w-4"
              />
            )}
            Sign in with Google
          </Button>
        </div>
      </div>

      <div className="hidden w-1/2 bg-muted lg:block">
        <div className="flex h-full flex-col items-center justify-center space-y-8 p-8">
          <h2 className="text-3xl font-bold">Organize your life</h2>
          <p className="max-w-md text-center text-muted-foreground">
            Listor helps you stay organized and productive. Create, manage, and
            track your todos all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
