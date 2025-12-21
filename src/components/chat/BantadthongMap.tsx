import { useEffect, useState, lazy, Suspense } from "react";
import { RestaurantCard } from "@/types/chat";
import { mockRestaurants } from "@/data/mockData";
import { Star, Clock, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Lazy load the map to avoid SSR issues
const MapContent = lazy(() => import("./MapContent"));

interface BantadthongMapProps {
  selectedRestaurantId?: string | null;
  onRestaurantSelect?: (restaurant: RestaurantCard) => void;
  showRoute?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  onClose?: () => void;
}

export function BantadthongMap({
  selectedRestaurantId,
  onRestaurantSelect,
  showRoute = false,
  userLocation,
  className,
  onClose,
}: BantadthongMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={cn("relative rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center", className)} style={{ minHeight: "400px" }}>
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className={cn("relative rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center", className)} style={{ minHeight: "400px" }}>
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    }>
      <MapContent
        selectedRestaurantId={selectedRestaurantId}
        onRestaurantSelect={onRestaurantSelect}
        showRoute={showRoute}
        userLocation={userLocation}
        className={className}
        onClose={onClose}
      />
    </Suspense>
  );
}