import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Article, Category, Language, UIStrings } from './types';
import { MOCK_ARTICLES, TRANSLATIONS, CATEGORIES } from './constants';
import NewsCard from './components/NewsCard';
import BottomNav from './components/BottomNav';
import ArticleDetail from './components/ArticleDetail';
import LanguageSelector from './components/LanguageSelector';
import { fetchLatestNews } from './services/geminiService';
import { Search as SearchIcon, Globe, Bell, Filter, Bookmark, RotateCw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | string>('All');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Derived State
  const strings: UIStrings = TRANSLATIONS[selectedLanguage];

  // Helper to get translated category name
  const getCategoryName = (cat: string) => {
      if (cat === 'All') return strings.home; // Reusing "Home" or "General" concept for All
      const key = `cat_${cat}` as keyof UIStrings;
      return strings[key] || cat;
  };

  // Fetch News Logic
  const handleFetchNews = useCallback(async (lang: Language, category: string) => {
    if (!process.env.API_KEY) return; // Fallback to mock if no key
    
    setIsLoading(true);
    const newArticles = await fetchLatestNews(lang, category);
    if (newArticles.length > 0) {
        setArticles(newArticles);
    } else {
        // If fetch fails or empty, keep existing or fallback
        // Maybe show error toast
        showNotification("Failed to update news. Using cached.");
    }
    setIsLoading(false);
  }, []);

  // Initial fetch and on change
  useEffect(() => {
     // Fetch news when language changes to provide "Whole page change" experience
     // We fetch 'General' or current category news in that language
     handleFetchNews(selectedLanguage, selectedCategory === 'All' ? 'General' : selectedCategory);
  }, [selectedLanguage, selectedCategory, handleFetchNews]);


  // Filtering Logic (Client side for search, category is server/API side mostly but we keep client filter for MOCK fallback)
  const filteredArticles = useMemo(() => {
    let result = articles;
    
    // Note: If we fetched news from API, the API already filtered by category/language usually.
    // But if we are mixed or fallback, we filter.
    // However, the API returns "General" for All. 
    // We strictly filter if the article category matches.
    if (selectedCategory !== 'All') {
       // Relaxed filter: The API might return "Technology" for a "Science" request sometimes, so exact match only if we are sure.
       // For now, let's assume API returns correct stuff or we rely on the API.
       // But if we use Mock data, we need this filter.
       if (!process.env.API_KEY) {
           result = result.filter(a => a.category === selectedCategory);
       }
    }

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.description.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [articles, selectedCategory, searchQuery]);

  const bookmarkedArticles = useMemo(() => {
    return articles.filter(a => bookmarkedIds.has(a.id));
  }, [articles, bookmarkedIds]);

  // Handlers
  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      const isAdding = !newSet.has(id);
      if (isAdding) {
        newSet.add(id);
        showNotification(strings.saved);
      } else {
        newSet.delete(id);
        showNotification(strings.removed);
      }
      return newSet;
    });
  };

  const showNotification = (msg: string) => {
      setNotificationMsg(msg);
      setTimeout(() => setNotificationMsg(null), 2000);
  };

  // Render Functions
  const renderHeader = () => (
    <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="bg-blue-600 rounded-lg p-1.5">
           <Globe size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Nex<span className="text-blue-600">ara</span>
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        <button 
            onClick={() => handleFetchNews(selectedLanguage, selectedCategory === 'All' ? 'General' : selectedCategory)}
            disabled={isLoading}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
            <RotateCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
        <button 
          onClick={() => setShowLanguageSelector(true)}
          className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          <span className="uppercase">{selectedLanguage}</span>
        </button>
      </div>
    </header>
  );

  const renderCategoryStrip = () => (
    <div className="sticky top-[60px] bg-white/95 dark:bg-gray-800/95 backdrop-blur z-10 border-b border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar py-3 pl-4">
       <div className="flex space-x-3 pr-4">
          <button 
             onClick={() => setSelectedCategory('All')}
             className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
               selectedCategory === 'All' 
               ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
               : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
             }`}
          >
            {getCategoryName('All')}
          </button>
          {CATEGORIES.map(cat => (
             <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
             >
               {getCategoryName(cat)}
             </button>
          ))}
       </div>
    </div>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {renderHeader()}
      {renderCategoryStrip()}
      
      <main className="p-4 max-w-md mx-auto">
        {isLoading && filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 size={48} className="mb-4 animate-spin text-blue-500" />
                <p>{strings.loading}</p>
            </div>
        ) : filteredArticles.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <Filter size={48} className="mb-4 opacity-50" />
               <p>No articles found.</p>
           </div>
        ) : (
            filteredArticles.map(article => (
            <NewsCard 
                key={article.id} 
                article={article} 
                onClick={() => setSelectedArticle(article)}
                onBookmark={(e) => toggleBookmark(article.id, e)}
                isBookmarked={bookmarkedIds.has(article.id)}
                strings={strings}
            />
            ))
        )}
      </main>
    </div>
  );

  const renderSearch = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
       <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 p-4">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">Search</h1>
          <div className="relative">
             <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder={strings.searchPlaceholder}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
               autoFocus
             />
          </div>
       </header>
       <main className="p-4 max-w-md mx-auto">
         {searchQuery && filteredArticles.length === 0 && (
             <p className="text-center text-gray-500 mt-10">No results found for "{searchQuery}"</p>
         )}
         {filteredArticles.map(article => (
            <NewsCard 
                key={article.id} 
                article={article} 
                onClick={() => setSelectedArticle(article)}
                onBookmark={(e) => toggleBookmark(article.id, e)}
                isBookmarked={bookmarkedIds.has(article.id)}
                strings={strings}
            />
         ))}
       </main>
    </div>
  );

  const renderBookmarks = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">{strings.bookmarks}</h1>
      </header>
      <main className="p-4 max-w-md mx-auto">
        {bookmarkedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
             <Bookmark size={64} className="mb-4 opacity-20" />
             <p className="text-lg">{strings.noBookmarks}</p>
          </div>
        ) : (
          bookmarkedArticles.map(article => (
            <NewsCard 
                key={article.id} 
                article={article} 
                onClick={() => setSelectedArticle(article)}
                onBookmark={(e) => toggleBookmark(article.id, e)}
                isBookmarked={true}
                strings={strings}
            />
          ))
        )}
      </main>
    </div>
  );

  const renderSettings = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 p-4">
          <h1 className="text-2xl font-bold dark:text-white">{strings.settings}</h1>
      </header>
      <main className="p-4 max-w-md mx-auto space-y-4">
         <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">General</h2>
             <div 
               className="flex items-center justify-between py-3 cursor-pointer"
               onClick={() => setShowLanguageSelector(true)}
             >
                 <span className="text-gray-700 dark:text-gray-200">Language</span>
                 <span className="text-blue-600 font-medium">{selectedLanguage.toUpperCase()}</span>
             </div>
             <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
             <div className="flex items-center justify-between py-3">
                 <span className="text-gray-700 dark:text-gray-200">Dark Mode</span>
                 <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-not-allowed opacity-50">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                 </div>
             </div>
         </div>
         
         <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">About</h2>
             <div className="py-2">
                 <p className="text-gray-900 dark:text-white font-medium">Nexara v1.0.0</p>
                 <p className="text-sm text-gray-500">Built with React, Tailwind & Gemini AI</p>
             </div>
         </div>
      </main>
    </div>
  );

  // Main Render
  return (
    <div className="text-gray-900 dark:text-gray-100 font-sans">
      {/* Dynamic Content based on Tab */}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'search' && renderSearch()}
      {activeTab === 'bookmarks' && renderBookmarks()}
      {activeTab === 'settings' && renderSettings()}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} strings={strings} />

      {/* Modals/Overlays */}
      {showLanguageSelector && (
        <LanguageSelector 
          currentLanguage={selectedLanguage} 
          onLanguageChange={setSelectedLanguage}
          onClose={() => setShowLanguageSelector(false)}
        />
      )}

      {selectedArticle && (
        <ArticleDetail 
          article={selectedArticle} 
          onBack={() => setSelectedArticle(null)}
          strings={strings}
          currentLanguage={selectedLanguage}
          onBookmark={() => toggleBookmark(selectedArticle.id)}
          isBookmarked={bookmarkedIds.has(selectedArticle.id)}
        />
      )}

      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm animate-in fade-in slide-in-from-bottom-2">
            {notificationMsg}
        </div>
      )}
    </div>
  );
};

export default App;