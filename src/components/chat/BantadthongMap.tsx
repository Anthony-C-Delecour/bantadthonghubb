import { Suspense, lazy, useEffect, useState } from "react";
import { RestaurantCard } from "@/types/chat";
import { cn } from "@/lib/utils";

const MapContent = lazy(() => import("./MapContent"));

interface BantadthongMapProps {
  selectedRestaurantId?: string | null;
  selectedLandmarkId?: string | null;
  onRestaurantSelect?: (restaurant: RestaurantCard) => void;
  onLandmarkSelect?: (landmarkId: string) => void;
  showRoute?: boolean;
  showLandmarks?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  onClose?: () => void;
}

export function BantadthongMap({
  selectedRestaurantId,
  selectedLandmarkId,
  onRestaurantSelect,
  onLandmarkSelect,
  showRoute = false,
  showLandmarks = false,
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
        selectedLandmarkId={selectedLandmarkId}
        onRestaurantSelect={onRestaurantSelect}
        onLandmarkSelect={onLandmarkSelect}
        showRoute={showRoute}
        showLandmarks={showLandmarks}
        userLocation={userLocation}
        className={className}
        onClose={onClose}
      />
    </Suspense>
  );
}
