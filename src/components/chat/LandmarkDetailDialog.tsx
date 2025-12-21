import { Landmark } from "./LandmarkCard";
import { Star, MapPin, Clock, Camera, Sparkles, X } from "lucide-react";
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

interface LandmarkDetailDialogProps {
  landmark: Landmark;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewOnMap?: () => void;
}

export function LandmarkDetailDialog({ 
  landmark, 
  open, 
  onOpenChange,
  onViewOnMap 
}: LandmarkDetailDialogProps) {
  const { t } = useLanguage();
  const allImages = [landmark.image, ...(landmark.images || [])].filter(Boolean);

  const translateTimeOfDay = (time: string) => {
    const lowerTime = time.toLowerCase();
    if (lowerTime.includes("late afternoon")) return t("lateAfternoon");
    if (lowerTime.includes("morning")) return t("morning");
    if (lowerTime.includes("afternoon")) return t("afternoon");
    if (lowerTime.includes("evening")) return t("evening");
    return time;
  };

  // What makes this place stand out
  const highlights = [
    { icon: Camera, text: landmark.instagramHashtag, label: t("instagramWorthy") },
    { icon: Clock, text: `${t("bestTime")}: ${translateTimeOfDay(landmark.bestTimeToVisit)}`, label: t("visitTime") },
    { icon: Sparkles, text: landmark.category, label: t("category") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{landmark.name}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[90vh]">
          <div className="relative">
            {/* Hero Image */}
            <div className="relative h-56 overflow-hidden">
              <img 
                src={landmark.image} 
                alt={landmark.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <span className="px-2 py-1 bg-primary/80 text-primary-foreground rounded-full text-xs font-medium mb-2 inline-block">
                  {landmark.category}
                </span>
                <h2 className="text-2xl font-bold">{landmark.name}</h2>
                <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {landmark.address}
                </p>
              </div>
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
                <Star className="h-4 w-4 text-warning fill-warning" />
                <span className="font-medium">{landmark.rating}</span>
                <span className="text-xs text-muted-foreground">({landmark.reviewCount})</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* What Makes It Stand Out */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t("whatMakesItSpecial")}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {highlights.map((highlight, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-muted/50 rounded-lg text-center"
                    >
                      <highlight.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs font-medium">{highlight.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">{landmark.description}</p>

              {/* Photo Gallery */}
              {allImages.length > 1 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {t("photoGallery")}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {allImages.slice(0, 6).map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={img}
                          alt={`${landmark.name} photo ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visit Info */}
              <div className="flex gap-2 text-sm">
                <span className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full">
                  {t("bestTime")}: {translateTimeOfDay(landmark.bestTimeToVisit)}
                </span>
                <span className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full">
                  {t("estimatedTime")}{landmark.estimatedVisitTime}
                </span>
              </div>

              {/* Reviews Section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {t("reviews")} ({landmark.reviewCount})
                </h3>
                <div className="space-y-3">
                  {landmark.reviews.slice(0, 3).map((review) => (
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
                      <p className="text-sm text-muted-foreground">"{review.comment}"</p>
                      {review.helpful > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {review.helpful} {t("foundHelpful")}
                        </p>
                      )}
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