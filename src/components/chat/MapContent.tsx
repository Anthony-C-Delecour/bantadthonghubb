import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { RestaurantCard } from "@/types/chat";
import { mockRestaurants } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Navigation, Star, X } from "lucide-react";

// Fix for default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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

const createUserIcon = () =>
  L.divIcon({
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
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([13.742, 100.5272]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantCard | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(userLocation || null);

  // Find selected restaurant from props
  useEffect(() => {
    if (!selectedRestaurantId) return;
    const r = mockRestaurants.find((x) => x.id === selectedRestaurantId);
    if (!r) return;
    setSelectedRestaurant(r);
    setMapCenter([r.lat, r.lng]);
  }, [selectedRestaurantId]);

  // Determine user location (or default)
  useEffect(() => {
    if (userLocation) {
      setUserPos(userLocation);
      return;
    }

    if (!navigator.geolocation) {
      setUserPos({ lat: 13.7415, lng: 100.5265 });
      return;
    }

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
      () => setUserPos({ lat: 13.7415, lng: 100.5265 })
    );
  }, [userLocation]);

  const routeLatLngs = useMemo(() => {
    if (!showRoute || !userPos || !selectedRestaurant) return null;
    return [
      L.latLng(userPos.lat, userPos.lng),
      L.latLng(selectedRestaurant.lat, selectedRestaurant.lng),
    ];
  }, [showRoute, userPos, selectedRestaurant]);

  // Init map once
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView(mapCenter, 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep map centered
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(mapCenter, map.getZoom(), { duration: 0.5 });
  }, [mapCenter]);

  // Render / update restaurant markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // create markers once
    mockRestaurants.forEach((r) => {
      if (markersRef.current[r.id]) return;

      const marker = L.marker([r.lat, r.lng], {
        icon: createRestaurantIcon(selectedRestaurant?.id === r.id, r.waitTime),
      })
        .addTo(map)
        .on("click", () => {
          setSelectedRestaurant(r);
          setMapCenter([r.lat, r.lng]);
          if (onRestaurantSelect) onRestaurantSelect(r);
        });

      marker.bindPopup(`
        <div style="min-width: 200px">
          <div style="font-weight: 600; font-size: 14px">${r.name}</div>
          <div style="font-size: 12px; opacity: .75">${r.cuisine}</div>
          <div style="margin-top: 8px; font-size: 12px">⭐ ${r.rating} (${r.reviewCount})</div>
          <div style="margin-top: 4px; font-size: 12px; opacity: .75">⏱ ${r.waitTime} min • ${r.bahtTier}</div>
        </div>
      `);

      markersRef.current[r.id] = marker;
    });

    // update icons when selection changes
    mockRestaurants.forEach((r) => {
      const m = markersRef.current[r.id];
      if (!m) return;
      m.setIcon(createRestaurantIcon(selectedRestaurant?.id === r.id, r.waitTime));
    });
  }, [onRestaurantSelect, selectedRestaurant?.id]);

  // Render / update user marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: createUserIcon() })
        .addTo(map)
        .bindPopup('<div style="font-size: 12px; font-weight: 600">📍 You are here</div>');
    } else {
      userMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
    }
  }, [userPos]);

  // Render / update route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!routeLatLngs) {
      if (routeRef.current) {
        routeRef.current.remove();
        routeRef.current = null;
      }
      return;
    }

    if (!routeRef.current) {
      routeRef.current = L.polyline(routeLatLngs, {
        color: "hsl(38, 92%, 50%)",
        weight: 4,
        opacity: 0.8,
        dashArray: "10, 10",
      }).addTo(map);
    } else {
      routeRef.current.setLatLngs(routeLatLngs);
    }
  }, [routeLatLngs]);

  return (
    <div className={cn("relative rounded-2xl overflow-hidden border border-border", className)}>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 z-[1000] bg-background/90 backdrop-blur-sm hover:bg-background"
          aria-label="Close map"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div ref={mapElRef} style={{ height: "100%", width: "100%", minHeight: "400px" }} />

      {selectedRestaurant && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border">
          <div className="flex items-start gap-3">
            <img
              src={selectedRestaurant.image}
              alt={`${selectedRestaurant.name} Bantadthong restaurant`}
              className="w-16 h-16 rounded-xl object-cover"
              loading="lazy"
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
            <Button size="sm" className="flex items-center gap-1.5" type="button">
              <Navigation className="h-4 w-4" />
              Route
            </Button>
          </div>
        </div>
      )}

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
