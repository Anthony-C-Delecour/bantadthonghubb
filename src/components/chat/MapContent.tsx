import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { RestaurantCard } from "@/types/chat";
import { allRestaurants, mockLandmarksExpanded } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Navigation, Star, X, Footprints, Car, Bus, ChevronDown, ChevronUp, MapPin, Locate, Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fix for default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Bantadthong area bounds - stricter focus
const BANTADTHONG_BOUNDS = {
  north: 13.7500,
  south: 13.7350,
  east: 100.5380,
  west: 100.5200,
};

const BANTADTHONG_CENTER = { lat: 13.7420, lng: 100.5272 };

// Bangkok transit lines near Bantadthong
const TRANSIT_LINES = [
  { name: "BTS Silom Line", color: "#008000", stations: ["National Stadium", "Siam", "Ratchadamri"] },
  { name: "BTS Sukhumvit Line", color: "#7CB342", stations: ["Siam", "Chit Lom", "Phloen Chit"] },
  { name: "MRT Blue Line", color: "#1565C0", stations: ["Sam Yan", "Silom", "Lumphini"] },
];

type TransportMode = "foot" | "car" | "transit";

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  transitLine?: string;
  transitColor?: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: [number, number][];
  steps: RouteStep[];
  transitLines?: string[];
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

