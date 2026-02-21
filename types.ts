export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi',
  TAMIL = 'ta',
  TELUGU = 'te',
  MALAYALAM = 'ml',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  CHINESE = 'zh'
}

export enum Category {
  GENERAL = 'General',
  TECHNOLOGY = 'Technology',
  SPORTS = 'Sports',
  BUSINESS = 'Business',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health',
  SCIENCE = 'Science',
  POLITICS = 'Politics'
}

export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  source: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  category: Category | string;
  language: Language; // The original language of the article
}

export interface UserSettings {
  language: Language;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  dataSaverMode: boolean;
}

export interface UIStrings {
  appName: string;
  latestNews: string;
  search: string; // New field for BottomNav label
  searchPlaceholder: string;
  bookmarks: string;
  settings: string;
  readMore: string;
  summarize: string;
  summary: string;
  generatingSummary: string;
  source: string;
  published: string;
  share: string;
  home: string;
  categories: string;
  noBookmarks: string;
  saved: string;
  removed: string;
  refresh: string;
  loading: string;
  generateImage: string;
  generatingImage: string;
  imageGenerated: string;
  failedToGenerate: string;
  // Categories
  cat_General: string;
  cat_Technology: string;
  cat_Sports: string;
  cat_Business: string;
  cat_Entertainment: string;
  cat_Health: string;
  cat_Science: string;
  cat_Politics: string;
}
