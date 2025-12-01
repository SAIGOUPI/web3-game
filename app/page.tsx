"use client";

import React, { useState, useEffect, useRef } from 'react';
// 1. Import Firebase dependencies
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc } from "firebase/firestore";
// 2. Import configuration
import { db } from './firebaseConfig';

// === Multilingual Configuration ===
const TRANSLATIONS = {
  zh: {
    title: "Web3 创业模拟器",
    totalAssets: "总资产",
    perSecond: "每秒 (自动产出)",
    clickButton: "搞钱",
    clickDesc: "编写代码",
    storeTitle: "黑市交易",
    leaderboardTitle: "巨鲸排行榜",
    waiting: "正在扫描链上数据...",
    locked: "达到 $100,000 解锁 NFT 铸造权限",
    effect: "效果",
    sec: "秒",
    notEnough: "资金不足，快去手撸！",
    you: " (你)",
    workspace: "联合办公空间 (开发团队)"
  },
  en: {
    title: "Web3 Founder Sim",
    totalAssets: "Net Worth",
    perSecond: "/ sec (Passive)",
    clickButton: "HUSTLE",
    clickDesc: "Write Code",
    storeTitle: "Black Market",
    leaderboardTitle: "Whale Alert",
    waiting: "Scanning Mempool...",
    locked: "Reach $100,000 to unlock NFT Minting",
    effect: "Effect",
    sec: "s",
    notEnough: "Insufficient funds!",
    you: " (You)",
    workspace: "Co-working Space (Dev Team)"
  }
};

// === Upgrade Item Data (Bilingual + Images) ===
const INITIAL_UPGRADES = [
  { 
    id: 1, 
    name: { zh: '冰美式咖啡', en: 'Iced Americano' }, 
    cost: 15, 
    rate: 1, 
    type: 'auto', 
    desc: { zh: '提神醒脑，每秒自动赚 $1', en: 'Caffeine boost, +$1/s' },
    // Use seed to generate consistent pixel art images
    image: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=coffee' 
  },
  { 
    id: 2, 
    name: { zh: '机械键盘', en: 'Mech Keyboard' }, 
    cost: 100, 
    rate: 5, 
    type: 'auto', 
    desc: { zh: '劈里啪啦，每秒自动赚 $5', en: 'Clicky clacky, +$5/s' },
    image: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=keyboard'
  },
  { 
    id: 3, 
    name: { zh: '实习生', en: 'Intern' }, 
    cost: 500, 
    rate: 20, 
    type: 'auto', 
    desc: { zh: '便宜好用，每秒自动赚 $20', en: 'Cheap labor, +$20/s' },
    image: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=intern'
  },
  { 
    id: 4, 
    name: { zh: 'GPT-4 会员', en: 'GPT-4 Sub' }, 
    cost: 2000, 
    rate: 100, 
    type: 'auto', 
    desc: { zh: 'AI 赋能，每秒自动赚 $100', en: 'AI Powered, +$100/s' },
    image: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=gpt4'
  },
  { 
    id: 5, 
    name: { zh: 'CTO 大佬', en: 'Chief Tech Officer' }, 
    cost: 10000, 
    rate: 500, 
    type: 'auto', 
    desc: { zh: '架构重构，每秒自动赚 $500', en: 'Refactoring, +$500/s' },
    image: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=cto'
  },
];