const createNavigationIcon = () =>
  L.divIcon({
    className: "nav-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 8px solid white;
          transform: translateY(-1px);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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
function parseInstruction(step: { maneuver: { type: string; modifier?: string }; name?: string }, mode: TransportMode): RouteStep {
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier || "";
  const name = step.name || "the road";

  let instruction = "";
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

  instruction = instructions[type] || `Continue on ${name}`;

  return {
    instruction,
    distance: 0,
    duration: 0,
  };
}

// Generate transit-specific instructions
function generateTransitSteps(distance: number): RouteStep[] {
  const steps: RouteStep[] = [];
  
  // Simulate transit journey with realistic Bangkok transit
  const nearestLine = TRANSIT_LINES[Math.floor(Math.random() * TRANSIT_LINES.length)];
  const startStation = nearestLine.stations[0];
  const endStation = nearestLine.stations[Math.min(1, nearestLine.stations.length - 1)];
  
  steps.push({
    instruction: `Walk to ${startStation} BTS/MRT Station`,
    distance: Math.min(300, distance * 0.2),
    duration: Math.min(300, distance * 0.2) / 1.2, // Walking speed ~1.2 m/s
  });

  steps.push({
    instruction: `Board ${nearestLine.name}`,
    distance: 0,
    duration: 180, // 3 min wait time
    transitLine: nearestLine.name,
    transitColor: nearestLine.color,
  });

  steps.push({
    instruction: `Ride to ${endStation} Station`,
    distance: distance * 0.6,
    duration: (distance * 0.6) / 15, // Train speed ~15 m/s (54 km/h)
    transitLine: nearestLine.name,
    transitColor: nearestLine.color,
  });

  steps.push({
    instruction: `Exit at ${endStation} and walk to destination`,
    distance: distance * 0.2,
    duration: (distance * 0.2) / 1.2,
  });

  return steps;
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
  const navMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([BANTADTHONG_CENTER.lat, BANTADTHONG_CENTER.lng]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantCard | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<typeof mockLandmarksExpanded[0] | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(userLocation || null);
  
  const [transportMode, setTransportMode] = useState<TransportMode>("foot");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  
  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navPosition, setNavPosition] = useState<[number, number] | null>(null);
  const navIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Real-time GPS tracking state
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

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

  // Get user's actual location (one-time)
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation. Using Bantadthong center.",
      });
      setUserPos(BANTADTHONG_CENTER);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        // Check if within Bangkok area
        if (lat > 13.5 && lat < 14.0 && lng > 100.3 && lng < 100.8) {
          setUserPos({ lat, lng });
          setMapCenter([lat, lng]);
          setGpsAccuracy(pos.coords.accuracy);
          toast({
            title: "📍 Location found",
            description: `Accuracy: ${Math.round(pos.coords.accuracy)}m`,
          });
        } else {
          setUserPos(BANTADTHONG_CENTER);
          setMapCenter([BANTADTHONG_CENTER.lat, BANTADTHONG_CENTER.lng]);
          toast({
            title: "Location outside Bantadthong",
            description: "Using Bantadthong center as your location",
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setUserPos(BANTADTHONG_CENTER);
        toast({
          title: "Could not get location",
          description: "Using Bantadthong center. Please enable location access.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [toast]);

  // Start real-time GPS tracking
  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsLiveTracking(true);
    toast({
      title: "🔴 Live tracking enabled",
      description: "Your location will update in real-time",
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        
        // Check if within Bangkok area
        if (lat > 13.5 && lat < 14.0 && lng > 100.3 && lng < 100.8) {
          setUserPos({ lat, lng });
          setGpsAccuracy(accuracy);
          
          // If navigating, check if reached destination
          const destination = selectedRestaurant || selectedLandmark;
          if (destination && isNavigating) {
            const distance = Math.sqrt(
              Math.pow((lat - destination.lat) * 111000, 2) +
              Math.pow((lng - destination.lng) * 111000 * Math.cos(lat * Math.PI / 180), 2)
            );
            
            if (distance < 30) { // Within 30 meters
              setIsNavigating(false);
              toast({
                title: "🎉 You've arrived!",
                description: `Welcome to ${destination.name}`,
              });
            }
          }
        }
      },
      (error) => {
        console.error("GPS tracking error:", error);
        toast({
          title: "GPS error",
          description: "Could not update location. Retrying...",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, [toast, selectedRestaurant, selectedLandmark, isNavigating]);

  // Stop real-time GPS tracking
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
    setGpsAccuracy(null);
    toast({
      title: "Live tracking stopped",
      description: "Your location is no longer being tracked",
    });
  }, [toast]);

  // Cleanup GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Initial location request
  useEffect(() => {
    if (userLocation) {
      setUserPos(userLocation);
      return;
    }
    requestUserLocation();
  }, [userLocation, requestUserLocation]);

  // Fetch route from OSRM with realistic timing
  const fetchRoute = useCallback(async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    mode: TransportMode
  ) => {
    setIsLoadingRoute(true);
    try {
      // OSRM only supports foot and car profiles
      const profile = mode === "car" ? "driving" : "foot";
      
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

      let duration = route.duration;
      let steps: RouteStep[] = [];

      if (mode === "foot") {
        // Walking: ~4.5 km/h = 1.25 m/s (realistic walking speed)
        // OSRM assumes ~5 km/h, so we adjust slightly slower for realistic walking
        duration = route.distance / 1.1; // ~4 km/h realistic walking
        
        steps = route.legs[0].steps.map((step: {
          maneuver: { type: string; modifier?: string };
          name?: string;
          distance: number;
          duration: number;
        }) => ({
          ...parseInstruction(step, mode),
          distance: step.distance,
          duration: step.distance / 1.1, // Recalculate with walking speed
        }));
      } else if (mode === "car") {
        // Driving in Bangkok traffic: assume average 20-25 km/h in city
        // OSRM might be optimistic, so we use the given duration
        duration = route.duration;
        
        steps = route.legs[0].steps.map((step: {
          maneuver: { type: string; modifier?: string };
          name?: string;
          distance: number;
          duration: number;
        }) => ({
          ...parseInstruction(step, mode),
          distance: step.distance,
          duration: step.duration,
        }));
      } else if (mode === "transit") {
        // Transit: Generate realistic BTS/MRT instructions
        steps = generateTransitSteps(route.distance);
        duration = steps.reduce((sum, step) => sum + step.duration, 0);
      }

      setRouteInfo({
        distance: route.distance,
        duration: duration,
        coordinates,
        steps,
        transitLines: mode === "transit" ? steps.filter(s => s.transitLine).map(s => s.transitLine!) : undefined,
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

  // Render / update user marker with accuracy circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;

    // Update or create user marker
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: createUserIcon() })
        .addTo(map)
        .bindPopup(`<div style="font-size: 12px; font-weight: 600">📍 You are here${gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ''}</div>`);
    } else {
      userMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
      userMarkerRef.current.setPopupContent(`<div style="font-size: 12px; font-weight: 600">📍 You are here${gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ''}</div>`);
    }

    // Update or create accuracy circle when live tracking
    if (isLiveTracking && gpsAccuracy) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle([userPos.lat, userPos.lng], {
          radius: gpsAccuracy,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
      } else {
        accuracyCircleRef.current.setLatLng([userPos.lat, userPos.lng]);
        accuracyCircleRef.current.setRadius(gpsAccuracy);
      }
    } else if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    // Center map on user when live tracking
    if (isLiveTracking) {
      map.panTo([userPos.lat, userPos.lng]);
    }
  }, [userPos, gpsAccuracy, isLiveTracking]);

  // Render route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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

    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
  }, [routeInfo, transportMode]);

  // Navigation simulation
  useEffect(() => {
    if (!isNavigating || !routeInfo || routeInfo.coordinates.length === 0) {
      if (navIntervalRef.current) {
        clearInterval(navIntervalRef.current);
        navIntervalRef.current = null;
      }
      return;
    }

    let coordIndex = 0;
    const coords = routeInfo.coordinates;
    
    // Speed based on transport mode
    const intervalMs = transportMode === "car" ? 100 : transportMode === "transit" ? 150 : 300;

    navIntervalRef.current = setInterval(() => {
      if (coordIndex >= coords.length) {
        setIsNavigating(false);
        toast({
          title: "🎉 You've arrived!",
          description: `Welcome to ${(selectedRestaurant || selectedLandmark)?.name}`,
        });
        return;
      }

      const pos = coords[coordIndex];
      setNavPosition(pos);
      
      // Update step index based on distance traveled
      if (routeInfo.steps.length > 0) {
        const progress = coordIndex / coords.length;
        const stepIndex = Math.min(
          Math.floor(progress * routeInfo.steps.length),
          routeInfo.steps.length - 1
        );
        setCurrentStepIndex(stepIndex);
      }

      coordIndex++;
    }, intervalMs);

    return () => {
      if (navIntervalRef.current) {
        clearInterval(navIntervalRef.current);
      }
    };
  }, [isNavigating, routeInfo, transportMode, selectedRestaurant, selectedLandmark, toast]);

  // Update navigation marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!navPosition || !isNavigating) {
      if (navMarkerRef.current) {
        navMarkerRef.current.remove();
        navMarkerRef.current = null;
      }
      return;
    }

    if (!navMarkerRef.current) {
      navMarkerRef.current = L.marker(navPosition, { icon: createNavigationIcon() }).addTo(map);
    } else {
      navMarkerRef.current.setLatLng(navPosition);
    }

    // Center map on navigation marker
    map.panTo(navPosition);
  }, [navPosition, isNavigating]);

  const handleStartNavigation = () => {
    if (!routeInfo) return;
    setIsNavigating(true);
    setCurrentStepIndex(0);
    setShowSteps(true);
    toast({
      title: "🧭 Navigation started",
      description: `Follow the route to ${(selectedRestaurant || selectedLandmark)?.name}`,
    });
  };

  const handlePauseNavigation = () => {
    setIsNavigating(false);
  };

  const handleResetNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    setNavPosition(null);
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

      {/* Location controls */}
      <div className="absolute top-3 right-14 z-[1000] flex gap-1">
        {/* Live tracking toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={isLiveTracking ? stopLiveTracking : startLiveTracking}
          className={cn(
            "bg-background/90 backdrop-blur-sm hover:bg-background",
            isLiveTracking && "bg-red-500/20 text-red-500 hover:bg-red-500/30"
          )}
          aria-label={isLiveTracking ? "Stop live tracking" : "Start live tracking"}
        >
          <div className="relative">
            <Locate className="h-4 w-4" />
            {isLiveTracking && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        </Button>
        
        {/* One-time locate button */}
        {!isLiveTracking && (
          <Button
            variant="ghost"
            size="icon"
            onClick={requestUserLocation}
            className="bg-background/90 backdrop-blur-sm hover:bg-background"
            aria-label="Find my location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        )}
      </div>

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
        {isLiveTracking && (
          <div className="pt-1 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-medium">LIVE</span>
            </div>
            {gpsAccuracy && (
              <div className="text-muted-foreground">
                Accuracy: ±{Math.round(gpsAccuracy)}m
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current step indicator during navigation */}
      {isNavigating && routeInfo && routeInfo.steps[currentStepIndex] && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg max-w-[90%]">
          <div className="flex items-center gap-3">
            {routeInfo.steps[currentStepIndex].transitLine ? (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: routeInfo.steps[currentStepIndex].transitColor }}
              >
                <Bus className="h-4 w-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                {transportMode === "foot" ? <Footprints className="h-4 w-4" /> : <Car className="h-4 w-4" />}
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{routeInfo.steps[currentStepIndex].instruction}</p>
              {routeInfo.steps[currentStepIndex].transitLine && (
                <p className="text-xs opacity-80">{routeInfo.steps[currentStepIndex].transitLine}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Route Panel */}
      {currentDestination && showRoute && (
        <div className="bg-background/95 backdrop-blur-sm border-t border-border p-4 space-y-4 max-h-[60vh] overflow-y-auto">
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
                disabled={isNavigating}
                className={cn(
                  "flex-1 p-3 rounded-xl border transition-all",
                  transportMode === mode
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted",
                  isNavigating && "opacity-50 cursor-not-allowed"
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

              {/* Transit line badges */}
              {transportMode === "transit" && routeInfo.transitLines && routeInfo.transitLines.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {routeInfo.transitLines.map((line, i) => {
                    const lineInfo = TRANSIT_LINES.find(l => l.name === line);
                    return (
                      <span 
                        key={i} 
                        className="px-2 py-1 rounded-full text-xs text-white font-medium"
                        style={{ backgroundColor: lineInfo?.color || "#666" }}
                      >
                        {line}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Turn-by-turn Directions */}
              {showSteps && routeInfo.steps.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto border-t border-border pt-3">
                  {routeInfo.steps.map((step, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-start gap-3 text-sm p-2 rounded-lg transition-colors",
                        isNavigating && index === currentStepIndex && "bg-primary/10 border border-primary/20"
                      )}
                    >
                      <div 
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium",
                          step.transitLine ? "text-white" : "bg-muted"
                        )}
                        style={step.transitColor ? { backgroundColor: step.transitColor } : undefined}
                      >
                        {step.transitLine ? <Bus className="h-3 w-3" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <p>{step.instruction}</p>
                        {step.transitLine && (
                          <p className="text-xs font-medium mt-0.5" style={{ color: step.transitColor }}>
                            {step.transitLine}
                          </p>
                        )}
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

          {/* Navigation Controls */}
          <div className="flex gap-2">
            {!isNavigating ? (
              <Button 
                onClick={handleStartNavigation} 
                className="flex-1"
                disabled={!routeInfo}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Navigation
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handlePauseNavigation}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button 
                  onClick={handleResetNavigation}
                  variant="outline"
                  size="icon"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
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
