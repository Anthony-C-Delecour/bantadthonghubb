import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RestaurantCard } from "@/types/chat";
import { mockRestaurants } from "@/data/mockData";
import { Star, Clock, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom restaurant marker icon
const createRestaurantIcon = (isSelected: boolean, waitTime: number) => {
  const color = waitTime <= 15 ? "#22c55e" : waitTime <= 30 ? "#f59e0b" : "#ef4444";
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: ${isSelected ? "36px" : "28px"};
        height: ${isSelected ? "36px" : "28px"};
        background: ${isSelected ? "hsl(38, 92%, 50%)" : color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <span style="color: white; font-size: ${isSelected ? "14px" : "11px"}; font-weight: bold;">
          🍽️
        </span>
      </div>
    `,
    iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
    iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
  });
};

// User location marker
const userIcon = L.divIcon({
  className: "user-marker",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to handle map center changes
function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 0.5 });
    }
  }, [center, zoom, map]);
  return null;
}

interface MapContentProps {
  selectedRestaurantId?: string | null;
  onRestaurantSelect?: (restaurant: RestaurantCard) => void;
  showRoute?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  onClose?: () => void;
}

export default function MapContent({
  selectedRestaurantId,
  onRestaurantSelect,
  showRoute = false,
  userLocation,
  className,
  onClose,
}: MapContentProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.7420, 100.5272]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantCard | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(userLocation || null);

  // Get user location
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (lat > 13.5 && lat < 14.0 && lng > 100.3 && lng < 100.8) {
            setUserPos({ lat, lng });
          } else {
            setUserPos({ lat: 13.7415, lng: 100.5265 });
          }
        },
        () => {
          setUserPos({ lat: 13.7415, lng: 100.5265 });
        }
      );
    }
  }, [userLocation]);

  // Handle selected restaurant from props
  useEffect(() => {
    if (selectedRestaurantId) {
      const restaurant = mockRestaurants.find((r) => r.id === selectedRestaurantId);
      if (restaurant) {
        setSelectedRestaurant(restaurant);
        setMapCenter([restaurant.lat, restaurant.lng]);
      }
    }
  }, [selectedRestaurantId]);

  const handleMarkerClick = (restaurant: RestaurantCard) => {
    setSelectedRestaurant(restaurant);
    setMapCenter([restaurant.lat, restaurant.lng]);
    if (onRestaurantSelect) {
      onRestaurantSelect(restaurant);
    }
  };

  // Calculate simple route
  const getRoutePath = (): [number, number][] => {
    if (!userPos || !selectedRestaurant) return [];
    return [
      [userPos.lat, userPos.lng],
      [selectedRestaurant.lat, selectedRestaurant.lng],
    ];
  };

  return (
    <div className={cn("relative rounded-2xl overflow-hidden border border-border", className)}>
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 z-[1000] bg-background/90 backdrop-blur-sm hover:bg-background"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <MapContainer
        center={mapCenter}
        zoom={16}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} />

        {/* User location marker */}
        {userPos && (
          <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
            <Popup>
              <div className="text-sm font-medium">📍 You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Restaurant markers */}
        {mockRestaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.lat, restaurant.lng]}
            icon={createRestaurantIcon(
              selectedRestaurant?.id === restaurant.id,
              restaurant.waitTime
            )}
            eventHandlers={{
              click: () => handleMarkerClick(restaurant),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-base">{restaurant.name}</h3>
                <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>{restaurant.rating}</span>
                  <span className="text-muted-foreground">({restaurant.reviewCount})</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {restaurant.waitTime} min
                  </span>
                  <span>{restaurant.bahtTier}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route line */}
        {showRoute && selectedRestaurant && userPos && (
          <Polyline
            positions={getRoutePath()}
            color="hsl(38, 92%, 50%)"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Selected Restaurant Panel */}
      {selectedRestaurant && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border">
          <div className="flex items-start gap-3">
            <img
              src={selectedRestaurant.image}
              alt={selectedRestaurant.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{selectedRestaurant.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedRestaurant.cuisine}</p>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  {selectedRestaurant.rating}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedRestaurant.waitTime} min wait
                </span>
                <span className="text-muted-foreground">{selectedRestaurant.bahtTier}</span>
              </div>
            </div>
            <Button size="sm" className="flex items-center gap-1.5">
              <Navigation className="h-4 w-4" />
              Route
            </Button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>{"<15 min wait"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>15-30 min</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>{">30 min wait"}</span>
        </div>
      </div>
    </div>
  );
}