import { useState, useCallback } from "react";
import { Message, ChatSession, ChatMode, RestaurantCard } from "@/types/chat";
import { mockRestaurants, welcomeMessages } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Smart keyword parsing for restaurant recommendations
const parseUserIntent = (message: string): {
  pricePreference?: "cheap" | "mid" | "premium";
  cuisinePreference?: string[];
  waitPreference?: "no-wait" | "short" | "any";
  timePreference?: "late" | "any";
  spicePreference?: boolean;
  seafoodPreference?: boolean;
  groupDining?: boolean;
} => {
  const lower = message.toLowerCase();
  const intent: ReturnType<typeof parseUserIntent> = {};

  // Price keywords
  if (lower.includes("cheap") || lower.includes("budget") || lower.includes("฿") || lower.includes("affordable") || lower.includes("inexpensive")) {
    intent.pricePreference = "cheap";
  } else if (lower.includes("premium") || lower.includes("expensive") || lower.includes("฿฿฿") || lower.includes("fancy") || lower.includes("high-end")) {
    intent.pricePreference = "premium";
  }

  // Wait time keywords
  if (lower.includes("no wait") || lower.includes("quick") || lower.includes("fast") || lower.includes("immediate") || lower.includes("right now")) {
    intent.waitPreference = "no-wait";
  } else if (lower.includes("short wait") || lower.includes("not long")) {
    intent.waitPreference = "short";
  }

  // Time keywords
  if (lower.includes("late") || lower.includes("midnight") || lower.includes("night") || lower.includes("after 10") || lower.includes("late-night")) {
    intent.timePreference = "late";
  }

  // Spice keywords
  if (lower.includes("spicy") || lower.includes("hot") || lower.includes("spice") || lower.includes("isan") || lower.includes("isaan")) {
    intent.spicePreference = true;
  }

  // Seafood keywords
  if (lower.includes("seafood") || lower.includes("crab") || lower.includes("fish") || lower.includes("shrimp") || lower.includes("oyster")) {
    intent.seafoodPreference = true;
  }

  // Cuisine keywords
  const cuisines: string[] = [];
  if (lower.includes("thai")) cuisines.push("thai");
  if (lower.includes("isan") || lower.includes("isaan") || lower.includes("northeastern")) cuisines.push("isan");
  if (lower.includes("chinese")) cuisines.push("chinese");
  if (lower.includes("northern") || lower.includes("khao soi")) cuisines.push("northern");
  if (lower.includes("southern")) cuisines.push("southern");
  if (lower.includes("noodle") || lower.includes("kuay tiew") || lower.includes("boat noodle")) cuisines.push("noodle");
  if (lower.includes("bbq") || lower.includes("grill") || lower.includes("moo kata")) cuisines.push("bbq");
  if (lower.includes("western") || lower.includes("steak")) cuisines.push("western");
  if (cuisines.length > 0) intent.cuisinePreference = cuisines;

  // Group dining
  if (lower.includes("group") || lower.includes("friends") || lower.includes("party") || lower.includes("family")) {
    intent.groupDining = true;
  }

  return intent;
};

// Filter and rank restaurants based on user intent
const getRecommendations = (intent: ReturnType<typeof parseUserIntent>): RestaurantCard[] => {
  let filtered = [...mockRestaurants];

  // Price filter
  if (intent.pricePreference === "cheap") {
    filtered = filtered.filter(r => r.bahtTier === "฿");
  } else if (intent.pricePreference === "premium") {
    filtered = filtered.filter(r => r.bahtTier === "฿฿฿");
  }

  // Wait time filter
  if (intent.waitPreference === "no-wait") {
    filtered = filtered.filter(r => r.waitTime <= 15);
  } else if (intent.waitPreference === "short") {
    filtered = filtered.filter(r => r.waitTime <= 25);
  }

  // Late night filter
  if (intent.timePreference === "late") {
    filtered = filtered.filter(r => 
      r.openHours.includes("AM") || 
      r.openHours.includes("12 AM") || 
      r.openHours.includes("1 AM") ||
      r.openHours.includes("2 AM") ||
      r.openHours.includes("3 AM") ||
      r.openHours.includes("4 AM") ||
      r.name.toLowerCase().includes("midnight") ||
      r.knownFor.some(k => k.toLowerCase().includes("late"))
    );
  }

  // Spice filter
  if (intent.spicePreference) {
    filtered = filtered.filter(r => 
      r.cuisine.toLowerCase().includes("isan") ||
      r.knownFor.some(k => k.toLowerCase().includes("spicy")) ||
      r.description.toLowerCase().includes("spicy")
    );
  }

  // Seafood filter
  if (intent.seafoodPreference) {
    filtered = filtered.filter(r => 
      r.cuisine.toLowerCase().includes("seafood") ||
      r.signatureDishes.some(d => d.toLowerCase().includes("crab") || d.toLowerCase().includes("seafood") || d.toLowerCase().includes("oyster"))
    );
  }

  // Cuisine filter
  if (intent.cuisinePreference && intent.cuisinePreference.length > 0) {
    filtered = filtered.filter(r => 
      intent.cuisinePreference!.some(c => 
        r.cuisine.toLowerCase().includes(c) ||
        r.knownFor.some(k => k.toLowerCase().includes(c))
      )
    );
  }

  // Group dining filter
  if (intent.groupDining) {
    filtered = filtered.filter(r => 
      r.totalTables >= 10 ||
      r.cuisine.toLowerCase().includes("bbq") ||
      r.knownFor.some(k => k.toLowerCase().includes("group"))
    );
  }

  // Sort by rating and availability
  filtered.sort((a, b) => {
    const aScore = a.rating * 10 + (a.tablesAvailable / a.totalTables) * 5 - (a.waitTime / 10);
    const bScore = b.rating * 10 + (b.tablesAvailable / b.totalTables) * 5 - (b.waitTime / 10);
    return bScore - aScore;
  });

  return filtered.slice(0, 3);
};

