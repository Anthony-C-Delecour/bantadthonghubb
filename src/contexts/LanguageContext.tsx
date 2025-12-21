import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "th" | "zh" | "ja" | "ko";

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
];

// Translations for common UI elements
export const translations: Record<Language, Record<string, string>> = {
  en: {
    chat: "Chat",
    itinerary: "Itinerary",
    landmark: "Landmarks",
    polaroid: "Polaroid",
    profile: "Profile",
    help: "Help & Support",
    signOut: "Sign Out",
    newChat: "New Chat",
    searchPlaceholder: "Search landmarks...",
    startNavigation: "Start Navigation",
    pause: "Pause",
    walk: "Walk",
    drive: "Drive",
    transit: "Transit",
    showSteps: "Show Steps",
    hideSteps: "Hide Steps",
    locateMe: "Find my location",
    arrived: "You've arrived!",
    welcomeTo: "Welcome to",
    routeError: "Could not calculate route",
    locationFound: "Location found",
    usingCurrentLocation: "Using your current location",
    findRestaurant: "Find me a restaurant",
    cheapEats: "Best cheap eats nearby",
    premiumSeafood: "Premium seafood",
    spicyFood: "Something spicy",
    lateNightFood: "Late night food",
    minWait: "min wait",
    viewOnMap: "View on Map",
    directions: "Directions",
    all: "All",
    highestRated: "Highest Rated",
    mostReviews: "Most Reviews",
    landmarksFound: "landmarks found",
    bestTime: "Best",
    estimatedTime: "~",
  },
  th: {
    chat: "แชท",
    itinerary: "แผนการเดินทาง",
    landmark: "สถานที่น่าสนใจ",
    polaroid: "โพลารอยด์",
    profile: "โปรไฟล์",
    help: "ช่วยเหลือ",
    signOut: "ออกจากระบบ",
    newChat: "แชทใหม่",
    searchPlaceholder: "ค้นหาสถานที่...",
    startNavigation: "เริ่มนำทาง",
    pause: "หยุด",
    walk: "เดิน",
    drive: "ขับรถ",
    transit: "ขนส่งสาธารณะ",
    showSteps: "แสดงขั้นตอน",
    hideSteps: "ซ่อนขั้นตอน",
    locateMe: "หาตำแหน่งของฉัน",
    arrived: "คุณมาถึงแล้ว!",
    welcomeTo: "ยินดีต้อนรับสู่",
    routeError: "ไม่สามารถคำนวณเส้นทางได้",
    locationFound: "พบตำแหน่งแล้ว",
    usingCurrentLocation: "ใช้ตำแหน่งปัจจุบันของคุณ",
    findRestaurant: "หาร้านอาหารให้หน่อย",
    cheapEats: "อาหารราคาถูกใกล้เคียง",
    premiumSeafood: "อาหารทะเลพรีเมียม",
    spicyFood: "อาหารรสเผ็ด",
    lateNightFood: "อาหารดึก",
    minWait: "นาที รอ",
    viewOnMap: "ดูบนแผนที่",
    directions: "เส้นทาง",
    all: "ทั้งหมด",
    highestRated: "คะแนนสูงสุด",
    mostReviews: "รีวิวมากสุด",
    landmarksFound: "สถานที่พบ",
    bestTime: "เวลาที่ดี",
    estimatedTime: "~",
  },
  zh: {
    chat: "聊天",
    itinerary: "行程",
    landmark: "地标",
    polaroid: "拍立得",
    profile: "个人资料",
    help: "帮助与支持",
    signOut: "退出",
    newChat: "新聊天",
    searchPlaceholder: "搜索地标...",
    startNavigation: "开始导航",
    pause: "暂停",
    walk: "步行",
    drive: "驾车",
    transit: "公交",
    showSteps: "显示步骤",
    hideSteps: "隐藏步骤",
    locateMe: "定位我",
    arrived: "您已到达！",
    welcomeTo: "欢迎来到",
    routeError: "无法计算路线",
    locationFound: "已找到位置",
    usingCurrentLocation: "使用您的当前位置",
    findRestaurant: "帮我找餐厅",
    cheapEats: "附近便宜美食",
    premiumSeafood: "高级海鲜",
    spicyFood: "辣味美食",
    lateNightFood: "宵夜",
    minWait: "分钟等待",
    viewOnMap: "在地图上查看",
    directions: "路线",
    all: "全部",
    highestRated: "评分最高",
    mostReviews: "评论最多",
    landmarksFound: "个地标",
    bestTime: "最佳",
    estimatedTime: "约",
  },
  ja: {
    chat: "チャット",
    itinerary: "旅程",
    landmark: "ランドマーク",
    polaroid: "ポラロイド",
    profile: "プロフィール",
    help: "ヘルプ",
    signOut: "ログアウト",
    newChat: "新しいチャット",
    searchPlaceholder: "ランドマークを検索...",
    startNavigation: "ナビ開始",
    pause: "一時停止",
    walk: "徒歩",
    drive: "車",
    transit: "公共交通",
    showSteps: "ステップを表示",
    hideSteps: "ステップを隠す",
    locateMe: "現在地を取得",
    arrived: "到着しました！",
    welcomeTo: "ようこそ",
    routeError: "ルートを計算できません",
    locationFound: "位置が見つかりました",
    usingCurrentLocation: "現在地を使用しています",
    findRestaurant: "レストランを探して",
    cheapEats: "近くの安い料理",
    premiumSeafood: "高級シーフード",
    spicyFood: "辛い料理",
    lateNightFood: "深夜グルメ",
    minWait: "分待ち",
    viewOnMap: "地図で見る",
    directions: "ルート案内",
    all: "すべて",
    highestRated: "評価順",
    mostReviews: "レビュー順",
    landmarksFound: "件のランドマーク",
    bestTime: "最適",
    estimatedTime: "約",
  },
  ko: {
    chat: "채팅",
    itinerary: "일정",
    landmark: "랜드마크",
    polaroid: "폴라로이드",
    profile: "프로필",
    help: "도움말",
    signOut: "로그아웃",
    newChat: "새 채팅",
    searchPlaceholder: "랜드마크 검색...",
    startNavigation: "길안내 시작",
    pause: "일시정지",
    walk: "도보",
    drive: "자동차",
    transit: "대중교통",
    showSteps: "단계 표시",
    hideSteps: "단계 숨기기",
    locateMe: "내 위치 찾기",
    arrived: "도착했습니다!",
    welcomeTo: "환영합니다",
    routeError: "경로를 계산할 수 없습니다",
    locationFound: "위치를 찾았습니다",
    usingCurrentLocation: "현재 위치 사용 중",
    findRestaurant: "레스토랑 찾기",
    cheapEats: "근처 저렴한 음식",
    premiumSeafood: "프리미엄 해산물",
    spicyFood: "매운 음식",
    lateNightFood: "야식",
    minWait: "분 대기",
    viewOnMap: "지도에서 보기",
    directions: "길찾기",
    all: "전체",
    highestRated: "평점순",
    mostReviews: "리뷰순",
    landmarksFound: "개 랜드마크",
    bestTime: "최적",
    estimatedTime: "약",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("hubb_language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("hubb_language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
