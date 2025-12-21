import { useState, useEffect, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Camera, Check } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserData {
  username: string;
  displayName?: string;
  profilePicture?: string;
  accountType: "user" | "business";
  consent: boolean;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");

  useEffect(() => {
    if (open) {
      const storedUser = localStorage.getItem("hubb_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserData({
          ...parsed,
          displayName: parsed.displayName || parsed.username,
          accountType: parsed.accountType || "user",
        });
        setEditDisplayName(parsed.displayName || parsed.username);
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

    const updatedUser = { 
      ...userData, 
      username: editUsername.trim(),
      displayName: editDisplayName.trim() || editUsername.trim(),
    };
    localStorage.setItem("hubb_user", JSON.stringify(updatedUser));
    setUserData(updatedUser as UserData);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const updatedUser = { ...userData, profilePicture: base64 };
        localStorage.setItem("hubb_user", JSON.stringify(updatedUser));
        setUserData(updatedUser as UserData);
        toast({
          title: "Profile picture updated",
        });
      };
      reader.readAsDataURL(file);
    }
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
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {userData.profilePicture ? (
                    <AvatarImage src={userData.profilePicture} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(userData.displayName || userData.username)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-secondary rounded-full border border-border hover:bg-secondary/80 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Enter display name"
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditDisplayName(userData.displayName || userData.username);
                      setEditUsername(userData.username);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Display Name</Label>
                  <p className="text-sm font-medium">{userData.displayName || userData.username}</p>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Username</Label>
                  <p className="text-sm font-medium">@{userData.username}</p>
                </div>

                {/* Account Type */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Account Type</Label>
                  <p className="text-sm font-medium capitalize">{userData.accountType || "User"}</p>
                </div>

                {/* Data Sharing Status */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Data Sharing</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-notification" />
                      <span>Data sharing enabled</span>
                      <Check className="h-4 w-4 text-notification" />
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  Edit Profile
                </Button>
              </div>
            )}
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
