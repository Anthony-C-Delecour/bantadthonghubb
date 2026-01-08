import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { LiveNotifications } from "@/components/chat/LiveNotification";
import { BantadthongMap } from "@/components/chat/BantadthongMap";
import { PolaroidMode } from "@/components/chat/PolaroidMode";
import { ItineraryMode } from "@/components/chat/ItineraryMode";
import { LandmarkMode } from "@/components/chat/LandmarkMode";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/hooks/use-toast";
import { mockRestaurants } from "@/data/mockData";
import { RestaurantCard } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Chat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

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

  // Only create initial session on first mount
  useEffect(() => {
    const isInitialLoad = sessions.length === 0 && !currentSessionId;
    if (isInitialLoad) {
      const hasUserInteracted = sessionStorage.getItem("hubb_user_interacted");
      if (!hasUserInteracted) {
        createNewSession();
        sessionStorage.setItem("hubb_user_interacted", "true");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("hubb_user");
    sessionStorage.removeItem("hubb_user_interacted");
    toast({
      title: t("signedOut"),
      description: t("seeYouNextTime"),
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

  const handleRestaurantClick = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setShowMap(true);
    const restaurant = mockRestaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      toast({
        title: `📍 ${restaurant.name}`,
        description: `${restaurant.waitTime} ${t("minWait")} • ${restaurant.distance} ${t("away")}`,
      });
    }
  };

  const handleMapRestaurantSelect = (restaurant: RestaurantCard) => {
    setSelectedRestaurantId(restaurant.id);
  };

  // Render mode-specific content
  const renderModeContent = () => {
    switch (currentMode) {
      case "polaroid":
        return (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <PolaroidMode />
          </div>
        );
      case "itinerary":
        return (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="lg:w-1/2 overflow-y-auto border-r border-border">
              <ItineraryMode 
                onSelectRestaurant={handleRestaurantClick}
              />
            </div>
            <div className="lg:w-1/2 h-64 lg:h-full">
              <BantadthongMap
                selectedRestaurantId={selectedRestaurantId}
                onRestaurantSelect={handleMapRestaurantSelect}
                showRoute={true}
                className="h-full rounded-none"
              />
            </div>
          </div>
        );
      case "landmark":
        return (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="lg:w-1/2 overflow-y-auto">
              <LandmarkMode
                selectedLandmarkId={selectedLandmarkId}
                onSelectLandmark={(id) => setSelectedLandmarkId(id)}
              />
            </div>
            <div className="lg:w-1/2 h-64 lg:h-full border-l border-border">
              <BantadthongMap
                selectedLandmarkId={selectedLandmarkId}
                showRoute={true}
                showLandmarks={true}
                className="h-full rounded-none"
              />
            </div>
          </div>
        );
      default:
        // Chat mode - show map as overlay when restaurant is selected
        return (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            <div className={cn(
              "flex-1 flex flex-col",
              showMap && !isMobile && "lg:w-1/2"
            )}>
              <ChatInterface
                session={currentSession}
                isLoading={isLoading}
                currentMode={currentMode}
                onSendMessage={sendMessage}
                onNewChat={handleNewChat}
                onToggleSidebar={handleToggleSidebar}
                onLogout={handleLogout}
                onRestaurantClick={handleRestaurantClick}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            </div>
            
            {/* Map Panel */}
            {showMap && (
              <>
                {/* Mobile: Full screen overlay */}
                {isMobile ? (
                  <div className="fixed inset-0 z-50 bg-background">
                    <BantadthongMap
                      selectedRestaurantId={selectedRestaurantId}
                      onRestaurantSelect={handleMapRestaurantSelect}
                      showRoute={true}
                      onClose={() => setShowMap(false)}
                      className="h-full rounded-none"
                    />
                  </div>
                ) : (
                  /* Desktop: Side panel */
                  <div className="lg:w-1/2 h-full border-l border-border animate-fade-in">
                    <BantadthongMap
                      selectedRestaurantId={selectedRestaurantId}
                      onRestaurantSelect={handleMapRestaurantSelect}
                      showRoute={true}
                      onClose={() => setShowMap(false)}
                      className="h-full rounded-none"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-background">
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

      {/* Main Content Area */}
      {renderModeContent()}

      {/* Live Notifications */}
      <LiveNotifications />
    </div>
  );
}