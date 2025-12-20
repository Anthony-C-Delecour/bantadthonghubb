import { Message } from "@/types/chat";
import { RestaurantCardDisplay } from "./RestaurantCardDisplay";
import { cn } from "@/lib/utils";
import { HubbLogo } from "@/components/HubbLogo";
import { User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div 
      className={cn(
        "flex gap-3 px-4 py-4",
        isUser ? "flex-row-reverse" : "flex-row",
        isLatest && "animate-fade-in"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary" : "bg-card border border-border"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <span className="text-xs font-bold">.H</span>
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-2 max-w-[75%]", isUser && "items-end")}>
        <div className={cn(
          "message-bubble",
          isUser ? "message-bubble-user" : "message-bubble-bot"
        )}>
          <div className="prose prose-sm max-w-none">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className={cn("my-1", i === 0 && "mt-0", !line && "h-2")}>
                {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </p>
            ))}
          </div>
        </div>

        {/* Restaurant Card */}
        {message.restaurantCard && (
          <RestaurantCardDisplay 
            restaurant={message.restaurantCard}
            className="w-72 mt-2"
          />
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
