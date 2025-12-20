import { cn } from "@/lib/utils";

interface HubbLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  subtitle?: string;
}

const sizeMap = {
  sm: { text: "text-xl", eyes: 2, smile: 12 },
  md: { text: "text-2xl", eyes: 2.5, smile: 14 },
  lg: { text: "text-4xl", eyes: 3, smile: 18 },
  xl: { text: "text-6xl", eyes: 4, smile: 24 },
};

export function HubbLogo({ 
  className, 
  size = "md", 
  showSubtitle = false,
  subtitle = "BanTadThong.Hubb"
}: HubbLogoProps) {
  const config = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("font-bold tracking-tight flex items-baseline", config.text)}>
        <span className="text-foreground">.</span>
        <span className="text-foreground">H</span>
        <span className="relative inline-flex flex-col items-center">
          {/* Eyes above the u */}
          <svg 
            className="absolute -top-[0.3em]" 
            width={config.eyes * 6} 
            height={config.eyes * 2}
            viewBox="0 0 12 4"
          >
            <circle cx="3" cy="2" r="1.5" fill="currentColor" className="text-foreground" />
            <circle cx="9" cy="2" r="1.5" fill="currentColor" className="text-foreground" />
          </svg>
          {/* Nike-style curved smile u */}
          <svg 
            className="relative" 
            width={config.smile} 
            height={config.smile * 0.7}
            viewBox="0 0 24 16"
          >
            <path 
              d="M2 4 C2 12, 12 14, 22 8" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
              fill="none"
              className="text-foreground"
            />
            <line 
              x1="22" 
              y1="2" 
              x2="22" 
              y2="8" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
              className="text-foreground"
            />
          </svg>
        </span>
        <span className="text-foreground">bb</span>
      </div>
      {showSubtitle && subtitle && (
        <span className="text-xs text-muted-foreground mt-1 tracking-wide">
          {subtitle}
        </span>
      )}
    </div>
  );
}
