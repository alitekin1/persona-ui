"use client";

import { useState, useEffect } from "react";
import { MessageSquare, PlusCircle, User, Search, Play, ChevronLeft, Menu, Bell, MessageCircle, X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("characters");
  const [selectedChar, setSelectedChar] = useState<any | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Navigation states
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Create form states
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createImageUrl, setCreateImageUrl] = useState("");
  const [createCategory, setCreateCategory] = useState("");

  // Local state for Telegram user data
  const [telegramId, setTelegramId] = useState<string>("unknown");
  
  // Convex queries
  const charactersResult = useQuery("characters:listCharacters" as any, {});
  const characters = charactersResult?.characters || [];
  
  const forYouCharacters = useQuery("characters:getForYouCharacters" as any, telegramId !== "unknown" ? { telegramId, limit: 5 } : { limit: 5 });
  const categories = useQuery("categories:listCategories" as any, {});
  const user = useQuery("users:getUserByTelegramId" as any, telegramId !== "unknown" ? { telegramId } : "skip");
  
  const createCharacter = useMutation("characters:createCharacterBasic" as any);

  useEffect(() => {
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

  const handleCharClick = (char: any) => {
    setIsNavigating(true);
    // Simulate the neural loading cycle (shimmer skeleton) before showing character detail
    setTimeout(() => {
      setSelectedChar(char);
      setIsNavigating(false);
    }, 1200);
  };

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

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createDesc || !createCategory) return;
    
    try {
      await createCharacter({
        name: createName,
        description: createDesc,
        imageUrl: createImageUrl || undefined,
        categoryId: createCategory,
      });
      alert("شخصیت با موفقیت ساخته شد!");
      setActiveTab("characters");
      setCreateName("");
      setCreateDesc("");
      setCreateImageUrl("");
    } catch (err) {
      alert("خطا در ساخت شخصیت");
    }
  };

  // --- Panels ---
  const renderMenu = () => {
    if (!showMenu) return null;
    return (
      <div className="fixed inset-0 z-[100] flex">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
        <div className="relative w-64 bg-cosmic-dark border-l border-cosmic-border h-full p-6 animate-in slide-in-from-right duration-300 ml-auto flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold font-mono">فهرست</h2>
            <button onClick={() => setShowMenu(false)} className="text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <button className="w-full text-right p-3 rounded-xl bg-cosmic-surface/50 border border-transparent hover:border-brand-lime transition-colors">قوانین و مقررات</button>
            <button className="w-full text-right p-3 rounded-xl bg-cosmic-surface/50 border border-transparent hover:border-brand-lime transition-colors">پشتیبانی</button>
            <button className="w-full text-right p-3 rounded-xl bg-cosmic-surface/50 border border-transparent hover:border-brand-lime transition-colors">درباره ما</button>
          </div>
          <div className="mt-auto pt-6 border-t border-cosmic-border text-xs text-zinc-500 text-center font-mono">
            ANIMA SYSTEM v1.0
          </div>
        </div>
      </div>
    );
  };

  const renderNotifications = () => {
    if (!showNotifications) return null;
    return (
      <div className="fixed inset-0 z-[100] flex">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
        <div className="relative w-full max-w-md mx-auto bg-cosmic-dark border-t border-cosmic-border h-[60vh] mt-auto rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">اعلان‌ها</h2>
            <button onClick={() => setShowNotifications(false)} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-full p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="p-4 rounded-xl border border-cosmic-border bg-cosmic-surface">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-brand-lime"></span>
                <span className="text-xs font-bold text-brand-lime">سیستم</span>
              </div>
              <p className="text-sm">به شبکه آنیما خوش آمدید! پروفایل شما ساخته شد.</p>
              <p className="text-xs text-zinc-500 mt-2">۲ ساعت پیش</p>
            </div>
            <div className="p-4 rounded-xl border border-cosmic-border bg-cosmic-card">
              <p className="text-sm">شخصیت "آریا" آپدیت جدیدی دریافت کرد. مکالمه عمیق‌تر شده است.</p>
              <p className="text-xs text-zinc-500 mt-2">۱ روز پیش</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Screens ---
  const renderContent = () => {
    // Neural Loading Skeleton Overlay
    if (isNavigating) {
      return (
        <div className="p-4 min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-32 h-32 rounded-full shimmer mb-6 border border-cosmic-border"></div>
          <div className="h-6 w-48 shimmer rounded-md mb-3"></div>
          <div className="h-4 w-32 shimmer rounded-md mb-8"></div>
          <div className="flex gap-2 mb-8">
             <div className="h-6 w-16 shimmer rounded-full"></div>
             <div className="h-6 w-16 shimmer rounded-full"></div>
          </div>
          <div className="h-14 w-full max-w-[280px] shimmer rounded-xl"></div>
          <p className="mt-8 text-xs font-mono text-zinc-500 tracking-widest uppercase">
            Inference Cycle Loading...
          </p>
        </div>
      );
    }

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
            <p className="text-zinc-400 mb-6 px-4">{char.description || char.tagline}</p>
            
            <div className="flex gap-2 justify-center mb-8 flex-wrap">
              {char.tags?.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-cosmic-surface border border-cosmic-border rounded-full text-xs text-brand-lime">
                  {tag}
                </span>
              ))}
            </div>

            <button 
              onClick={handleStartChat}
              className="w-full bg-brand-lime text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#bbf771] transition-colors active:scale-95 shadow-[0_0_20px_rgba(163,230,53,0.3)]"
            >
              <Play className="w-5 h-5 fill-black" />
              شروع چت
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === "characters") {
      const scenes = characters.slice(0, 6);
      const trending = characters.slice(0, 10);

      return (
        <div className="pb-6">
          {/* Top Bar */}
          <header className="flex items-center gap-3 p-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <button onClick={() => setShowMenu(true)} className="p-2 -mr-2 text-zinc-400 hover:text-white">
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
            <button onClick={() => setShowNotifications(true)} className="p-2 -ml-2 text-zinc-400 hover:text-white relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-lime rounded-full"></span>
            </button>
          </header>

          <div className="space-y-8 mt-2 px-4">
            {/* For You Section (Uses Algorithm from DB) */}
            <section>
              <h2 className="text-lg font-bold mb-3">برای شما</h2>
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-2 -mx-4 px-4">
                {forYouCharacters === undefined ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="snap-start shrink-0 w-[85%] bg-cosmic-card border border-cosmic-border rounded-2xl p-4 flex gap-4 shimmer">
                      <div className="w-20 h-20 rounded-xl bg-zinc-800/50 shrink-0" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 bg-zinc-800/50 rounded w-1/2" />
                        <div className="h-3 bg-zinc-800/50 rounded w-full" />
                        <div className="h-3 bg-zinc-800/50 rounded w-4/5" />
                      </div>
                    </div>
                  ))
                ) : forYouCharacters.length === 0 ? (
                  <p className="text-zinc-500 text-sm">شخصیتی یافت نشد.</p>
                ) : (
                  forYouCharacters.map((char: any) => (
                    <div 
                      key={char._id} 
                      onClick={() => handleCharClick(char)}
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
                            <span>{char.popularity}</span>
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
              <div className="bg-brand-blue rounded-2xl p-4 flex items-center justify-between cursor-pointer shadow-lg shadow-brand-blue/20">
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
                    <div key={i} className="snap-start shrink-0 w-[140px] h-[200px] rounded-2xl shimmer border border-cosmic-border" />
                  ))
                ) : (
                  scenes.map((char: any) => (
                    <div 
                      key={char._id}
                      onClick={() => handleCharClick(char)}
                      className="relative snap-start shrink-0 w-[140px] h-[200px] rounded-2xl overflow-hidden cursor-pointer group border border-cosmic-border/50"
                    >
                      {char.imageUrl ? (
                        <img src={char.imageUrl} alt={char.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
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
                   <div className="h-20 rounded-2xl shimmer border border-cosmic-border" />
                ) : (
                  trending.map((char: any) => (
                    <div 
                      key={char._id} 
                      onClick={() => handleCharClick(char)}
                      className="bg-cosmic-surface border border-cosmic-border/50 rounded-2xl p-3 flex gap-4 cursor-pointer hover:bg-zinc-800 transition-colors"
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
                        <p className="text-zinc-400 text-xs mt-1 line-clamp-1">
                          {char.description || char.tagline || "یک شخصیت جالب"}
                        </p>
                        {char.popularity !== undefined && (
                          <div className="flex items-center gap-1 mt-2 text-zinc-500 text-[10px]">
                            <MessageCircle className="w-3 h-3" />
                            <span>{char.popularity}</span>
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
        <div className="p-4 pb-24">
          <header className="mb-8 mt-2">
            <h1 className="text-2xl font-bold tracking-tight">ساخت شخصیت جدید</h1>
            <p className="text-zinc-400 text-sm mt-1">شخصیت رویایی خودتان را با ویژگی‌های دلخواه بسازید.</p>
          </header>
          
          <form onSubmit={handleCreateCharacter} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">نام شخصیت</label>
              <input 
                required
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="مثال: فرمانده کهکشان..."
                className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl py-3 px-4 focus:border-brand-lime outline-none transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">توضیح کوتاه</label>
              <textarea 
                required
                value={createDesc}
                onChange={e => setCreateDesc(e.target.value)}
                placeholder="درباره این شخصیت توضیح دهید..."
                className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl py-3 px-4 h-24 focus:border-brand-lime outline-none transition-colors resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 flex items-center justify-between">
                <span>آدرس تصویر (لینک)</span>
                <span className="text-[10px] text-zinc-500">اختیاری</span>
              </label>
              <input 
                value={createImageUrl}
                onChange={e => setCreateImageUrl(e.target.value)}
                type="url"
                placeholder="https://example.com/image.jpg"
                className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl py-3 px-4 focus:border-brand-lime outline-none transition-colors text-left"
                dir="ltr"
              />
              <p className="text-xs text-zinc-500">در دیتابیس بستر لازم (imageUrl) آماده است. در آینده آپلود مستقیم اضافه می‌شود.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">دسته‌بندی</label>
              <select 
                required
                value={createCategory}
                onChange={e => setCreateCategory(e.target.value)}
                className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl py-3 px-4 focus:border-brand-lime outline-none transition-colors appearance-none"
              >
                <option value="" disabled>یک دسته انتخاب کنید</option>
                {categories?.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-brand-lime text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#bbf771] transition-colors active:scale-95"
            >
              ساخت شخصیت
            </button>
          </form>
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
              <div className="h-10 bg-zinc-800 rounded w-1/2 mx-auto shimmer" />
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
      <main className="pb-20">
        {renderContent()}
      </main>

      {/* Overlays */}
      {renderMenu()}
      {renderNotifications()}

      {/* Bottom Navigation */}
      {selectedChar === null && !isNavigating && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-cosmic-border z-50">
          <div className="flex justify-around items-center h-16 px-6">
            <button 
              onClick={() => setActiveTab("characters")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "characters" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <MessageSquare className={`w-6 h-6 ${activeTab === "characters" ? "fill-white" : ""}`} />
            </button>
            
            <button 
              onClick={() => setActiveTab("create")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "create" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <PlusCircle className={`w-6 h-6 ${activeTab === "create" ? "fill-white" : ""}`} />
            </button>
            
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "profile" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <User className={`w-6 h-6 ${activeTab === "profile" ? "fill-white" : ""}`} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}