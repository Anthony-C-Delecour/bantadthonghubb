import { useState } from "react";
import { RestaurantCard } from "@/types/chat";
import { Star, Clock, MapPin, Users, X, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RestaurantDetailDialogProps {
  restaurant: RestaurantCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewOnMap?: () => void;
}

// Mock reviews for demo
const generateMockReviews = (restaurant: RestaurantCard) => [
  {
    id: "1",
    userName: "Sarah K.",
    rating: 5,
    comment: `Amazing ${restaurant.signatureDishes?.[0] || "food"}! The flavors are incredible and the portion sizes are generous.`,
    date: "2 days ago",
    helpful: 24,
  },
  {
    id: "2",
    userName: "Mike T.",
    rating: 4,
    comment: `Great atmosphere and friendly staff. The ${restaurant.knownFor?.[0]?.toLowerCase() || "service"} experience was wonderful.`,
    date: "1 week ago",
    helpful: 18,
  },
  {
    id: "3",
    userName: "Lisa M.",
    rating: 5,
    comment: "One of my favorite spots in Bantadthong. Will definitely come back again!",
    date: "2 weeks ago",
    helpful: 32,
  },
  {
    id: "4",
    userName: "James L.",
    rating: 4,
    comment: "Good value for money. The food quality is consistent every time I visit.",
    date: "3 weeks ago",
    helpful: 15,
  },
];

export function RestaurantDetailDialog({ 
  restaurant, 
  open, 
  onOpenChange,
  onViewOnMap 
}: RestaurantDetailDialogProps) {
  const { t, translateCuisine } = useLanguage();
  const reviews = generateMockReviews(restaurant);
  const allImages = [restaurant.image, ...(restaurant.foodImages || [])].filter(Boolean);
  const availabilityPercent = (restaurant.tablesAvailable / restaurant.totalTables) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-lg max-h-[85dvh] p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="sr-only">
          <DialogTitle>{restaurant.name}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[85dvh]">
          <div className="relative">
            {/* Hero Image */}
            <div className="relative h-48 overflow-hidden">
              <img 
                src={restaurant.image} 
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">{restaurant.name}</h2>
                <p className="text-sm opacity-90">{translateCuisine(restaurant.cuisine)}</p>
              </div>
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
                <Star className="h-4 w-4 text-warning fill-warning" />
                <span className="font-medium">{restaurant.rating}</span>
                <span className="text-xs text-muted-foreground">({restaurant.reviewCount})</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Quick Info */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.waitTime === 0 ? t("noWait") : `${restaurant.waitTime} ${t("minWait")}`}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.distance}</span>
                </div>
                <span className="font-medium text-primary">{restaurant.bahtTier || restaurant.priceRange}</span>
              </div>

              {/* Table Availability */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{t("tables")}</span>
                  </div>
                  <span className={cn(
                    "font-medium",
                    availabilityPercent > 50 ? "text-notification" : availabilityPercent > 20 ? "text-warning" : "text-destructive"
                  )}>
                    {restaurant.tablesAvailable} {t("of")} {restaurant.totalTables} {t("available")}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      availabilityPercent > 50 ? "bg-notification" : availabilityPercent > 20 ? "bg-warning" : "bg-destructive"
                    )}
                    style={{ width: `${availabilityPercent}%` }}
                  />
                </div>
              </div>

              {/* Food Gallery */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  {t("signatureDishes")}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {allImages.slice(0, 4).map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={img}
                        alt={`${restaurant.name} dish ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                      />
                    </div>
                  ))}
                </div>
                {/* Signature Dishes Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {(restaurant.signatureDishes || restaurant.knownFor).map((item) => (
                    <span 
                      key={item}
                      className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{restaurant.description}</p>

              {/* Reviews Section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {t("reviews")} ({restaurant.reviewCount})
                </h3>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {review.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{review.userName}</p>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3",
                                i < review.rating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-muted"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button onClick={onViewOnMap} className="flex-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  {t("viewOnMap")}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}