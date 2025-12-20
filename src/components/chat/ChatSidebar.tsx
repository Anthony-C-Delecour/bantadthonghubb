import { useState } from "react";
import { ChatSession, ChatMode } from "@/types/chat";
import { HubbLogo } from "@/components/HubbLogo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Plus,
  Map,
  Landmark,
  Camera,
  MoreHorizontal,
  X,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentMode: ChatMode;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onModeChange: (mode: ChatMode) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const modes = [
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "itinerary" as const, label: "Itinerary", icon: Map },
  { id: "landmark" as const, label: "Landmarks", icon: Landmark },
  { id: "polaroid" as const, label: "Polaroid", icon: Camera },
];

export function ChatSidebar({
  sessions,
  currentSessionId,
  currentMode,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onModeChange,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (isCollapsed) {
    return (
      <div className="w-16 h-full bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Plus className="h-5 w-5" />
        </Button>

        <div className="w-8 h-px bg-sidebar-border my-2" />

        {modes.map((mode) => (
          <Button
            key={mode.id}
            variant="ghost"
            size="icon"
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent",
              currentMode === mode.id && "bg-sidebar-accent text-sidebar-primary"
            )}
          >
            <mode.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="w-72 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <HubbLogo size="sm" showSubtitle subtitle="BanTadThong.Hubb" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Modes */}
        <div className="p-3 border-b border-sidebar-border">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-2">MODES</p>
          <div className="space-y-1">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  "sidebar-item w-full",
                  currentMode === mode.id && "sidebar-item-active"
                )}
              >
                <mode.icon className="h-4 w-4" />
                <span className="text-sm">{mode.label}</span>
                {mode.id === "polaroid" && (
                  <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">New</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-hidden">
          <div className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">RECENT CHATS</p>
          </div>
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1 pb-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent chats available</p>
                  <p className="text-xs">Press "+ New Chat" to start!</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onMouseEnter={() => setHoveredSession(session.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    onClick={() => onSelectSession(session.id)}
                    className={cn(
                      "sidebar-item group relative",
                      currentSessionId === session.id && "sidebar-item-active"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{session.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(session.updatedAt)}</p>
                    </div>
                    {hoveredSession === session.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(session.id);
                        }}
                        className="absolute right-2 p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this chat session and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteSession(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
