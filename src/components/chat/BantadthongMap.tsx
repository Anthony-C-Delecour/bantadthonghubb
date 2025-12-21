import { Suspense, lazy, useEffect, useState } from "react";
import { RestaurantCard } from "@/types/chat";
import { cn } from "@/lib/utils";

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

  const Loading = (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center",
        className
      )}
      style={{ minHeight: "400px" }}
    >
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  );

  if (!isClient) return Loading;

  return (
    <Suspense fallback={Loading}>
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
