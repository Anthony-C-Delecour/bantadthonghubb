import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const currentLang = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <span className="text-lg">{currentLang?.flag || "🌐"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background z-[1000]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              language === lang.code && "bg-primary/10"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="flex-1">
              <span className="font-medium">{lang.name}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                {lang.nativeName}
              </span>
            </div>
            {language === lang.code && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
