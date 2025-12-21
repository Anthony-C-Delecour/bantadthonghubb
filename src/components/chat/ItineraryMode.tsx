import { useState, useEffect, useMemo } from "react";
import { RestaurantCard } from "@/types/chat";
import { mockRestaurants } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Route, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItineraryModeProps {
  onSelectRestaurant?: (restaurantId: string) => void;
  onClose?: () => void;
}

interface ItineraryStop {
  restaurant: RestaurantCard;
  order: number;
  estimatedArrival: string;
  estimatedWait: number;
}

export function ItineraryMode({ onSelectRestaurant, onClose }: ItineraryModeProps) {
  const [budget, setBudget] = useState<"low" | "mid" | "high">("mid");
  const [numPlaces, setNumPlaces] = useState(3);
  const [cuisine, setCuisine] = useState<string>("any");
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const cuisineOptions = useMemo(() => {
    const cuisines = new Set<string>();
    mockRestaurants.forEach((r) => {
      const mainCuisine = r.cuisine.split(" ")[0].replace(/[^a-zA-Z]/g, "");
      cuisines.add(mainCuisine);
    });
    return Array.from(cuisines);
  }, []);

  const generateItinerary = () => {
    let filtered = [...mockRestaurants];

    // Filter by budget
    if (budget === "low") {
      filtered = filtered.filter((r) => r.bahtTier === "฿");
    } else if (budget === "high") {
      filtered = filtered.filter((r) => r.bahtTier === "฿฿฿" || r.bahtTier === "฿฿");
    }

    // Filter by cuisine
    if (cuisine !== "any") {
      filtered = filtered.filter((r) =>
        r.cuisine.toLowerCase().includes(cuisine.toLowerCase())
      );
    }

    // Sort by rating and wait time
    filtered.sort((a, b) => {
      const scoreA = a.rating * 2 - a.waitTime / 20;
      const scoreB = b.rating * 2 - b.waitTime / 20;
      return scoreB - scoreA;
    });

    // Take top N places
    const selected = filtered.slice(0, numPlaces);

    // Calculate optimal route (simple: sort by distance)
    selected.sort((a, b) => a.distanceMeters - b.distanceMeters);

    // Create itinerary with time estimates
    let currentTime = new Date();
    currentTime.setHours(11, 0, 0, 0); // Start at 11 AM

    const stops: ItineraryStop[] = selected.map((restaurant, index) => {
      const arrivalTime = new Date(currentTime);
      const stop: ItineraryStop = {
        restaurant,
        order: index + 1,
        estimatedArrival: arrivalTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        estimatedWait: restaurant.waitTime,
      };

      // Add time for meal (~45 min) + wait + walk to next (~10 min)
      currentTime.setMinutes(
        currentTime.getMinutes() + 45 + restaurant.waitTime + 10
      );

      return stop;
    });

    setItinerary(stops);
    setIsGenerated(true);
  };

  const removeStop = (index: number) => {
    const newItinerary = itinerary.filter((_, i) => i !== index);
    // Re-order
    newItinerary.forEach((stop, i) => {
      stop.order = i + 1;
    });
    setItinerary(newItinerary);
  };

  const totalBudget = useMemo(() => {
    return itinerary.reduce((sum, stop) => {
      return sum + (stop.restaurant.priceMin + stop.restaurant.priceMax) / 2;
    }, 0);
  }, [itinerary]);

  const totalWait = useMemo(() => {
    return itinerary.reduce((sum, stop) => sum + stop.estimatedWait, 0);
  }, [itinerary]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Itinerary Planner 🗺️</h2>
          <p className="text-sm text-muted-foreground">
            Plan your perfect Bantadthong food tour
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!isGenerated ? (
        <div className="space-y-4">
          {/* Budget */}
          <div className="space-y-2">
            <Label>Budget Level</Label>
            <div className="flex gap-2">
              {[
                { value: "low", label: "฿ Budget", desc: "Under 400 THB" },
                { value: "mid", label: "฿฿ Mid", desc: "400-700 THB" },
                { value: "high", label: "฿฿฿ Premium", desc: "700+ THB" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value as typeof budget)}
                  className={cn(
                    "flex-1 p-3 rounded-xl border-2 text-center transition-all",
                    budget === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Places */}
          <div className="space-y-2">
            <Label>Number of Places</Label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumPlaces(num)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                    numPlaces === num
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine Preference */}
          <div className="space-y-2">
            <Label>Cuisine Preference</Label>
            <Select value={cuisine} onValueChange={setCuisine}>
              <SelectTrigger>
                <SelectValue placeholder="Select cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Cuisine</SelectItem>
                {cuisineOptions.map((c) => (
                  <SelectItem key={c} value={c.toLowerCase()}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateItinerary} className="w-full" size="lg">
            <Route className="h-4 w-4 mr-2" />
            Generate Itinerary
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4 p-3 bg-secondary rounded-xl">
            <div className="flex-1 text-center">
              <div className="text-sm text-muted-foreground">Est. Budget</div>
              <div className="font-semibold">~{Math.round(totalBudget)} THB</div>
            </div>
            <div className="flex-1 text-center border-x border-border">
              <div className="text-sm text-muted-foreground">Total Wait</div>
              <div className="font-semibold">~{totalWait} min</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm text-muted-foreground">Stops</div>
              <div className="font-semibold">{itinerary.length}</div>
            </div>
          </div>

          {/* Itinerary Stops */}
          <div className="space-y-3">
            {itinerary.map((stop, index) => (
              <div
                key={stop.restaurant.id}
                className="relative flex items-start gap-3 p-3 bg-card rounded-xl border border-border"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {stop.order}
                  </div>
                  {index < itinerary.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectRestaurant && onSelectRestaurant(stop.restaurant.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{stop.restaurant.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {stop.restaurant.cuisine}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stop.estimatedArrival}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {stop.estimatedWait} min wait
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {stop.restaurant.priceRange}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {stop.restaurant.distance}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeStop(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsGenerated(false)}
              className="flex-1"
            >
              Edit Preferences
            </Button>
            <Button
              onClick={() => itinerary[0] && onSelectRestaurant && onSelectRestaurant(itinerary[0].restaurant.id)}
              className="flex-1"
            >
              View on Map
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
