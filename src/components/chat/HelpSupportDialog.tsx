import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Bug, MessageSquare, AlertTriangle, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type IssueType = "bug" | "feedback" | "wrong-data";

const issueTypes = [
  { id: "bug" as const, label: "Bug", icon: Bug, description: "Something isn't working" },
  { id: "feedback" as const, label: "Feedback", icon: MessageSquare, description: "Share your thoughts" },
  { id: "wrong-data" as const, label: "Wrong Data", icon: AlertTriangle, description: "Incorrect information" },
];

export function HelpSupportDialog({ open, onOpenChange }: HelpSupportDialogProps) {
  const { toast } = useToast();
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!issueType) {
      toast({
        title: "Please select an issue type",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Please describe the issue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Report submitted",
      description: "Thank you for your feedback! We'll look into it.",
    });

    // Reset form
    setIssueType(null);
    setDescription("");
    removeAttachment();
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setIssueType(null);
    setDescription("");
    removeAttachment();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            Let us know if you're experiencing any issues or have feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Issue Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What type of issue?</Label>
            <RadioGroup
              value={issueType || ""}
              onValueChange={(value) => setIssueType(value as IssueType)}
              className="grid grid-cols-3 gap-3"
            >
              {issueTypes.map((type) => (
                <div key={type.id}>
                  <RadioGroupItem
                    value={type.id}
                    id={type.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={type.id}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 cursor-pointer transition-all",
                      "hover:bg-accent hover:border-primary/50",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    )}
                  >
                    <type.icon className="h-5 w-5 mb-1.5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Tell us more</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue or share your feedback..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label>Attach a screenshot (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {attachmentPreview ? (
              <div className="relative rounded-lg border border-border overflow-hidden">
                <img
                  src={attachmentPreview}
                  alt="Attachment preview"
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={removeAttachment}
                  className="absolute top-2 right-2 p-1 bg-destructive rounded-full text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:border-primary/50 hover:bg-accent/50 transition-all"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload image
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
