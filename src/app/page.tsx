"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, PlusCircle, User, Search, Play, ChevronLeft, ChevronDown, Bell, MessageCircle, X } from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";

type LiveNotification = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: "system" | "success";
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("characters");
  const [selectedChar, setSelectedChar] = useState<any | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [onboardName, setOnboardName] = useState("");
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  
  // Navigation states
  const [showNotifications, setShowNotifications] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([
    { id: 1, title: 'سیستم', message: 'به شبکه آنیما خوش آمدید! پروفایل شما ساخته شد.', time: 'لحظاتی پیش', type: 'system' }
  ]);
  const refinementStatusRef = useRef<Record<string, string | undefined>>({});
  
  // Create form states
  const [createPrompt, setCreatePrompt] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Local state for Telegram user data
  const [telegramId, setTelegramId] = useState<string>("unknown");
  
  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const updateUserProfile = useMutation("users:updateUserProfile" as any);
  
  // Convex queries
  const charactersResult = useQuery("characters:listCharacters" as any, {});
  const characters = charactersResult?.characters || [];
  
  const forYouCharacters = useQuery("characters:getForYouCharacters" as any, telegramId !== "unknown" ? { telegramId, limit: 5 } : { limit: 5 });
  const myCharacters = useQuery("characters:getMyCharacters" as any, telegramId !== "unknown" ? { creatorId: telegramId } : "skip") || [];
  const categories = useQuery("categories:listCategories" as any, {});
  const user = useQuery("users:getUserByTelegramId" as any, telegramId !== "unknown" ? { telegramId } : "skip");
  
  const createPendingCharacter = useMutation("characters:createPending" as any);
  const triggerGeneration = useAction("actions/agent:triggerGeneration" as any);
  const updateCharacter = useMutation("characters:updateCharacter" as any);
  const generateUploadUrl = useMutation("characters:generateUploadUrl" as any);
  const getUploadUrl = useMutation("characters:getUploadUrl" as any);
  const triggerRefinement = useAction("actions/agent:triggerRefinement" as any);
  
  const [editingChar, setEditingChar] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSystemPrompt, setEditSystemPrompt] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editInstruction, setEditInstruction] = useState("");
  const [isSubmittingRefinement, setIsSubmittingRefinement] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (typeof window !== "undefined") {
      import("@twa-dev/sdk").then((module) => {
        const WebApp = module.default;
        if (WebApp.HapticFeedback) {
          if (['success', 'warning', 'error'].includes(type)) {
            WebApp.HapticFeedback.notificationOccurred(type as any);
          } else {
            WebApp.HapticFeedback.impactOccurred(type as any);
          }
        }
      }).catch(() => {});
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      
      const postUrl = await generateUploadUrl({});
      
      if (!postUrl) throw new Error("No upload URL returned");

      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();
      
      if (!storageId) throw new Error("No storageId returned");

      const url = await getUploadUrl({ storageId });
      if (url) {
        setEditImageUrl(url);
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("آپلود تصویر با خطا مواجه شد.");
    } finally {
      setUploadingImage(false);
    }
  };

  const historyResult = useQuery("conversations:listUserConversations" as any, user ? { userId: user._id, pageSize: 20 } : "skip");
  const history = historyResult?.conversations;

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@twa-dev/sdk").then((module) => {
        const WebApp = module.default;
        if (WebApp.initData) {
          WebApp.ready();
          WebApp.expand();
          try {
            WebApp.setHeaderColor('#09090b');
            WebApp.setBackgroundColor('#09090b');
          } catch(e) {}

          const user = WebApp.initDataUnsafe?.user;
          if (user?.id) {
            setTelegramId(user.id.toString());
          }
        }
      });
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const nextStatuses: Record<string, string | undefined> = {};
    const notifications: LiveNotification[] = [];

    for (const char of myCharacters) {
      const id = String(char._id);
      const previous = refinementStatusRef.current[id];
      nextStatuses[id] = char.refinementStatus;

      if (previous === "running" && char.refinementStatus === "completed") {
        notifications.push({
          id: Date.now() + notifications.length,
          title: 'ریفاینر',
          message: `ویرایش «${char.name}» کامل شد و نسخه جدید آماده است.`,
          time: 'همین حالا',
          type: 'success'
        });
        triggerHaptic('success');
      }

      if (previous === "running" && char.refinementStatus === "failed") {
        notifications.push({
          id: Date.now() + notifications.length,
          title: 'ریفاینر',
          message: `ویرایش «${char.name}» ناموفق بود.`,
          time: 'همین حالا',
          type: 'system'
        });
        triggerHaptic('error');
      }
    }

    refinementStatusRef.current = nextStatuses;
    if (notifications.length > 0) {
      setLiveNotifications((prev) => [...notifications, ...prev]);
    }
  }, [myCharacters]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPrompt || isSubmitting) return;
    
    triggerHaptic('medium');
    setIsSubmitting(true);
    
    try {
      const characterId = await createPendingCharacter({
        prompt: createPrompt,
        creatorId: telegramId !== "unknown" ? telegramId : "guest",
        creatorName: user?.username || "ناشناس",
        isPublic: isPublic
      });
      
      // Scroll to gallery
      const gallery = document.getElementById('gallery-section');
      if (gallery) {
        gallery.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Clear form
      setCreatePrompt("");
      setIsSubmitting(false);
      
      // Trigger background generation
      await triggerGeneration({
        characterId,
        prompt: createPrompt,
        creatorId: telegramId !== "unknown" ? telegramId : "guest",
        isPublic: isPublic
      });
      triggerHaptic('success');
      
    } catch (e) {
      console.error(e);
      alert("خطایی در ارتباط با سرور رخ داد.");
      triggerHaptic('error');
      setIsSubmitting(false);
    }
  };

  const handleUpdateCharacter = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!editingChar || !editName.trim() || !editDesc.trim() || !editSystemPrompt.trim()) return;
    try {
      await updateCharacter({
        characterId: editingChar._id,
        name: editName.trim(),
        description: editDesc.trim(),
        systemPrompt: editSystemPrompt,
        isPublic: editIsPublic,
        imageUrl: editImageUrl
      });
      setEditingChar(null);
    } catch (e) {
      console.error(e);
      alert("خطا در ذخیره تغییرات.");
    }
  };

  const handleRefineCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChar || !editInstruction.trim() || isSubmittingRefinement) return;

    if (!editingChar.agentGoRunId) {
      alert("این شخصیت شناسه اجرای Agent-Go ندارد و با ریفاینر قابل ویرایش خودکار نیست.");
      triggerHaptic('warning');
      return;
    }

    setIsSubmittingRefinement(true);
    triggerHaptic('medium');

    try {
      await triggerRefinement({
        characterId: editingChar._id,
        creatorId: telegramId !== "unknown" ? telegramId : "guest",
        instruction: editInstruction.trim(),
      });

      setLiveNotifications((prev) => [
        {
          id: Date.now(),
          title: 'ریفاینر',
          message: `درخواست ویرایش «${editingChar.name}» در پس‌زمینه شروع شد. بعد از اتمام اطلاع می‌دهیم.`,
          time: 'همین حالا',
          type: 'system'
        },
        ...prev,
      ]);
      setEditInstruction("");
      setEditingChar(null);
      triggerHaptic('success');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "خطا در شروع ویرایش هوشمند.");
      triggerHaptic('error');
    } finally {
      setIsSubmittingRefinement(false);
    }
  };

  const handleCharClick = (char: any) => {
    triggerHaptic('light');
    setIsNavigating(true);
    // Simulate the neural loading cycle (shimmer skeleton) before showing character detail
    setTimeout(() => {
      setSelectedChar(char);
      setIsNavigating(false);
    }, 1200);
  };

  const handleStartChat = async () => {
    triggerHaptic('heavy');
    if (typeof window !== "undefined") {
      const module = await import("@twa-dev/sdk");
      const WebApp = module.default;
      
      const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "assistantproaibot";
      
      try {
        // Most reliable way: Deep linking
        WebApp.openTelegramLink(`https://t.me/${botUsername}?start=chat_${selectedChar._id}`);
        setTimeout(() => {
          try { WebApp.close(); } catch(err) {}
        }, 50);
      } catch (e) {
        // Fallback
        if (WebApp.initData) {
          WebApp.sendData(JSON.stringify({ action: "start_chat", characterId: selectedChar._id }));
          WebApp.close();
        }
      }
    }
  };

  

  const renderNotifications = () => {
    if (!showNotifications) return null;
    return (
      <div className="fixed inset-0 z-[100] flex">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
        <div className="relative w-full max-w-md mx-auto bg-cosmic-dark border-t border-cosmic-border h-[60vh] mt-auto rounded-t-3xl px-[15px] py-6 animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-dana font-bold">اعلان‌ها</h2>
            <button onClick={() => { triggerHaptic('light'); setShowNotifications(false); }} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 transition-transform">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {liveNotifications.map(notif => (
              <div key={notif.id} className="px-[15px] py-4 rounded-xl border border-cosmic-border bg-cosmic-surface">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${notif.type === 'success' ? 'bg-brand-lime' : 'bg-brand-blue'}`}></span>
                  <span className={`text-xs font-dana font-bold ${notif.type === 'success' ? 'text-brand-lime' : 'text-brand-blue'}`}>{notif.title}</span>
                </div>
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-zinc-500 mt-2">{notif.time}</p>
              </div>
            ))}
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
        <div className="px-[15px] py-4 min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-28 h-28 rounded-full shimmer mb-6 border border-cosmic-border"></div>
          <div className="h-6 w-48 shimmer rounded-md mb-3"></div>
          <div className="h-4 w-32 shimmer rounded-md mb-8"></div>
          <div className="flex gap-2 mb-8">
             <div className="h-6 w-16 shimmer rounded-full"></div>
             <div className="h-6 w-16 shimmer rounded-full"></div>
          </div>
          <div className="h-14 w-full max-w-[280px] shimmer rounded-xl"></div>
          <p className="mt-8 text-xs font-mono text-zinc-500 tracking-widest uppercase">
            در حال همگام‌سازی شبکه عصبی...
          </p>
        </div>
      );
    }

    if (selectedChar !== null) {
      const char = selectedChar;

      return (
        <div className="fixed inset-0 z-[100] bg-cosmic-bg max-w-md mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="px-[15px] py-4 flex-none">
            <button 
              onClick={() => { triggerHaptic('light'); setSelectedChar(null); }}
              className="flex items-center text-zinc-400 hover:text-white transition-colors min-h-[44px] px-2 -ml-2 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 ml-1" />
              <span className="font-dana font-medium text-lg">بازگشت</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-[15px] py-4 flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-cosmic-border mb-4 bg-zinc-800 shrink-0">
              {char.imageUrl ? (
                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-500">
                  {char.name.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-dana font-bold mb-1">{char.name}</h2>
            {char.isPublic && char.creatorName && <p className="text-xs text-brand-lime mb-3 opacity-80">ساخته شده توسط @{char.creatorName}</p>}
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{char.description || char.tagline}</p>
            
            <div className="flex gap-2 justify-center mb-4 flex-wrap">
              {char.tags?.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-cosmic-surface border border-cosmic-border rounded-full text-xs text-brand-lime">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          
          <div className="px-[15px] pt-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] flex-none bg-cosmic-bg border-t border-cosmic-border/50 flex gap-3">
            {(char.creatorId === telegramId && telegramId !== "unknown") && (
              <button 
                onClick={() => {
                  setEditName(char.name);
                  setEditDesc(char.description);
                  setEditSystemPrompt(char.systemPrompt || "");
                  setEditImageUrl(char.imageUrl || "");
                  setEditIsPublic(char.isPublic !== false);
                  setEditInstruction("");
                  setEditingChar(char);
                  setSelectedChar(null);
                }}
                className="bg-zinc-800 text-white font-dana font-bold py-3.5 px-[15px] rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors active:scale-95 shrink-0"
              >
                ویرایش
              </button>
            )}

            <button 
              onClick={handleStartChat}
              className="w-full bg-brand-lime text-black font-dana font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#bbf771] transition-colors active:scale-95 shadow-[0_0_20px_rgba(163,230,53,0.3)]"
            >
              <Play className="w-5 h-5 fill-black" />
              <span className="text-base">شروع چت</span>
            </button>
          </div>
        </div>
      );
    }

    if (editingChar !== null) {
      return (
        <div className="fixed inset-0 z-[100] bg-cosmic-bg max-w-md mx-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="px-[15px] py-4 flex-none border-b border-cosmic-border/30">
            <button 
              onClick={() => { triggerHaptic('light'); setEditingChar(null); }}
              className="flex items-center text-zinc-400 hover:text-white transition-colors min-h-[44px] px-2 -ml-2 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 ml-1" />
              <span className="font-dana font-medium text-lg">بازگشت</span>
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto px-[15px] py-6 space-y-4">
              <h2 className="text-xl font-dana font-bold">ویرایش شخصیت</h2>

              <form onSubmit={handleRefineCharacter} className="rounded-2xl border border-brand-lime/25 bg-brand-lime/5 px-[15px] py-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <label className="block text-sm text-brand-lime font-dana font-bold">ویرایش هوشمند با Refiner</label>
                    {editingChar.refinementStatus === "running" && (
                      <span className="text-[10px] text-brand-lime font-mono animate-pulse">در حال پردازش...</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    فقط بگویید چه تغییری می‌خواهید؛ ریفاینر در پس‌زمینه پرامپت شخصیت را بازنویسی می‌کند و بعد از اتمام اطلاع می‌دهد.
                  </p>
                </div>
                <textarea
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-cosmic-border rounded-xl px-[15px] py-4 text-white focus:outline-none focus:border-brand-lime min-h-[120px] text-base resize-none transition-colors"
                  placeholder="مثلاً: این شخصیت را بامزه‌تر و پرانرژی‌تر کن، اما هویت اصلی و محدودیت‌های ایمنی را حفظ کن."
                  disabled={isSubmittingRefinement || editingChar.refinementStatus === "running"}
                />
                {editingChar.refinementStatus === "failed" && editingChar.refinementError && (
                  <p className="text-xs text-red-400 leading-relaxed">آخرین ویرایش ناموفق بود: {editingChar.refinementError}</p>
                )}
                {editingChar.refinementStatus === "completed" && editingChar.refinementSummary && (
                  <p className="text-xs text-brand-lime/90 leading-relaxed">آخرین ویرایش: {editingChar.refinementSummary}</p>
                )}
                {!editingChar.agentGoRunId && (
                  <p className="text-xs text-amber-300 leading-relaxed">این شخصیت هنوز شناسه Agent-Go ندارد؛ فعلاً فقط ذخیره دستی در دسترس است.</p>
                )}
                <button
                  type="submit"
                  disabled={!editInstruction.trim() || isSubmittingRefinement || editingChar.refinementStatus === "running" || !editingChar.agentGoRunId}
                  className="w-full bg-brand-lime disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-dana font-bold py-4 rounded-xl active:scale-95 transition-transform disabled:active:scale-100"
                >
                  {isSubmittingRefinement || editingChar.refinementStatus === "running" ? 'در حال شروع ویرایش...' : 'شروع ویرایش در پس‌زمینه'}
                </button>
              </form>

              <div className="border-t border-cosmic-border/40 pt-4">
                <p className="text-xs text-zinc-500 leading-relaxed">برای تغییرات سریع مثل نام، توضیح یا تصویر می‌توانید از فیلدهای دستی زیر استفاده کنید.</p>
              </div>

              {/* Image Upload Section at Top */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-lime/30 bg-zinc-800 flex items-center justify-center">
                    {editImageUrl ? (
                      <img src={editImageUrl} alt="Character" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-zinc-500 text-3xl">?</div>
                    )}
                  </div>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-brand-lime border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-xs text-zinc-400">برای تغییر تصویر کلیک کنید</span>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">نام شخصیت</label>
                <input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-cosmic-border rounded-xl px-[15px] py-4 text-white focus:outline-none focus:border-brand-lime text-base transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">توضیحات کوتاه</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-cosmic-border rounded-xl px-[15px] py-4 text-white focus:outline-none focus:border-brand-lime min-h-[120px] text-base resize-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">پرامپت شخصیت</label>
                <textarea
                  value={editSystemPrompt}
                  onChange={(e) => setEditSystemPrompt(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-cosmic-border rounded-xl px-[15px] py-4 text-white focus:outline-none focus:border-brand-lime min-h-[220px] text-sm leading-6 resize-y transition-colors ltr text-left"
                  placeholder="دستور رفتاری و شخصیتی کاراکتر را اینجا ویرایش کنید"
                  required
                />
                <p className="text-xs text-zinc-500 mt-2">این فیلد رفتار و شخصیت کاراکتر را کنترل می‌کند و با توضیح کوتاه متفاوت است.</p>
              </div>
              <div className="flex items-center justify-between bg-zinc-800/50 border border-cosmic-border rounded-xl px-[15px] py-4">
                <span className="text-sm">نمایش عمومی (Public)</span>
                <button
                  type="button"
                  onClick={() => setEditIsPublic(!editIsPublic)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${editIsPublic ? 'bg-brand-lime' : 'bg-zinc-600'}`}
                >
                  <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${editIsPublic ? 'bg-black left-7' : 'bg-white left-1'}`}></div>
                </button>
              </div>
            </div>
            <div className="flex-none border-t border-cosmic-border/50 bg-cosmic-bg px-[15px] pt-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]">
              <button
                type="button"
                onClick={handleUpdateCharacter}
                disabled={!editName.trim() || !editDesc.trim() || !editSystemPrompt.trim()}
                className="w-full bg-brand-lime disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-dana font-bold py-4 rounded-xl active:scale-95 transition-transform disabled:active:scale-100"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "characters") {
      const scenes = characters.slice(0, 6);
      const trending = characters.slice(0, 10);

      return (
        <div className="pb-6 px-[15px]">
          {/* Top Bar */}
          <header className="flex items-center gap-3 px-[15px] py-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="جستجو در شبکه..." 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pr-11 pl-4 text-base focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
            <button onClick={() => { triggerHaptic('light'); setShowNotifications(true); }} className="p-3 -ml-2 text-zinc-400 hover:text-white relative min-w-[44px] min-h-[44px] flex items-center justify-center">
              <Bell className="w-6 h-6" />
              {liveNotifications.length > 0 && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-brand-lime rounded-full border-2 border-background animate-pulse"></span>
              )}
            </button>
          </header>

          <div className="space-y-8 mt-2 px-[15px]">
            {/* For You Section (Uses Algorithm from DB) */}
            <section>
              <h2 className="text-lg font-dana font-bold mb-1">برای شما</h2>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">شخصیت‌ها دستیارهای مستقلی هستند که می‌توانید با آن‌ها گفتگو کنید.</p>
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-2 -mx-[15px] px-[15px]">
                {forYouCharacters === undefined ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="snap-start shrink-0 w-[85%] bg-cosmic-card border border-cosmic-border rounded-2xl px-[15px] py-4 flex gap-4 shimmer">
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
                      className="snap-start shrink-0 w-[85%] bg-cosmic-card border border-cosmic-border rounded-2xl px-[15px] py-4 flex gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="w-20 h-20 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                        {char.imageUrl ? (
                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-zinc-500 font-dana font-bold bg-zinc-800">{char.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-dana font-semibold text-base truncate">{char.name}</h3>
                        {char.creatorName || char.creatorId ? <p className="text-brand-lime/80 text-xs mt-0.5 truncate">توسط @{char.creatorName || char.creatorId}</p> : null}
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
              <div className="bg-brand-blue rounded-2xl px-[15px] py-4 flex items-center justify-between cursor-pointer shadow-lg shadow-brand-blue/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-dana font-bold text-xs">P</span>
                  </div>
                  <span className="text-white font-dana font-semibold text-sm">چت‌های بدون محدودیت</span>
                </div>
                <button className="bg-white text-brand-blue px-[15px] py-1.5 rounded-full text-sm font-dana font-bold">
                  تهیه اشتراک
                </button>
              </div>
            </section>

            {/* Scenes (Vertical portrait cards) */}
            <section>
              <h2 className="text-lg font-dana font-bold mb-1">صحنه‌ها</h2>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">صحنه‌ها فضاهای پیش‌فرضی برای شروع یک مکالمه خاص (مثل مصاحبه یا تمرین زبان) هستند.</p>
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-2 -mx-[15px] px-[15px]">
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
                        <h3 className="font-dana font-semibold text-sm leading-tight line-clamp-2">{char.name}</h3>
                        {char.creatorName || char.creatorId ? <p className="text-[10px] text-zinc-300 mt-1 truncate">@{char.creatorName || char.creatorId}</p> : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Popular / Trending Section */}
            <section>
              <h2 className="text-lg font-dana font-bold mb-3">محبوب‌ترین‌ها</h2>
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
                          <div className="w-full h-full flex items-center justify-center text-xl text-zinc-500 font-dana font-bold bg-zinc-800">{char.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-dana font-semibold text-sm truncate">{char.name}</h3>
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
        <div className="h-[calc(100dvh-4.5rem)] overflow-y-auto snap-y snap-mandatory no-scrollbar animate-in fade-in duration-300 mx-[15px] pb-4">
          {/* Section 1: Character Building Area */}
          <div className="min-h-full snap-start flex flex-col justify-center pb-12 pt-4 relative">
            <header className="mb-8 mt-2">
              <h1 className="text-2xl font-dana font-bold tracking-tight">ساخت شخصیت جدید</h1>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                توضیح دهید که چه شخصیتی با چه ویژگی‌هایی می‌خواهید. هوش مصنوعی آن را برای شما می‌سازد.
              </p>
            </header>

            <form onSubmit={handleCreateCharacter} className="space-y-6 transition-all duration-500 ease-in-out">
              <div>
                <label className="block text-sm text-zinc-300 mb-2 font-medium">توضیحات (Prompt)</label>
                <textarea 
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="مثلاً: یک فیلسوف بدبین که با طنز تلخ به سوالات جواب می‌دهد و به سبک قرن ۱۹ حرف می‌زند..."
                  className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl px-[15px] py-4 text-white focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime/50 min-h-[160px] placeholder:text-zinc-600 resize-none leading-relaxed text-base transition-all"
                  required
                />
              </div>
              
              <div className="flex items-center justify-between bg-cosmic-surface border border-cosmic-border rounded-xl px-[15px] py-4 transition-all">
                <div>
                  <span className="block text-sm font-medium text-white">شخصیت عمومی باشد؟</span>
                  <span className="block text-xs text-zinc-500 mt-1">امکان استفاده توسط سایر کاربران</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-brand-lime' : 'bg-zinc-600'}`}
                >
                  <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${isPublic ? 'bg-black left-7' : 'bg-white left-1'}`}></div>
                </button>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-dana font-bold py-4 rounded-xl transition-all ${isSubmitting ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-brand-lime text-black hover:bg-[#bbf771] active:scale-95 shadow-[0_0_20px_rgba(163,230,53,0.2)] hover:shadow-[0_0_25px_rgba(163,230,53,0.4)]'}`}
              >
                {isSubmitting ? 'در حال ارسال درخواست...' : 'تولید شخصیت با هوش مصنوعی'}
              </button>
            </form>

            <div 
              onClick={() => document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 animate-pulse cursor-pointer"
            >
              <span className="text-[10px] mb-1 font-mono uppercase tracking-widest">گالری من</span>
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>

          {/* Section 2: History & Gallery */}
          <div id="gallery-section" className="min-h-full snap-start pt-8 pb-20 flex flex-col">
            <header className="mb-6 flex-none">
              <h1 className="text-2xl font-dana font-bold tracking-tight text-brand-lime">گالری شخصیت‌ها</h1>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                تاریخچه و شخصیت‌هایی که تاکنون توسط شما خلق شده‌اند.
              </p>
            </header>
            
            <div className="flex-1">
               {myCharacters.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10 border border-dashed border-cosmic-border rounded-2xl bg-cosmic-surface/30">
                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                       <PlusCircle className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">شما هنوز شخصیتی نساخته‌اید.</p>
                      <p className="text-xs text-zinc-500 mt-1">به بالا برگردید و اولین شخصیت خود را بسازید.</p>
                    </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-4 pb-8">
                   {myCharacters.map((char: any) => (
                      <div 
                        key={char._id}
                        onClick={() => {
                          if (char.status !== "generating" && char.status !== "failed") {
                             handleCharClick(char);
                          }
                        }}
                        className={`bg-cosmic-surface border border-cosmic-border rounded-2xl overflow-hidden group transition-all duration-300 ${char.status === 'generating' || char.status === 'failed' ? 'cursor-default opacity-90' : 'cursor-pointer hover:border-brand-lime/50 hover:shadow-[0_0_15px_rgba(163,230,53,0.1)] hover:-translate-y-1'}`}
                      >
                         <div className="w-full aspect-[4/5] bg-zinc-800 relative">
                            {char.imageUrl && char.status !== "generating" ? (
                              <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl text-zinc-600 font-dana font-bold bg-zinc-900 group-hover:text-zinc-500 transition-colors">
                                {char.status === "generating" ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-brand-lime border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                ) : char.status === "failed" ? (
                                  <X className="w-8 h-8 text-red-500" />
                                ) : (
                                  char.name.charAt(0)
                                )}
                              </div>
                            )}
                            
                            {/* Processing Overlay if Generating */}
                            {char.status === "generating" && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center">
                                 <div className="w-8 h-8 border-2 border-brand-lime border-t-transparent rounded-full animate-spin mb-3"></div>
                                 <span className="text-xs text-brand-lime font-medium font-mono animate-pulse">
                                   {char.generationStage ? (
                                      char.generationStage === 'web_search' ? 'جستجو در وب...' :
                                      char.generationStage === 'drafting' ? 'در حال نوشتن...' :
                                      char.generationStage === 'refining' ? 'پردازش نهایی...' :
                                      char.generationStage === 'persona_generation' ? 'طراحی شخصیت...' :
                                      char.generationStage === 'image_generation' ? 'ساخت تصویر...' :
                                      char.generationStage === 'finalizing' ? 'آماده‌سازی نهایی...' :
                                      char.generationStage
                                   ) : 'آماده‌سازی...'}
                                 </span>
                                 <div className="w-full h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                                   <div className="h-full bg-brand-lime rounded-full w-1/2 animate-[pulse_2s_ease-in-out_infinite] origin-left"></div>
                                 </div>
                              </div>
                            )}

                            {char.status === "failed" && (
                              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center">
                                <X className="w-9 h-9 text-red-500 mb-3" />
                                <span className="text-xs text-red-400 font-dana font-bold">ساخت ناموفق بود</span>
                                <span className="text-[10px] text-zinc-400 mt-2 line-clamp-2">{char.description || "لطفاً دوباره تلاش کنید."}</span>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>
                            
                            <div className="absolute bottom-3 left-3 right-3 text-center">
                               <h3 className="font-dana font-bold text-sm text-white truncate drop-shadow-md">
                                 {char.status === "generating" ? "در حال ساخت..." : char.status === "failed" ? "خطا در ساخت" : char.name}
                               </h3>
                               {char.status === "failed" ? (
                                 <p className="text-[10px] text-red-400 mt-1 truncate">ساخت ناموفق</p>
                               ) : char.status !== "generating" && (
                                 <p className="text-[10px] text-zinc-400 mt-1 truncate">{char.isPublic ? 'عمومی' : 'خصوصی'}</p>
                               )}
                            </div>
                         </div>
                      </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "profile") {
      if (showHistory) {
        return (
          <div className="flex flex-col h-screen bg-cosmic-bg animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="px-[15px] py-4 flex-none border-b border-cosmic-border/30">
              <button 
                onClick={() => { triggerHaptic('light'); setShowHistory(false); }}
                className="flex items-center text-zinc-400 hover:text-white transition-colors min-h-[44px] px-2 -ml-2 active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 ml-1" />
                <span className="font-dana font-medium text-lg">بازگشت</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-[15px] py-4">
              <h2 className="text-xl font-dana font-bold mb-6">تاریخچه چت‌ها</h2>
              {!history ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-800 rounded-xl shimmer" />)}
                </div>
              ) : history?.length === 0 ? (
                <p className="text-zinc-500 text-center py-10">تاریخچه‌ای یافت نشد.</p>
              ) : (
                <div className="space-y-3">
                  {(history || []).map((conv: any) => {
                     const char = characters.find((c: any) => c._id === conv.characterId);
                     return (
                       <div key={conv._id} className="bg-cosmic-card border border-cosmic-border rounded-xl px-[15px] py-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                              {char?.imageUrl ? <img src={char.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{char?.name?.charAt(0) || '?'}</div>}
                           </div>
                           <div>
                             <h3 className="font-dana font-medium">{char?.name || 'شخصیت ناشناس'}</h3>
                             <p className="text-xs text-zinc-500">{new Date(conv.updatedAt || conv.createdAt).toLocaleDateString('fa-IR')}</p>
                             {conv.lastMessagePreview && <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{conv.lastMessagePreview}</p>}
                           </div>
                         </div>
                       </div>
                     );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="px-[15px] py-4 animate-in fade-in duration-300">
          <header className="mb-6 mt-2">
            <h1 className="text-xl font-dana font-bold tracking-tight">حساب کاربری</h1>
          </header>

          <div className="bg-cosmic-card border border-cosmic-border rounded-xl px-[15px] py-6 text-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-lime"></div>
                        {isEditingProfile ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (editUsername && user) {
                  await updateUserProfile({ telegramId, username: editUsername });
                  setIsEditingProfile(false);
                }
              }} className="flex flex-col gap-2 mt-2">
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)} 
                  placeholder="نام کاربری جدید"
                  className="bg-zinc-800 text-center text-white border border-brand-lime/50 rounded-lg py-3 text-base focus:outline-none focus:border-brand-lime transition-colors"
                />
                <div className="flex gap-3 mt-2">
                  <button type="submit" className="flex-1 bg-brand-lime text-black rounded-lg py-3 font-bold text-base active:scale-95 transition-transform">ذخیره</button>
                  <button type="button" onClick={() => { triggerHaptic('light'); setIsEditingProfile(false); }} className="flex-1 bg-zinc-700 text-white rounded-lg py-3 font-bold text-base active:scale-95 transition-transform">لغو</button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-zinc-400 mb-2">شناسه شما</p>
                {user === undefined && telegramId !== "unknown" ? (
                  <div className="h-8 bg-zinc-800 rounded w-1/2 mx-auto shimmer" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl font-bold font-mono text-brand-lime truncate">
                      {user?.username ? `@${user.username}` : telegramId}
                    </div>
                    {user && (
                      <button onClick={() => { triggerHaptic('light'); setEditUsername(user.username || ""); setIsEditingProfile(true); }} className="text-zinc-500 hover:text-white p-3 -m-2 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            {user?.onboarded ? (
               <span className="inline-block mt-3 px-3 py-1 bg-brand-lime/10 border border-brand-lime/30 rounded-full text-xs text-brand-lime">
                 ✓ ثبت‌نام شده
               </span>
            ) : (
               <span className="inline-block mt-3 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-400">
                 کاربر مهمان
               </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="w-full bg-cosmic-surface border border-brand-lime/20 rounded-xl px-[15px] py-4 flex justify-between items-center relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-lime"></div>
              <div className="flex flex-col text-right">
                <span className="font-dana font-bold text-brand-lime text-sm">وضعیت شبکه‌سازی</span>
                <span className="text-xs text-zinc-400 mt-1">{myCharacters.length} شخصیت فعال (Live)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-lime bg-brand-lime/10 px-2 py-1 rounded-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
                </span>
                متصل
              </div>
            </div>

            <button onClick={() => { triggerHaptic('light'); setShowHistory(true); }} className="w-full bg-cosmic-card border border-cosmic-border rounded-xl px-[15px] py-4 flex justify-between items-center hover:bg-zinc-800 transition-all active:scale-[0.98]">
              <span className="text-sm font-medium">تاریخچه چت‌ها</span>
              <ChevronLeft className="w-5 h-5 text-zinc-500" />
            </button>
            
          </div>
        </div>
      );
    }
  };

  if (user && !user.name) {
    return (
      <div className="min-h-[100dvh] relative max-w-md mx-auto border-x border-cosmic-border/30 bg-background flex flex-col justify-center items-center px-6">
        <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-brand-lime/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-brand-lime" />
          </div>
          <h1 className="text-2xl font-dana font-bold mb-4">سلام! 👋</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed text-sm">
            قبل از هر چیز باید بدونی که تو این کمپانی هیچ‌کس، مطلقاً هیچ‌کس، به چت‌های تو با هوش مصنوعی دسترسی نداره و حریم خصوصی تو کاملاً حفظ میشه. 🔒
            <br/><br/>
            حالا لطفاً اسمت رو برام بنویس تا بیشتر با هم آشنا بشیم:
          </p>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (onboardName.trim().length >= 2) {
              setIsSubmittingName(true);
              try {
                await updateUserProfile({ telegramId, name: onboardName.trim() });
              } finally {
                setIsSubmittingName(false);
              }
            }
          }} className="space-y-4 w-full">
            <input 
              type="text" 
              value={onboardName}
              onChange={(e) => setOnboardName(e.target.value)}
              placeholder="نام شما..."
              className="w-full bg-cosmic-surface border border-cosmic-border rounded-xl px-4 py-4 text-center text-white focus:outline-none focus:border-brand-lime transition-all"
              required
              minLength={2}
            />
            <button 
              type="submit" 
              disabled={isSubmittingName || onboardName.trim().length < 2}
              className="w-full bg-brand-lime text-black font-bold py-4 rounded-xl disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmittingName ? 'در حال ثبت...' : 'شروع کنیم'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative max-w-md mx-auto border-x border-cosmic-border/30 bg-background pt-[env(safe-area-inset-top)]">
      <main className="pb-24">
        {renderContent()}
      </main>

      {/* Overlays */}
      {renderNotifications()}

      {/* Bottom Navigation */}
      {selectedChar === null && !isNavigating && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-cosmic-border z-50 pb-[env(safe-area-inset-bottom)] pt-1">
          <div className="flex justify-around items-center h-16 px-[15px]">
            <button 
              onClick={() => { triggerHaptic('light'); setActiveTab("characters"); }}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === "characters" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <MessageSquare className={`w-6 h-6 transition-all ${activeTab === "characters" ? "fill-white/20" : ""}`} />
            </button>
            
            <button 
              onClick={() => { triggerHaptic('light'); setActiveTab("create"); }}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === "create" ? "text-brand-lime" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <PlusCircle className={`w-7 h-7 transition-all ${activeTab === "create" ? "fill-brand-lime/20 shadow-[0_0_15px_rgba(163,230,53,0.3)] rounded-full" : ""}`} />
            </button>
            
            <button 
              onClick={() => { triggerHaptic('light'); setActiveTab("profile"); }}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === "profile" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <User className={`w-6 h-6 transition-all ${activeTab === "profile" ? "fill-white/20" : ""}`} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}