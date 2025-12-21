import { useState } from "react";
import { LandmarkCard, Landmark } from "./LandmarkCard";
import { mockLandmarksExpanded } from "@/data/mockData";
import { Star, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

const categories = ["All", "University", "Shopping", "Museum", "Temple", "Park", "Market"];

export function LandmarkMode({ onSelectLandmark, selectedLandmarkId }: LandmarkModeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "reviews">("rating");

  const filteredLandmarks = mockLandmarksExpanded
    .filter((landmark) => {
      const matchesSearch = landmark.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        landmark.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || landmark.category === selectedCategory;
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
        <h2 className="text-xl font-bold mb-4">Discover Landmarks</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search landmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex-shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-muted-foreground">
            {filteredLandmarks.length} landmarks found
          </span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
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
            <p>No landmarks found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
