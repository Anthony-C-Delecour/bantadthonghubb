export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  restaurantCard?: RestaurantCard;
  restaurantCards?: RestaurantCard[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  mode: ChatMode;
}

export interface RestaurantCard {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  cuisine: string;
  priceRange: string;
  priceMin: number;
  priceMax: number;
  bahtTier: string;
  waitTimeMin: number;
  waitTimeMax: number;
  waitTime: number;
  distance: string;
  distanceMeters: number;
  image: string;
  knownFor: string[];
  signatureDishes: string[];
  description: string;
  tablesAvailable: number;
  totalTables: number;
  lat: number;
  lng: number;
  address: string;
  openHours: string;
}

export type ChatMode = "chat" | "itinerary" | "landmark" | "polaroid";

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  profilePicture?: string;
  accountType: "user" | "business";
  dataSharingEnabled: boolean;
  createdAt: Date;
}

export interface LiveNotification {
  id: string;
  type: "review" | "visit" | "recommendation";
  userName: string;
  restaurantName: string;
  rating?: number;
  comment?: string;
  timestamp: Date;
}

export interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
}
