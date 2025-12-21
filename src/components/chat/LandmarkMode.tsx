import { useState } from "react";
import { LandmarkCard, Landmark } from "./LandmarkCard";
import { mockLandmarksExpanded } from "@/data/mockData";
import { Star, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LandmarkModeProps {
  onSelectLandmark?: (landmarkId: string) => void;
  selectedLandmarkId?: string | null;
}

const categoryKeys = ["all", "university", "shopping", "museum", "temple", "park", "market"] as const;

export function LandmarkMode({ onSelectLandmark, selectedLandmarkId }: LandmarkModeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "reviews">("rating");
  const { t } = useLanguage();

  const filteredLandmarks = mockLandmarksExpanded
    .filter((landmark) => {
      const matchesSearch = landmark.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        landmark.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || landmark.category.toLowerCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">{t("discoverLandmarks")}</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryKeys.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex-shrink-0"
            >
              {t(category)}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-muted-foreground">
            {filteredLandmarks.length} {t("landmarksFound")}
          </span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">{t("highestRated")}</SelectItem>
              <SelectItem value="reviews">{t("mostReviews")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Landmarks Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredLandmarks.map((landmark) => (
            <LandmarkCard
              key={landmark.id}
              landmark={landmark}
              isSelected={selectedLandmarkId === landmark.id}
              onClick={() => onSelectLandmark && onSelectLandmark(landmark.id)}
            />
          ))}
        </div>

        {filteredLandmarks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("noLandmarksFound")}</p>
          </div>
        )}
      </div>
    </div>
  );
}