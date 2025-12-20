import { RestaurantCard } from "@/types/chat";
import { Star, Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestaurantCardDisplayProps {
  restaurant: RestaurantCard;
  onClick?: () => void;
  className?: string;
}

export function RestaurantCardDisplay({ restaurant, onClick, className }: RestaurantCardDisplayProps) {
  const availabilityPercent = (restaurant.tablesAvailable / restaurant.totalTables) * 100;
  
  return (
    <div 
      onClick={onClick}
      className={cn("restaurant-card group", className)}
    >
      {/* Image */}
      <div className="relative h-36 -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-2xl">
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="h-3.5 w-3.5 text-warning fill-warning" />
          <span className="text-sm font-medium">{restaurant.rating}</span>
          <span className="text-xs text-muted-foreground">({restaurant.reviewCount})</span>
        </div>
        <div className="absolute bottom-2 right-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <span className="text-xs font-medium">{restaurant.priceRange}</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
            {restaurant.name}
          </h3>
          <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{restaurant.waitTime === 0 ? "No wait" : `${restaurant.waitTime} min`}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{restaurant.distance}</span>
          </div>
        </div>

        {/* Table Availability */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Tables</span>
            </div>
            <span className={cn(
              "font-medium",
              availabilityPercent > 50 ? "text-notification" : availabilityPercent > 20 ? "text-warning" : "text-destructive"
            )}>
              {restaurant.tablesAvailable} of {restaurant.totalTables} available
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                availabilityPercent > 50 ? "bg-notification" : availabilityPercent > 20 ? "bg-warning" : "bg-destructive"
              )}
              style={{ width: `${availabilityPercent}%` }}
            />
          </div>
        </div>

        {/* Known For Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {restaurant.knownFor.slice(0, 3).map((item) => (
            <span 
              key={item}
              className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
