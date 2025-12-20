import { useEffect, useState } from "react";
import { LiveNotification as NotificationType } from "@/types/chat";
import { generateMockNotifications } from "@/data/mockData";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveNotifications() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [currentNotification, setCurrentNotification] = useState<NotificationType | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initialize mock notifications
    const mockNotifications = generateMockNotifications();
    setNotifications(mockNotifications);

    // Show notifications periodically
    let currentIndex = 0;
    const showNotification = () => {
      if (currentIndex < mockNotifications.length) {
        setCurrentNotification(mockNotifications[currentIndex]);
        setIsVisible(true);
        currentIndex++;

        // Hide after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    };

    // Show first notification after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000);

    // Show subsequent notifications every 15-25 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 15000 + Math.random() * 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const formatTimeAgo = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} mins ago`;
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!currentNotification || !isVisible) return null;

  return (
    <div className={cn(
      "notification-toast max-w-sm",
      "animate-slide-up"
    )}>
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-primary">
            {currentNotification.userName.charAt(0)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{currentNotification.userName}</span>
            {currentNotification.rating && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: currentNotification.rating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-warning fill-warning" />
                ))}
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {currentNotification.type === "review" ? (
              <>
                left a review at <span className="font-medium text-foreground">{currentNotification.restaurantName}</span>
                {currentNotification.comment && (
                  <span className="block mt-1 italic">"{currentNotification.comment}"</span>
                )}
              </>
            ) : (
              <>
                just visited <span className="font-medium text-foreground">{currentNotification.restaurantName}</span>
              </>
            )}
          </p>
          
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {formatTimeAgo(currentNotification.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
