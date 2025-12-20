import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserData {
  username: string;
  consent: boolean;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");

  useEffect(() => {
    if (open) {
      const storedUser = localStorage.getItem("hubb_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
        setEditUsername(parsed.username);
      }
    }
  }, [open]);

  const handleSave = () => {
    if (!editUsername.trim()) {
      toast({
        title: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const updatedUser = { ...userData, username: editUsername.trim() };
    localStorage.setItem("hubb_user", JSON.stringify(updatedUser));
    setUserData(updatedUser as UserData);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your username has been updated.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            View and manage your account information.
          </DialogDescription>
        </DialogHeader>

        {userData && (
          <div className="space-y-6 py-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials(userData.username)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Username Section */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    id="username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                  <Button onClick={handleSave} size="sm">
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditUsername(userData.username);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{userData.username}</span>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Consent Status */}
            <div className="space-y-2">
              <Label>Data Consent</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div
                  className={`w-2 h-2 rounded-full ${
                    userData.consent ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {userData.consent
                  ? "You've agreed to share data to improve the chatbot"
                  : "Data sharing not enabled"}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
