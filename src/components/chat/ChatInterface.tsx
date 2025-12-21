import { useRef, useEffect, useState } from "react";
import { ChatSession, ChatMode } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { HubbLogo } from "@/components/HubbLogo";
import { Menu, User, HelpCircle, LogOut, Map, Landmark, Camera, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { HelpSupportDialog } from "./HelpSupportDialog";
import { ProfileDialog } from "./ProfileDialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

const promptSuggestionKeys = [
  "findRestaurantNoWait",
  "bestCheapEats", 
  "premiumSeafood",
  "somethingSpicy",
  "lateNightFood",
] as const;

interface ChatInterfaceProps {
  session: ChatSession | undefined;
  isLoading: boolean;
  currentMode: ChatMode;
  onSendMessage: (message: string) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onRestaurantClick?: (restaurantId: string) => void;
  isSidebarCollapsed: boolean;
}

const modeEmptyStates: Record<ChatMode, { icon: typeof Sparkles; titleKey: string; descriptionKey: string }> = {
  chat: {
    icon: Sparkles,
    titleKey: "startConversation",
    descriptionKey: "startConversationDesc",
  },
  itinerary: {
    icon: Map,
    titleKey: "planAdventure",
    descriptionKey: "planAdventureDesc",
  },
  landmark: {
    icon: Landmark,
    titleKey: "discoverLandmarks",
    descriptionKey: "discoverLandmarksDesc",
  },
  polaroid: {
    icon: Camera,
    titleKey: "createPolaroids",
    descriptionKey: "createPolaroidsDesc",
  },
};

export function ChatInterface({
  session,
  isLoading,
  currentMode,
  onSendMessage,
  onNewChat,
  onToggleSidebar,
  onLogout,
  onRestaurantClick,
  isSidebarCollapsed,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const emptyState = modeEmptyStates[currentMode];
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { t } = useLanguage();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {isSidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="hidden lg:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">
              {currentMode === "chat" ? t("chatMode") : t(`${currentMode}Mode`)}
            </span>
            {currentMode !== "chat" && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {t("active")}
              </span>
            )}
          </div>
        </div>

        {/* Language Selector & Profile Menu */}
        <div className="flex items-center gap-1">
          <LanguageSelector />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background z-[1000]">
              <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                <User className="h-4 w-4 mr-2" />
                {t("profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHelpDialogOpen(true)}>
                <HelpCircle className="h-4 w-4 mr-2" />
                {t("help")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Dialogs */}
      <HelpSupportDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {!session || session.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center animate-fade-in">
              <HubbLogo size="lg" className="mb-6" />
              
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <emptyState.icon className="h-12 w-12 mx-auto mb-4 text-primary opacity-80" />
                <h2 className="text-xl font-semibold mb-2">{t(emptyState.titleKey)}</h2>
                <p className="text-muted-foreground">{t(emptyState.descriptionKey)}</p>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap justify-center gap-2">
                {promptSuggestionKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => onSendMessage(t(key))}
                    className="text-sm px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full transition-colors border border-border/50"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {session.messages.map((message, index) => (
              <ChatMessage 
                key={message.id} 
                message={message}
                isLatest={index === session.messages.length - 1}
                onRestaurantClick={onRestaurantClick}
              />
            ))}
            
            {isLoading && (
              <div className="flex gap-3 px-4 py-4 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                  <span className="text-xs font-bold">.H</span>
                </div>
                <div className="message-bubble message-bubble-bot">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput 
        onSend={onSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