export default function FounderSimulator() {
  // === State Definitions ===
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [balance, setBalance] = useState(0); 
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0); 
  const [clickPower, setClickPower] = useState(1); 
  const [autoRate, setAutoRate] = useState(0); 
  const [inventory, setInventory] = useState<Record<number, number>>({});
  const [userId, setUserId] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Added: Loading state flag (prevents initial data from overwriting save file)
  const [isLoaded, setIsLoaded] = useState(false);

  // Added: Matrix rain animation state
  const [matrixDrops, setMatrixDrops] = useState<{id: number, left: number, delay: number, duration: number, text: string}[]>([]);

  // Added: Use Ref to track latest score, solving timer closure issues
  const lifetimeEarningsRef = useRef(lifetimeEarnings);
  const lastSavedScoreRef = useRef(0);

  const t = TRANSLATIONS[lang];

  // === 1. Initialize User ID ===
  useEffect(() => {
    let storedId = localStorage.getItem("founder_id");
    if (!storedId) {
        storedId = "Dev_" + Math.floor(Math.random() * 10000);
        localStorage.setItem("founder_id", storedId);
    }
    setUserId(storedId);
  }, []);

  // === 2. Core: Load Save Game ===
  useEffect(() => {
    const saved = localStorage.getItem("founder_gameState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBalance(parsed.balance ?? 0);
        setLifetimeEarnings(parsed.lifetimeEarnings ?? 0);
        setClickPower(parsed.clickPower ?? 1);
        setAutoRate(parsed.autoRate ?? 0);
        setInventory(parsed.inventory ?? {});
      } catch (e) {
        console.error("Save file corrupted, resetting game", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // === 3. Core: Auto-save (Local Storage) ===
  useEffect(() => {
    if (!isLoaded) return;
    const gameState = {
      balance,
      lifetimeEarnings,
      clickPower,
      autoRate,
      inventory,
      timestamp: Date.now()
    };
    localStorage.setItem("founder_gameState", JSON.stringify(gameState));
  }, [balance, lifetimeEarnings, clickPower, autoRate, inventory, isLoaded]);

  // === 4. Sync Ref (For Firebase periodic upload) ===
  useEffect(() => {
    lifetimeEarningsRef.current = lifetimeEarnings;
  }, [lifetimeEarnings]);

  // === Initialize Matrix Rain Data ===
  useEffect(() => {
    const drops = Array.from({ length: 30 }).map((_, i) => {
      const randomText = Array.from({ length: 20 })
        .map(() => Math.random() > 0.5 ? '1' : '0')
        .join('');
      
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * -20,
        duration: 5 + Math.random() * 10,
        text: randomText
      };
    });
    setMatrixDrops(drops);
  }, []);

  // === Firebase Listener ===
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setLeaderboard(data);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  // === Firebase Upload (Throttled at fixed interval) ===
  useEffect(() => {
    if (!db || !userId) return;

    // Check every 5 seconds; timer won't be interrupted regardless of click speed
    const saveInterval = setInterval(async () => {
        const currentScore = lifetimeEarningsRef.current;
        const lastSaved = lastSavedScoreRef.current;

        // Only upload if score changed and is greater than 0
        if (currentScore > 0 && currentScore !== lastSaved) {
            try {
                await setDoc(doc(db, "leaderboard", userId), {
                    wallet: userId,
                    score: currentScore,
                    updatedAt: Date.now()
                });
                // Update saved score record
                lastSavedScoreRef.current = currentScore;
            } catch (e) { console.error("Upload failed", e); }
        }
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [userId]); // Depends only on userId, starts once on mount/ID generation

  // === Game Loop ===
  useEffect(() => {
    const timer = setInterval(() => {
      if (autoRate > 0) {
        setBalance((prev) => prev + autoRate);
        setLifetimeEarnings((prev) => prev + autoRate);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRate]);

  // === Interaction Logic ===
  const handleClick = () => {
    setBalance((prev) => prev + clickPower);
    setLifetimeEarnings((prev) => prev + clickPower);
  };

  const buyUpgrade = (upgrade: any) => {
    const currentCount = inventory[upgrade.id] || 0;
    const currentCost = Math.floor(upgrade.cost * Math.pow(1.15, currentCount));

    if (balance >= currentCost) {
      setBalance((prev) => prev - currentCost);
      setInventory((prev) => ({ ...prev, [upgrade.id]: currentCount + 1 }));
      if (upgrade.type === 'auto') {
        setAutoRate((prev) => prev + upgrade.rate);
      }
    } else {
      alert(t.notEnough);
    }
  };

  const getCost = (baseCost: number, id: number) => {
    const count = inventory[id] || 0;
    return Math.floor(baseCost * Math.pow(1.15, count));
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const fontStyle = lang === 'en' ? { fontFamily: 'Consolas, monospace' } : {};

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] text-white p-4 flex flex-col transition-all duration-300 overflow-hidden relative"
      style={fontStyle}
    >
      {/* Inject animation styles */}
      <style>{`
        @keyframes code-fall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes work-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {/* Language Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleLang}
          className="bg-black/50 backdrop-blur border border-fuchsia-500 text-fuchsia-400 px-4 py-1 skew-x-[-10deg] hover:bg-fuchsia-500 hover:text-white transition-all uppercase font-bold text-xs tracking-widest shadow-[0_0_10px_rgba(217,70,239,0.5)]"
        >
          {lang === 'en' ? 'CN / 英文' : 'EN / 中文'}
        </button>
      </div>

      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Content Area (Action + Store) - Adjust height to leave room for bottom bar */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 mb-32 z-10">
        
        {/* --- Left: Core Action Area (Magenta Theme) --- */}
        <div className="flex-1 bg-black/40 backdrop-blur-md rounded-[2rem_0_2rem_0] p-8 border-2 border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.15)] flex flex-col items-center justify-center relative overflow-hidden -rotate-1 hover:rotate-0 transition-transform duration-500">
          
          {/* ID Display */}
          <div className="absolute top-4 left-4 text-[10px] text-fuchsia-500/50 font-mono tracking-[0.2em] z-20">
              ID: {userId} // SYSTEM_READY
          </div>

          {/* Dynamic Background Matrix Rain (Updated) */}
          <div className="absolute inset-0 opacity-20 pointer-events-none select-none overflow-hidden">
            {matrixDrops.map((drop) => (
              <div 
                key={drop.id} 
                className="absolute top-0 text-[10px] text-fuchsia-500 font-mono leading-none break-all"
                style={{ 
                  left: `${drop.left}%`,
                  animation: `code-fall ${drop.duration}s linear infinite`,
                  animationDelay: `${drop.delay}s`,
                  writingMode: 'vertical-rl', // Vertical writing mode
                  textOrientation: 'upright'  // Upright characters
                }}
              >
                {drop.text}
              </div>
            ))}
          </div>

          {/* Stat Display */}
          <div className="z-10 text-center mb-10 transform skew-x-[-5deg]">
            <h2 className="text-fuchsia-400 text-xs font-black uppercase tracking-[0.3em] mb-2 drop-shadow-lg">{t.totalAssets}</h2>
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 mb-2 tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
              ${balance.toLocaleString()}
            </div>
            <div className="text-cyan-400 text-sm font-bold bg-cyan-900/30 px-3 py-1 rounded inline-block border border-cyan-500/30">
              +${autoRate} {t.perSecond}
            </div>
          </div>

          {/* Click Button */}
          <button
            onClick={handleClick}
            className="z-10 w-56 h-56 rounded-full bg-gradient-to-br from-gray-900 to-black border-[6px] border-fuchsia-500 flex flex-col items-center justify-center transition-all shadow-[0_0_50px_rgba(217,70,239,0.4)] group active:scale-95 active:shadow-[0_0_80px_rgba(217,70,239,0.8)] relative overflow-hidden"
          >
            {/* Button inner glow */}
            <div className="absolute inset-0 bg-fuchsia-500/10 rounded-full animate-pulse group-hover:bg-fuchsia-500/20"></div>
            
            <span className="text-5xl group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">🚀</span>
            <span className="mt-3 text-xs text-fuchsia-300 font-bold tracking-widest uppercase">{t.clickDesc}</span>
            <span className="text-lg text-white font-black mt-1 group-hover:text-fuchsia-200">+{clickPower} {t.clickButton}</span>
          </button>
        </div>

        {/* --- Right: Store & Leaderboard (Purple/Cyan Theme) --- */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 rotate-1 hover:rotate-0 transition-transform duration-500 h-[calc(100vh-8rem)]">
          
          {/* Store Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-[0_2rem_0_2rem] p-6 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] relative">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 mb-6 border-b-2 border-purple-500/20 pb-4 uppercase tracking-tighter italic">
                {t.storeTitle}
              </h3>

              <div className="space-y-4">
              {INITIAL_UPGRADES.map((item) => {
                  const currentCost = getCost(item.cost, item.id);
                  const canAfford = balance >= currentCost;
                  const count = inventory[item.id] || 0;

                  return (
                  <div 
                      key={item.id} 
                      className={`group relative p-3 border-2 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-[0_5px_15px_rgba(0,0,0,0.5)] ${
                      canAfford 
                          ? 'bg-gray-900/80 border-purple-500/50 hover:border-fuchsia-400 hover:bg-gray-800 cursor-pointer rounded-tr-xl rounded-bl-xl' 
                          : 'bg-black/50 border-gray-800 opacity-60 cursor-not-allowed grayscale rounded-lg'
                      }`}
                      onClick={() => canAfford && buyUpgrade(item)}
                  >
                      <div className="flex gap-4 items-center">
                          {/* Item Image */}
                          <div className={`w-16 h-16 flex-shrink-0 bg-black rounded border ${canAfford ? 'border-purple-500' : 'border-gray-700'} overflow-hidden relative`}>
                            <img 
                              src={item.image} 
                              alt={item.name[lang]} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {/* Level Badge */}
                            <div className="absolute bottom-0 right-0 bg-purple-600 text-white text-[10px] px-1 font-bold">
                              Lv.{count}
                            </div>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-lg group-hover:text-fuchsia-300 transition-colors">{item.name[lang]}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 truncate font-mono">{item.desc[lang]}</div>
                            <div className="text-xs text-cyan-400 mt-1 font-bold shadow-cyan-500/20">
                                {t.effect}: <span className="text-white">+${item.rate}/{t.sec}</span>
                            </div>
                          </div>

                          {/* Buy Button */}
                          <button 
                          className={`px-4 py-3 font-black text-sm whitespace-nowrap skew-x-[-10deg] transition-all shadow-lg ${
                              canAfford 
                              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500 shadow-purple-500/30' 
                              : 'bg-gray-800 text-gray-500'
                          }`}
                          >
                          <span className="skew-x-[10deg] inline-block">${currentCost.toLocaleString()}</span>
                          </button>
                      </div>
                  </div>
                  );
              })}
              </div>
              
              <div className="mt-8 p-4 border-2 border-dashed border-gray-700 rounded-lg text-center opacity-70 bg-black/30">
                <p className="text-xs text-gray-500 uppercase tracking-widest">🔒 {t.locked}</p>
              </div>
          </div>

          {/* Leaderboard Section */}
          <div className="bg-black/40 backdrop-blur-md rounded-[2rem_0_2rem_0] p-6 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <h3 className="text-xl font-black text-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-tight border-b border-cyan-500/20 pb-2">
                  <span className="animate-bounce">🏆</span> {t.leaderboardTitle}
              </h3>
              
              {!db ? (
                  <div className="text-xs text-cyan-500/50 p-4 text-center border border-dashed border-cyan-900 rounded font-mono">
                      [ SYSTEM OFFLINE ]<br/>Connect Firebase
                  </div>
              ) : (
                  <div className="space-y-2 font-mono">
                      {leaderboard.length === 0 && (
                          <div className="text-cyan-500/50 text-sm text-center py-4 animate-pulse">{t.waiting}</div>
                      )}
                      {leaderboard.map((player, index) => (
                          <div 
                              key={player.id} 
                              className={`flex justify-between items-center p-2 border-l-2 transform transition-all hover:pl-4 ${
                                  player.id === userId 
                                  ? 'bg-cyan-900/20 border-cyan-400 text-cyan-100' 
                                  : 'bg-gray-900/30 border-gray-700 text-gray-400 hover:bg-gray-800'
                              }`}
                          >
                              <div className="flex items-center gap-3">
                                  <span className={`font-black w-6 text-center italic ${
                                      index === 0 ? 'text-yellow-400 text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 
                                      index === 1 ? 'text-gray-300 text-md' :
                                      index === 2 ? 'text-orange-400 text-md' : 'text-gray-600 text-xs'
                                  }`}>
                                      {index === 0 ? '1ST' : index === 1 ? '2ND' : index === 2 ? '3RD' : `#${index + 1}`}
                                  </span>
                                  <span className={`text-xs tracking-tight ${player.id === userId ? 'text-cyan-300 font-bold' : ''}`}>
                                      {player.wallet || player.id}
                                      {player.id === userId && <span className="text-[10px] ml-1 opacity-70">{t.you}</span>}
                                  </span>
                              </div>
                              <span className="text-cyan-400 font-bold text-sm">
                                  ${player.score?.toLocaleString()}
                              </span>
                          </div>
                      ))}
                  </div>
              )}
          </div>

        </div>
      </div>

      {/* --- NEW: Bottom Workspace Animation Area --- */}
      <div className="fixed bottom-0 left-0 right-0 h-28 bg-black/80 backdrop-blur-lg border-t-2 border-green-500/50 z-40 flex items-end p-2 overflow-x-auto custom-scrollbar gap-2 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        <div className="absolute top-2 left-4 text-[10px] text-green-500 uppercase tracking-widest font-mono border border-green-500/30 px-2 py-0.5 rounded bg-green-900/20">
          {t.workspace}
        </div>
        
        {/* Render characters based on inventory */}
        {INITIAL_UPGRADES.map(item => {
          const count = inventory[item.id] || 0;
          if (count === 0) return null;
          
          // Limit rendering to prevent performance issues (max 6 per type)
          const renderCount = Math.min(count, 6);
          const hasMore = count > 6;

          return (
            <div key={item.id} className="flex gap-1 items-end mx-2 group relative">
              {Array.from({ length: renderCount }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-12 h-12 relative transition-all hover:scale-110"
                  style={{ 
                    animation: `work-bounce ${0.5 + Math.random()}s infinite ease-in-out`,
                    animationDelay: `${Math.random() * -1}s`
                  }}
                >
                  <img 
                    src={item.image} 
                    alt="worker" 
                    className="w-full h-full object-cover rounded border border-green-500/30 shadow-[0_0_10px_rgba(0,255,0,0.1)]"
                  />
                  {/* Floating particles effect could go here */}
                </div>
              ))}
              
              {/* Show counter if truncated */}
              {hasMore && (
                <div className="h-12 flex items-center justify-center bg-gray-800 text-xs text-green-400 font-bold px-2 rounded border border-gray-700">
                  +{count - 6}
                </div>
              )}
              
              {/* Tooltip for the group */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                {item.name[lang]} x {count}
              </div>
            </div>
          );
        })}
        
        {/* Empty state placeholder */}
        {Object.keys(inventory).length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-mono animate-pulse">
            [ WAITING FOR RECRUITMENT... ]
          </div>
        )}
      </div>

    </div>
  );
}