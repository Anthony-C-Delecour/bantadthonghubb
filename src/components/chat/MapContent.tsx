import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { RestaurantCard } from "@/types/chat";
import { allRestaurants, mockLandmarksExpanded } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Navigation, Star, X, Footprints, Car, Bus, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fix for default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type TransportMode = "foot" | "car" | "transit";

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: [number, number][];
  steps: RouteStep[];
}

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

const createLandmarkIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: "landmark-marker",
    html: `
      <div style="
        width: ${isSelected ? "36px" : "28px"};
        height: ${isSelected ? "36px" : "28px"};
        background: ${isSelected ? "hsl(38, 92%, 50%)" : "#8b5cf6"};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="color: white; font-size: ${isSelected ? "14px" : "11px"}; font-weight: bold;">
          📍
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
  selectedLandmarkId?: string | null;
  onRestaurantSelect?: (restaurant: RestaurantCard) => void;
  onLandmarkSelect?: (landmarkId: string) => void;
  showRoute?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  onClose?: () => void;
  showLandmarks?: boolean;
}

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

// Parse OSRM instruction to human-readable text
function parseInstruction(step: { maneuver: { type: string; modifier?: string }; name?: string }): string {
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier || "";
  const name = step.name || "the road";

  const instructions: Record<string, string> = {
    depart: `Start on ${name}`,
    arrive: `Arrive at your destination`,
    turn: `Turn ${modifier} onto ${name}`,
    "new name": `Continue onto ${name}`,
    merge: `Merge onto ${name}`,
    "on ramp": `Take the ramp onto ${name}`,
    "off ramp": `Take the exit onto ${name}`,
    fork: `Keep ${modifier} at the fork onto ${name}`,
    "end of road": `At the end of the road, turn ${modifier} onto ${name}`,
    continue: `Continue on ${name}`,
    roundabout: `Take the roundabout onto ${name}`,
    rotary: `Take the rotary onto ${name}`,
    "roundabout turn": `At the roundabout, take the exit onto ${name}`,
    notification: `Note: ${name}`,
  };

  return instructions[type] || `Continue on ${name}`;
}

export default function MapContent({
  selectedRestaurantId,
  selectedLandmarkId,
  onRestaurantSelect,
  onLandmarkSelect,
  showRoute = false,
  userLocation,
  className,
  onClose,
  showLandmarks = false,
}: MapContentProps) {
  const { toast } = useToast();
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const landmarkMarkersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([13.742, 100.5272]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantCard | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<typeof mockLandmarksExpanded[0] | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(userLocation || null);
  
  const [transportMode, setTransportMode] = useState<TransportMode>("foot");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // Find selected restaurant from props
  useEffect(() => {
    if (!selectedRestaurantId) {
      setSelectedRestaurant(null);
      return;
    }
    const r = allRestaurants.find((x) => x.id === selectedRestaurantId);
    if (!r) return;
    setSelectedRestaurant(r);
    setSelectedLandmark(null);
    setMapCenter([r.lat, r.lng]);
  }, [selectedRestaurantId]);

  // Find selected landmark from props
  useEffect(() => {
    if (!selectedLandmarkId) {
      setSelectedLandmark(null);
      return;
    }
    const l = mockLandmarksExpanded.find((x) => x.id === selectedLandmarkId);
    if (!l) return;
    setSelectedLandmark(l);
    setSelectedRestaurant(null);
    setMapCenter([l.lat, l.lng]);
  }, [selectedLandmarkId]);

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

  // Fetch route from OSRM
  const fetchRoute = useCallback(async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    mode: TransportMode
  ) => {
    setIsLoadingRoute(true);
    try {
      // OSRM profile mapping
      const profile = mode === "car" ? "driving" : mode === "transit" ? "driving" : "foot";
      
      const url = `https://router.project-osrm.org/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = data.routes[0];
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] // Swap for Leaflet [lat, lng]
      );

      // Adjust duration for transit (simulated - add 10% for waiting times)
      let duration = route.duration;
      if (mode === "transit") {
        duration = duration * 1.1;
      }

      const steps: RouteStep[] = route.legs[0].steps.map((step: {
        maneuver: { type: string; modifier?: string };
        name?: string;
        distance: number;
        duration: number;
      }) => ({
        instruction: parseInstruction(step),
        distance: step.distance,
        duration: step.duration,
      }));

      setRouteInfo({
        distance: route.distance,
        duration: duration,
        coordinates,
        steps,
      });
    } catch (error) {
      console.error("Error fetching route:", error);
      toast({
        title: "Route Error",
        description: "Could not calculate route. Please try again.",
        variant: "destructive",
      });
      setRouteInfo(null);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [toast]);

  // Fetch route when destination or mode changes
  useEffect(() => {
    if (!showRoute || !userPos) return;
    
    const destination = selectedRestaurant || selectedLandmark;
    if (!destination) {
      setRouteInfo(null);
      return;
    }

    fetchRoute(userPos, { lat: destination.lat, lng: destination.lng }, transportMode);
  }, [showRoute, userPos, selectedRestaurant, selectedLandmark, transportMode, fetchRoute]);

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

    // Add zoom control to bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

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

    allRestaurants.forEach((r) => {
      if (markersRef.current[r.id]) {
        // Update icon
        markersRef.current[r.id].setIcon(createRestaurantIcon(selectedRestaurant?.id === r.id, r.waitTime));
        return;
      }

      const marker = L.marker([r.lat, r.lng], {
        icon: createRestaurantIcon(selectedRestaurant?.id === r.id, r.waitTime),
      })
        .addTo(map)
        .on("click", () => {
          setSelectedRestaurant(r);
          setSelectedLandmark(null);
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
  }, [onRestaurantSelect, selectedRestaurant?.id]);

  // Render / update landmark markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showLandmarks) return;

    mockLandmarksExpanded.forEach((l) => {
      if (landmarkMarkersRef.current[l.id]) {
        landmarkMarkersRef.current[l.id].setIcon(createLandmarkIcon(selectedLandmark?.id === l.id));
        return;
      }

      const marker = L.marker([l.lat, l.lng], {
        icon: createLandmarkIcon(selectedLandmark?.id === l.id),
      })
        .addTo(map)
        .on("click", () => {
          setSelectedLandmark(l);
          setSelectedRestaurant(null);
          setMapCenter([l.lat, l.lng]);
          if (onLandmarkSelect) onLandmarkSelect(l.id);
        });

      marker.bindPopup(`
        <div style="min-width: 200px">
          <div style="font-weight: 600; font-size: 14px">${l.name}</div>
          <div style="font-size: 12px; opacity: .75">${l.category}</div>
          <div style="margin-top: 8px; font-size: 12px">⭐ ${l.rating} (${l.reviewCount})</div>
        </div>
      `);

      landmarkMarkersRef.current[l.id] = marker;
    });
  }, [showLandmarks, onLandmarkSelect, selectedLandmark?.id]);

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

  // Render route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (!routeInfo || !routeInfo.coordinates.length) return;

    const routeColor = transportMode === "foot" ? "#22c55e" : transportMode === "car" ? "#3b82f6" : "#f59e0b";
    
    routeLayerRef.current = L.polyline(routeInfo.coordinates, {
      color: routeColor,
      weight: 5,
      opacity: 0.8,
    }).addTo(map);

    // Fit bounds to show entire route
    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
  }, [routeInfo, transportMode]);

  const handleStartNavigation = () => {
    const destination = selectedRestaurant || selectedLandmark;
    if (!destination) return;
    
    // Open in Google Maps for actual navigation
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=${transportMode === "foot" ? "walking" : transportMode === "car" ? "driving" : "transit"}`;
    window.open(url, "_blank");
  };

  const currentDestination = selectedRestaurant || selectedLandmark;

  return (
    <div className={cn("relative rounded-2xl overflow-hidden border border-border flex flex-col", className)}>
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

      <div ref={mapElRef} className="flex-1" style={{ minHeight: "300px" }} />

      {/* Legend */}
      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1 z-[500]">
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
        {showLandmarks && (
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span>Landmark</span>
          </div>
        )}
      </div>

      {/* Route Panel */}
      {currentDestination && showRoute && (
        <div className="bg-background/95 backdrop-blur-sm border-t border-border p-4 space-y-4">
          {/* Destination Info */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{currentDestination.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {"address" in currentDestination ? currentDestination.address : ""}
              </p>
            </div>
          </div>

          {/* Transport Mode Selector */}
          <div className="flex gap-2">
            {[
              { mode: "foot" as TransportMode, icon: Footprints, label: "Walk" },
              { mode: "car" as TransportMode, icon: Car, label: "Drive" },
              { mode: "transit" as TransportMode, icon: Bus, label: "Transit" },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setTransportMode(mode)}
                className={cn(
                  "flex-1 p-3 rounded-xl border transition-all",
                  transportMode === mode
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 mx-auto mb-1",
                  transportMode === mode ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="text-xs font-medium">{label}</div>
                {routeInfo && transportMode === mode && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDuration(routeInfo.duration)}
                  </div>
                )}
                {isLoadingRoute && transportMode === mode && (
                  <div className="text-xs text-muted-foreground mt-1">...</div>
                )}
              </button>
            ))}
          </div>

          {/* Route Summary */}
          {routeInfo && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{formatDuration(routeInfo.duration)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {formatDistance(routeInfo.distance)}
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
              {showSteps && routeInfo.steps.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto border-t border-border pt-3">
                  {routeInfo.steps.map((step, index) => (
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
            onClick={handleStartNavigation} 
            className="w-full"
            disabled={!routeInfo}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Start Navigation
          </Button>
        </div>
      )}

      {/* Simple info panel when not showing route */}
      {currentDestination && !showRoute && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border">
          <div className="flex items-start gap-3">
            {"image" in currentDestination && (
              <img
                src={currentDestination.image}
                alt={currentDestination.name}
                className="w-16 h-16 rounded-xl object-cover"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{currentDestination.name}</h3>
              <p className="text-sm text-muted-foreground">
                {"cuisine" in currentDestination ? currentDestination.cuisine : 
                 "category" in currentDestination ? currentDestination.category : ""}
              </p>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  {currentDestination.rating}
                </span>
                {"waitTime" in currentDestination && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {currentDestination.waitTime} min wait
                  </span>
                )}
              </div>
            </div>
            <Button size="sm" className="flex items-center gap-1.5" type="button">
              <Navigation className="h-4 w-4" />
              Route
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
