import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, MicOff, Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showLocationContext?: boolean;
  onClearLocation?: () => void;
}

export function ChatInput({ 
  onSend, 
  isLoading, 
  disabled,
  placeholder,
  showLocationContext = true,
  onClearLocation
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording would be implemented here
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Location Context Badge */}
      {showLocationContext && (
        <div className="flex items-center justify-center mb-2">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <MapPin className="h-3 w-3" />
            <span>{t("bantadthongDistrict")}</span>
            {onClearLocation && (
              <button 
                onClick={onClearLocation}
                className="hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className={cn(
        "chat-input-container flex items-end gap-2 p-2",
        disabled && "opacity-50"
      )}>
        {/* Voice Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleRecording}
          disabled={disabled || isLoading}
          className={cn(
            "h-9 w-9 rounded-xl shrink-0",
            isRecording && "bg-destructive/10 text-destructive"
          )}
        >
          {isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>

        {/* Text Input */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t("messagePlaceholder")}
          disabled={disabled || isLoading}
          className="min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 px-1 text-base"
          rows={1}
        />

        {/* Send Button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading || disabled}
          className={cn(
            "h-9 w-9 rounded-xl shrink-0 transition-all duration-200",
            input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span>{t("listening")}</span>
          </div>
        </div>
      )}
    </div>
  );
}