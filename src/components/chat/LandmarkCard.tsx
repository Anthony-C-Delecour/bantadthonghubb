import { Star, MapPin, Camera, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface LandmarkReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface Landmark {
  id: string;
  name: string;
  description: string;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  reviews: LandmarkReview[];
  instagramHashtag: string;
  lat: number;
  lng: number;
  address: string;
  category: string;
  bestTimeToVisit: string;
  estimatedVisitTime: string;
}

interface LandmarkCardProps {
  landmark: Landmark;
  onClick: () => void;
  isSelected?: boolean;
}

export function LandmarkCard({ landmark, onClick, isSelected }: LandmarkCardProps) {
  const { t } = useLanguage();
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={landmark.image}
          alt={landmark.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium">
            {landmark.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 bg-primary/90 text-primary-foreground rounded-full text-xs font-medium flex items-center gap-1">
            <Camera className="h-3 w-3" />
            {landmark.instagramHashtag}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg">{landmark.name}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="font-medium">{landmark.rating}</span>
            <span className="text-muted-foreground text-sm">({landmark.reviewCount})</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {landmark.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {landmark.address}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-muted rounded-full">
            {t("bestTime")}: {landmark.bestTimeToVisit}
          </span>
          <span className="px-2 py-1 bg-muted rounded-full">
            {t("estimatedTime")}{landmark.estimatedVisitTime}
          </span>
        </div>

        {/* Preview of top review */}
        {landmark.reviews.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {landmark.reviews[0].userName.charAt(0)}
              </div>
              <span className="text-sm font-medium">{landmark.reviews[0].userName}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < landmark.reviews[0].rating
                        ? "text-amber-500 fill-amber-500"
                        : "text-muted"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              "{landmark.reviews[0].comment}"
            </p>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full mt-3">
          {t("viewOnMap")} <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}