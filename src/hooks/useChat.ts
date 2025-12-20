import { useState, useCallback } from "react";
import { Message, ChatSession, ChatMode } from "@/types/chat";
import { mockResponses, mockRestaurants, welcomeMessages } from "@/data/mockData";

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const getAIResponse = (userMessage: string): { content: string; restaurantCard?: typeof mockRestaurants[0] } => {
  const message = userMessage.toLowerCase();
  
  if (message.includes("restaurant") || message.includes("eat") || message.includes("food") || message.includes("hungry")) {
    return {
      content: mockResponses.restaurant,
      restaurantCard: mockRestaurants[0],
    };
  }
  
  if (message.includes("queue") || message.includes("wait") || message.includes("available") || message.includes("table")) {
    return {
      content: mockResponses.queue,
      restaurantCard: mockRestaurants[1],
    };
  }
  
  if (message.includes("photo") || message.includes("landmark") || message.includes("instagram") || message.includes("picture")) {
    return { content: mockResponses.landmark };
  }
  
  if (message.includes("plan") || message.includes("itinerary") || message.includes("day") || message.includes("route")) {
    return { content: mockResponses.itinerary };
  }
  
  return { content: mockResponses.default };
};

export function useChat() {
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
    if (!currentSessionId) {
      createNewSession();
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        const updatedMessages = [...session.messages, userMessage];
        const title = session.messages.length <= 3 ? content.slice(0, 30) + (content.length > 30 ? "..." : "") : session.title;
        return { ...session, messages: updatedMessages, title, updatedAt: new Date() };
      }
      return session;
    }));

    setIsLoading(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const response = getAIResponse(content);
    
    const assistantMessage: Message = {
      id: generateId(),
      content: response.content,
      role: "assistant",
      timestamp: new Date(),
      restaurantCard: response.restaurantCard,
    };

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return { ...session, messages: [...session.messages, assistantMessage], updatedAt: new Date() };
      }
      return session;
    }));

    setIsLoading(false);
  }, [currentSessionId, createNewSession]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(sessions.length > 1 ? sessions.find(s => s.id !== sessionId)?.id || null : null);
    }
  }, [currentSessionId, sessions]);

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
