"use client";

import { useState, useEffect } from "react";
import { MessageSquare, PlusCircle, User, Search, Play, ChevronLeft } from "lucide-react";
import WebApp from "@twa-dev/sdk";
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
    // Notify Telegram Mini App that the app is ready and expand
    if (typeof window !== "undefined" && WebApp.initData) {
      WebApp.ready();
      WebApp.expand();
      
      // Extract user info from Telegram WebApp
      const user = WebApp.initDataUnsafe?.user;
      if (user?.id) {
        setTelegramId(user.id.toString());
      }
    }
  }, []);

  const handleStartChat = () => {
    if (typeof window !== "undefined" && WebApp.initData) {
      WebApp.sendData(JSON.stringify({ action: "start_chat", characterId: selectedChar._id }));
      WebApp.close();
    } else {
      alert("در تلگرام: بات مطلع شده و مینی‌اپ بسته می‌شود تا چت شروع شود.");
    }
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
            بازگشت به لیست
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
              شروع چت در تلگرام
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === "characters") {
      return (
        <div className="p-4">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">شخصیت‌ها</h1>
            <p className="text-zinc-400 text-sm mt-1">با چه کسی می‌خواهید صحبت کنید؟</p>
          </header>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input 
              type="text" 
              placeholder="جستجو..." 
              className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-brand-lime transition-colors"
            />
          </div>

          <div className="grid gap-4">
            {charactersResult === undefined ? (
              // Loading Skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-cosmic-card border border-cosmic-border rounded-xl p-4 flex gap-4 animate-pulse">
                  <div className="w-16 h-16 rounded-lg bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                    <div className="h-3 bg-zinc-800 rounded w-full" />
                    <div className="h-3 bg-zinc-800 rounded w-4/5" />
                  </div>
                </div>
              ))
            ) : characters.length === 0 ? (
              <div className="text-center text-zinc-500 py-10">شخصیتی یافت نشد.</div>
            ) : (
              characters.map((char: any) => (
                <div 
                  key={char._id} 
                  onClick={() => setSelectedChar(char)}
                  className="bg-cosmic-card border border-cosmic-border rounded-xl p-4 flex gap-4 cursor-pointer hover:border-zinc-700 transition-colors active:scale-[0.98]"
                >
                  <div className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden shrink-0 flex flex-col items-center justify-center">
                    {char.imageUrl ? (
                      <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl text-zinc-500 font-bold">{char.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{char.name}</h3>
                      {char.popularity !== undefined && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-full">
                          🔥 {char.popularity}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2 mt-1">
                      {char.description || char.tagline}
                    </p>
                  </div>
                </div>
              ))
            )}
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
          <div className="flex justify-around items-center h-20 px-6">
            <button 
              onClick={() => setActiveTab("characters")}
              className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === "characters" ? "text-brand-lime" : "text-zinc-500"}`}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-[10px] font-medium">شخصیت‌ها</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("create")}
              className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === "create" ? "text-brand-lime" : "text-zinc-500"}`}
            >
              <PlusCircle className="w-6 h-6" />
              <span className="text-[10px] font-medium">ساختن</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === "profile" ? "text-brand-lime" : "text-zinc-500"}`}
            >
              <User className="w-6 h-6" />
              <span className="text-[10px] font-medium">پروفایل</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}