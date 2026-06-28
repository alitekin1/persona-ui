"use client";

import { useState, useEffect } from "react";
import { MessageSquare, PlusCircle, User, Search, Play, ChevronLeft, Menu, Bell, MessageCircle } from "lucide-react";
import { useQuery } from "convex/react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("characters");
  const [selectedChar, setSelectedChar] = useState<any | null>(null);
  
  // Local state for Telegram user data
  const [telegramId, setTelegramId] = useState<string>("unknown");
  
  // Real implementation for characters
  const charactersResult = useQuery("characters:listCharacters" as any, {});
  const characters = charactersResult?.characters || [];
  
  const user = useQuery("users:getUserByTelegramId" as any, telegramId !== "unknown" ? { telegramId } : "skip");

  useEffect(() => {
    // Dynamically import Telegram WebApp SDK to avoid SSR window is not defined error
    if (typeof window !== "undefined") {
      import("@twa-dev/sdk").then((module) => {
        const WebApp = module.default;
        if (WebApp.initData) {
          WebApp.ready();
          WebApp.expand();
          
          const user = WebApp.initDataUnsafe?.user;
          if (user?.id) {
            setTelegramId(user.id.toString());
          }
        }
      });
    }
  }, []);

  const handleStartChat = async () => {
    if (typeof window !== "undefined") {
      const module = await import("@twa-dev/sdk");
      const WebApp = module.default;
      if (WebApp.initData) {
        WebApp.sendData(JSON.stringify({ action: "start_chat", characterId: selectedChar._id }));
        WebApp.close();
        return;
      }
    }
    alert("در تلگرام: بات مطلع شده و مینی‌اپ بسته می‌شود تا چت شروع شود.");
  };

  const renderContent = () => {
    if (selectedChar !== null) {
      const char = selectedChar;

      return (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => setSelectedChar(null)}
            className="flex items-center text-zinc-400 mb-6 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 ml-1" />
            بازگشت
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-cosmic-border mb-4 bg-zinc-800">
              {char.imageUrl ? (
                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-500">
                  {char.name.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{char.name}</h2>
            <p className="text-zinc-400 mb-6">{char.description || char.tagline}</p>
            
            <div className="flex gap-2 justify-center mb-8 flex-wrap">
              {char.tags?.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-cosmic-surface border border-cosmic-border rounded-full text-xs text-brand-lime">
                  {tag}
                </span>
              ))}
            </div>

            <button 
              onClick={handleStartChat}
              className="w-full bg-brand-lime text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#bbf771] transition-colors active:scale-95"
            >
              <Play className="w-5 h-5 fill-black" />
              شروع چت
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === "characters") {
      // Create mock sub-lists from the main data to simulate categories
      const forYou = characters.slice(0, 3);
      const scenes = characters.slice(2, 6);
      const trending = characters.slice(1, 5);

      return (
        <div className="pb-6">
          {/* Top Bar */}
          <header className="flex items-center gap-3 p-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <button className="p-2 -mr-2 text-zinc-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="جستجو..." 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
            <button className="p-2 -ml-2 text-zinc-400 hover:text-white">
              <Bell className="w-6 h-6" />
            </button>
          </header>

          <div className="space-y-8 mt-2 px-4">
            {/* For You Section */}
            <section>
              <h2 className="text-lg font-bold mb-3">برای شما</h2>
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-2 -mx-4 px-4">
                {charactersResult === undefined ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="snap-start shrink-0 w-[85%] bg-cosmic-card border border-cosmic-border rounded-2xl p-4 flex gap-4 animate-pulse">
                      <div className="w-20 h-20 rounded-xl bg-zinc-800 shrink-0" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 bg-zinc-800 rounded w-1/2" />
                        <div className="h-3 bg-zinc-800 rounded w-full" />
                        <div className="h-3 bg-zinc-800 rounded w-4/5" />
                      </div>
                    </div>
                  ))
                ) : (
                  forYou.map((char: any) => (
                    <div 
                      key={char._id} 
                      onClick={() => setSelectedChar(char)}
                      className="snap-start shrink-0 w-[85%] bg-cosmic-card border border-cosmic-border rounded-2xl p-4 flex gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="w-20 h-20 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                        {char.imageUrl ? (
                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-zinc-500 font-bold bg-zinc-800">{char.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{char.name}</h3>
                        <p className="text-brand-lime/80 text-xs mt-0.5 truncate">توسط @admin</p>
                        <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2">
                          {char.description || "بدون توضیحات"}
                        </p>
                        {char.popularity !== undefined && (
                          <div className="flex items-center gap-1 mt-2 text-zinc-500 text-xs">
                            <MessageCircle className="w-3 h-3" />
                            <span>{char.popularity}k</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Banner Ad / Premium CTA */}
            <section>
              <div className="bg-brand-blue rounded-2xl p-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">P</span>
                  </div>
                  <span className="text-white font-semibold text-sm">چت‌های بدون محدودیت</span>
                </div>
                <button className="bg-white text-brand-blue px-4 py-1.5 rounded-full text-sm font-bold">
                  تهیه اشتراک
                </button>
              </div>
            </section>

            {/* Scenes (Vertical portrait cards) */}
            <section>
              <h2 className="text-lg font-bold mb-3">صحنه‌ها</h2>
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-2 -mx-4 px-4">
                {charactersResult === undefined ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="snap-start shrink-0 w-[140px] h-[200px] rounded-2xl bg-zinc-800 animate-pulse" />
                  ))
                ) : (
                  scenes.map((char: any) => (
                    <div 
                      key={char._id}
                      onClick={() => setSelectedChar(char)}
                      className="relative snap-start shrink-0 w-[140px] h-[200px] rounded-2xl overflow-hidden cursor-pointer group"
                    >
                      {char.imageUrl ? (
                        <img src={char.imageUrl} alt={char.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{char.name}</h3>
                        <p className="text-[10px] text-zinc-300 mt-1 truncate">@admin</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Popular / Trending Section */}
            <section>
              <h2 className="text-lg font-bold mb-3">محبوب‌ترین‌ها</h2>
              <div className="grid grid-cols-1 gap-3">
                {charactersResult === undefined ? (
                   <div className="h-20 rounded-2xl bg-zinc-800 animate-pulse" />
                ) : (
                  trending.map((char: any) => (
                    <div 
                      key={char._id} 
                      onClick={() => setSelectedChar(char)}
                      className="bg-cosmic-surface rounded-2xl p-3 flex gap-4 cursor-pointer hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                        {char.imageUrl ? (
                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl text-zinc-500 font-bold bg-zinc-800">{char.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-semibold text-sm truncate">{char.name}</h3>
                        <p className="text-zinc-400 text-xs mt-1 truncate">
                          {char.description || char.tagline}
                        </p>
                        {char.popularity !== undefined && (
                          <div className="flex items-center gap-1 mt-1.5 text-zinc-500 text-[10px]">
                            <MessageCircle className="w-3 h-3" />
                            <span>{char.popularity}k پیام</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (activeTab === "create") {
      return (
        <div className="p-4 flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-16 h-16 bg-cosmic-surface rounded-full flex items-center justify-center mb-4">
            <PlusCircle className="w-8 h-8 text-brand-lime" />
          </div>
          <h2 className="text-xl font-bold mb-2">ساخت شخصیت جدید</h2>
          <p className="text-zinc-400 text-sm max-w-[250px]">
            شخصیت رویایی خودتان را با ویژگی‌های دلخواه بسازید.
          </p>
          <button className="mt-6 px-6 py-2 bg-cosmic-surface border border-cosmic-border rounded-lg text-sm hover:border-brand-lime transition-colors">
            به زودی...
          </button>
        </div>
      );
    }

    if (activeTab === "profile") {
      return (
        <div className="p-4">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">حساب کاربری</h1>
          </header>

          <div className="bg-cosmic-card border border-cosmic-border rounded-xl p-6 text-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-lime"></div>
            <p className="text-zinc-400 mb-2">شناسه تلگرام شما</p>
            {user === undefined && telegramId !== "unknown" ? (
              <div className="h-10 bg-zinc-800 rounded w-1/2 mx-auto animate-pulse" />
            ) : (
              <div className="text-3xl font-extrabold font-mono text-brand-lime">
                {user?.username ? `@${user.username}` : telegramId}
              </div>
            )}
            {user?.onboarded && (
               <span className="inline-block mt-3 px-3 py-1 bg-cosmic-surface border border-cosmic-border rounded-full text-xs text-brand-lime">
                 تکمیل ثبت‌نام
               </span>
            )}
          </div>

          <div className="space-y-3">
            <button className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl p-4 flex justify-between items-center hover:bg-zinc-800 transition-colors">
              <span>تاریخچه چت‌ها</span>
              <ChevronLeft className="w-5 h-5 text-zinc-500" />
            </button>
            <button className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl p-4 flex justify-between items-center hover:bg-zinc-800 transition-colors">
              <span>تنظیمات مود</span>
              <ChevronLeft className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative max-w-md mx-auto border-x border-cosmic-border/30 bg-background">
      <main className="pb-24">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      {selectedChar === null && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-cosmic-border z-50">
          <div className="flex justify-around items-center h-16 px-6">
            <button 
              onClick={() => setActiveTab("characters")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "characters" ? "text-white" : "text-zinc-500"}`}
            >
              <MessageSquare className={`w-6 h-6 ${activeTab === "characters" ? "fill-white" : ""}`} />
            </button>
            
            <button 
              onClick={() => setActiveTab("create")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "create" ? "text-white" : "text-zinc-500"}`}
            >
              <PlusCircle className={`w-6 h-6 ${activeTab === "create" ? "fill-white" : ""}`} />
            </button>
            
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "profile" ? "text-white" : "text-zinc-500"}`}
            >
              <User className={`w-6 h-6 ${activeTab === "profile" ? "fill-white" : ""}`} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}