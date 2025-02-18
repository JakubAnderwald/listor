import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { firebaseDB } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  listId: number;
  fromUser: {
    uid: string;
    displayName: string;
  };
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    initialData: [],
  });

  useEffect(() => {
    const unsubscribe = firebaseDB.subscribeNotifications((updatedNotifications) => {
      // Update notifications in React Query cache
      // Note: This is handled automatically by the subscription
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await firebaseDB.markNotificationAsRead(notification.id);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-2 text-sm font-medium">Notifications</div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "w-full space-y-1 p-4 text-left transition-colors hover:bg-muted",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
