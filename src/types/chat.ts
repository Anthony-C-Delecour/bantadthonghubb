export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  restaurantCard?: RestaurantCard;
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
  waitTime: number;
  distance: string;
  image: string;
  knownFor: string[];
  tablesAvailable: number;
  totalTables: number;
}

export type ChatMode = "chat" | "itinerary" | "landmark" | "polaroid";

export interface User {
  id: string;
  username: string;
  email?: string;
  consentGiven: boolean;
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
