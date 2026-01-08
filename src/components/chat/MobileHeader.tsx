import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, User, HelpCircle, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChatMode } from "@/types/chat";
import { HelpSupportDialog } from "./HelpSupportDialog";
import { ProfileDialog } from "./ProfileDialog";

interface MobileHeaderProps {
  currentMode: ChatMode;
  onToggleSidebar: () => void;
  onLogout: () => void;
  isSidebarCollapsed?: boolean;
}

export function MobileHeader({
  currentMode,
  onToggleSidebar,
  onLogout,
  isSidebarCollapsed,
}: MobileHeaderProps) {
  const { t } = useLanguage();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
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
              {currentMode === "chat" ? t("chatMode") : t(currentMode)}
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
    </>
  );
}
