import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { LiveNotifications } from "@/components/chat/LiveNotification";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const {
    sessions,
    currentSession,
    currentSessionId,
    isLoading,
    currentMode,
    createNewSession,
    sendMessage,
    deleteSession,
    switchSession,
    switchMode,
  } = useChat();

  // Check auth
  useEffect(() => {
    const user = localStorage.getItem("hubb_user");
    if (!user) {
      navigate("/");
      return;
    }
  }, [navigate]);

  // Handle responsive
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setShowMobileSidebar(false);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Create initial session
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, [sessions.length, createNewSession]);

  const handleLogout = () => {
    localStorage.removeItem("hubb_user");
    toast({
      title: "Signed out",
      description: "See you next time!",
    });
    navigate("/");
  };

  const handleNewChat = () => {
    createNewSession(currentMode);
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  const handleSelectSession = (id: string) => {
    switchSession(id);
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  const handleToggleSidebar = () => {
    if (isMobile) {
      setShowMobileSidebar(!showMobileSidebar);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-foreground/20 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`
          : ''
        }
      `}>
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          currentMode={currentMode}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={deleteSession}
          onModeChange={switchMode}
          isCollapsed={!isMobile && isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Main Chat Area */}
      <ChatInterface
        session={currentSession}
        isLoading={isLoading}
        currentMode={currentMode}
        onSendMessage={sendMessage}
        onNewChat={handleNewChat}
        onToggleSidebar={handleToggleSidebar}
        onLogout={handleLogout}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Live Notifications */}
      <LiveNotifications />
    </div>
  );
}