const generateResponse = (userMessage: string, t: (key: string) => string): { content: string; restaurantCards?: RestaurantCard[] } => {
  const message = userMessage.toLowerCase();
  const intent = parseUserIntent(message);
  
  // Check if it's a restaurant-related query
  const isRestaurantQuery = 
    message.includes("restaurant") ||
    message.includes("eat") ||
    message.includes("food") ||
    message.includes("hungry") ||
    message.includes("cheap") ||
    message.includes("budget") ||
    message.includes("premium") ||
    message.includes("seafood") ||
    message.includes("spicy") ||
    message.includes("late") ||
    message.includes("wait") ||
    message.includes("queue") ||
    message.includes("table") ||
    message.includes("noodle") ||
    message.includes("thai") ||
    message.includes("isan") ||
    message.includes("recommend") ||
    message.includes("suggest") ||
    message.includes("find") ||
    message.includes("best") ||
    message.includes("nearby") ||
    message.includes("close") ||
    Object.keys(intent).length > 0;

  if (isRestaurantQuery) {
    const recommendations = getRecommendations(intent);
    
    if (recommendations.length === 0) {
      // Fallback to top-rated restaurants
      const fallback = mockRestaurants.slice(0, 3);
      return {
        content: t("botNoMatch"),
        restaurantCards: fallback,
      };
    }

    // Build response based on intent
    let responsePrefix = "";
    
    if (intent.pricePreference === "cheap") {
      responsePrefix = t("botBudgetFriendly");
    } else if (intent.pricePreference === "premium") {
      responsePrefix = t("botPremium");
    } else if (intent.waitPreference === "no-wait") {
      responsePrefix = t("botMinimalWait");
    } else if (intent.spicePreference) {
      responsePrefix = t("botSpicy");
    } else if (intent.seafoodPreference) {
      responsePrefix = t("botSeafood");
    } else if (intent.timePreference === "late") {
      responsePrefix = t("botLateNight");
    } else {
      responsePrefix = t("botTopPicks");
    }

    const topPick = recommendations[0];
    const content = `${responsePrefix}:\n\n**${topPick.name}** ${t("botTopPickIntro")} ${topPick.description}\n\n• ${t("botWaitTime")}: ~${topPick.waitTime} ${t("minutes")}\n• ${t("botPrice")}: ${topPick.priceRange}\n• ${t("botKnownFor")}: ${topPick.signatureDishes.join(", ")}\n\n${t("botDirectionsPrompt")}`;

    return {
      content,
      restaurantCards: recommendations,
    };
  }

  // Map/route queries
  if (message.includes("map") || message.includes("route") || message.includes("direction") || message.includes("navigate") || message.includes("how to get")) {
    return {
      content: t("botMapHelp"),
    };
  }

  // Landmark/photo queries
  if (message.includes("photo") || message.includes("landmark") || message.includes("instagram") || message.includes("picture") || message.includes("spot")) {
    return {
      content: t("botPhotoSpots"),
    };
  }

  // Itinerary queries
  if (message.includes("plan") || message.includes("itinerary") || message.includes("day") || message.includes("schedule")) {
    return {
      content: t("botItineraryHelp"),
    };
  }

  // Default response
  return {
    content: t("botDefaultHelp"),
  };
};

export function useChat() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>("chat");

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createNewSession = useCallback((mode: ChatMode = "chat") => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "New Chat",
      messages: welcomeMessages.map((content, index) => ({
        id: generateId(),
        content,
        role: "assistant" as const,
        timestamp: new Date(Date.now() + index * 100),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      mode,
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setCurrentMode(mode);
    return newSession;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    let sessionId = currentSessionId;
    
    // Create a new session if none exists
    if (!sessionId) {
      const newSession = createNewSession();
      sessionId = newSession.id;
    }

    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedMessages = [...session.messages, userMessage];
        const title = session.messages.length <= 3 ? content.slice(0, 30) + (content.length > 30 ? "..." : "") : session.title;
        return { ...session, messages: updatedMessages, title, updatedAt: new Date() };
      }
      return session;
    }));

    setIsLoading(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const response = generateResponse(content, t);
    
    const assistantMessage: Message = {
      id: generateId(),
      content: response.content,
      role: "assistant",
      timestamp: new Date(),
      restaurantCards: response.restaurantCards,
    };

    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return { ...session, messages: [...session.messages, assistantMessage], updatedAt: new Date() };
      }
      return session;
    }));

    setIsLoading(false);
  }, [currentSessionId, createNewSession]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== sessionId);
      if (currentSessionId === sessionId) {
        const nextSession = remaining.length > 0 ? remaining[0] : null;
        setCurrentSessionId(nextSession?.id || null);
      }
      return remaining;
    });
  }, [currentSessionId]);

  const switchSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setCurrentMode(session.mode);
    }
  }, [sessions]);

  const switchMode = useCallback((mode: ChatMode) => {
    setCurrentMode(mode);
    if (currentSession) {
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId ? { ...session, mode } : session
      ));
    }
  }, [currentSession, currentSessionId]);

  return {
    sessions,
    currentSession,
    currentSessionId,
    isLoading,
    currentMode,
    createNewSession,
    sendMessage,
    deleteSession,
    switchSession,
    switchMode,
  };
}
