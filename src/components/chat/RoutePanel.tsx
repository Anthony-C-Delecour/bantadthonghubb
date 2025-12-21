import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Bus, Clock, MapPin, Navigation, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type TransportMode = "walking" | "driving" | "transit";

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  type: string;
}

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
}

interface RoutePanelProps {
  destinationName: string;
  destinationAddress: string;
  routes: Record<TransportMode, RouteInfo | null>;
  selectedMode: TransportMode;
  onModeChange: (mode: TransportMode) => void;
  isLoading: boolean;
  onStartNavigation: () => void;
}

const transportModes: { mode: TransportMode; icon: typeof Car; label: string }[] = [
  { mode: "walking", icon: Footprints, label: "Walk" },
  { mode: "driving", icon: Car, label: "Drive" },
  { mode: "transit", icon: Bus, label: "Transit" },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function RoutePanel({
  destinationName,
  destinationAddress,
  routes,
  selectedMode,
  onModeChange,
  isLoading,
  onStartNavigation,
}: RoutePanelProps) {
  const [showSteps, setShowSteps] = useState(false);
  const currentRoute = routes[selectedMode];

  return (
    <div className="bg-background/95 backdrop-blur-sm border-t border-border p-4 space-y-4">
      {/* Destination Info */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{destinationName}</h3>
          <p className="text-sm text-muted-foreground truncate">{destinationAddress}</p>
        </div>
      </div>

      {/* Transport Mode Selector */}
      <div className="flex gap-2">
        {transportModes.map(({ mode, icon: Icon, label }) => {
          const route = routes[mode];
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={cn(
                "flex-1 p-3 rounded-xl border transition-all",
                selectedMode === mode
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mx-auto mb-1",
                selectedMode === mode ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="text-xs font-medium">{label}</div>
              {route && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDuration(route.duration)}
                </div>
              )}
              {isLoading && !route && (
                <div className="text-xs text-muted-foreground mt-1">...</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Route Summary */}
      {currentRoute && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">{formatDuration(currentRoute.duration)}</span>
              </div>
              <div className="text-muted-foreground">
                {formatDistance(currentRoute.distance)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSteps(!showSteps)}
              className="text-xs"
            >
              {showSteps ? (
                <>Hide Steps <ChevronUp className="h-3 w-3 ml-1" /></>
              ) : (
                <>Show Steps <ChevronDown className="h-3 w-3 ml-1" /></>
              )}
            </Button>
          </div>

          {/* Turn-by-turn Directions */}
          {showSteps && currentRoute.steps.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto border-t border-border pt-3">
              {currentRoute.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p>{step.instruction}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistance(step.distance)} • {formatDuration(step.duration)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Start Navigation Button */}
      <Button 
        onClick={onStartNavigation} 
        className="w-full"
        disabled={!currentRoute}
      >
        <Navigation className="h-4 w-4 mr-2" />
        Start Navigation
      </Button>
    </div>
  );
}
