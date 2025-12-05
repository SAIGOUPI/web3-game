"use client";

import React, { useState, useEffect, useRef } from 'react';
// 1. Firebase Imports
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc } from "firebase/firestore";
import { db } from './firebaseConfig';
// 2. Web3 Imports
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// 3. Metaplex Umi Imports
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount } from '@metaplex-foundation/umi';
import SolanaProvider from './web3/SolanaProvider';

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
    lockedTitle: "NFT 成就系统",
    lockedDesc: "总资产达到 $100,000 解锁",
    mintBtn: "铸造独角兽 NFT",
    minting: "正在链上铸造...",
    minted: "已拥有独角兽 NFT",
    viewProof: "查看 NFT 详情",
    effect: "效果",
    sec: "秒",
    notEnough: "资金不足，快去手撸！",
    you: " (你)",
    workspace: "联合办公空间 (开发团队)",
    connectWallet: "连接钱包",
    mintSuccess: "铸造成功！你的专属 NFT 已发放到钱包。",
    reset: "重置数据 (调试)",
    // Modal Texts
    sysNotice: "系统通知 // SYSTEM_NOTICE",
    sysWarning: "系统警告 // SYSTEM_WARNING",
    sysInput: "身份覆写 // IDENTITY_OVERRIDE",
    confirm: "确认执行",
    cancel: "取消操作",
    connectFirst: "请先连接钱包！",
    mintFailed: "铸造失败",
    resetConfirm: "确定要重置所有游戏进度吗？此操作不可逆！",
    enterName: "请输入新的黑客代号 (Max 12):",
    // Tutorial (Missing keys restored)
    tutorialNext: "下一步 // NEXT",
    tutorialFinish: "开始创业 // START",
    step1Title: "系统接入: 核心循环",
    step1Desc: "点击左侧按钮编写代码。每一行代码价值 $1。这是你的原始资本积累方式。",
    step2Title: "资源扩张: 黑市交易",
    step2Desc: "在右侧商店购买咖啡、键盘或雇佣员工。他们会自动为你产出代码，实现躺赚。",
    step3Title: "终极目标: 链上成就",
    step3Desc: "当资产达到 $100,000 时，连接 Phantom 钱包 (仅限 Solana Devnet) 铸造你的独角兽 NFT 勋章！"
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
    lockedTitle: "NFT Achievement",
    lockedDesc: "Reach $100,000 to Unlock",
    mintBtn: "Mint Unicorn NFT",
    minting: "Minting on Chain...",
    minted: "Unicorn NFT Owned",
    viewProof: "View NFT on Solscan",
    effect: "Effect",
    sec: "s",
    notEnough: "Insufficient funds!",
    you: " (You)",
    workspace: "Co-working Space (Dev Team)",
    connectWallet: "Connect Wallet",
    mintSuccess: "Minted Successfully! NFT sent to your wallet.",
    reset: "Reset Data (Debug)",
    // Modal Texts
    sysNotice: "SYSTEM_NOTICE",
    sysWarning: "SYSTEM_WARNING",
    sysInput: "IDENTITY_OVERRIDE",
    confirm: "CONFIRM",
    cancel: "CANCEL",
    connectFirst: "Please connect wallet first!",
    mintFailed: "Mint Failed",
    resetConfirm: "Are you sure you want to reset all progress? This cannot be undone!",
    enterName: "Enter new hacker alias (Max 12):",
    // Tutorial (Missing keys restored)
    tutorialNext: "NEXT >>",
    tutorialFinish: "INITIALIZE >>",
    step1Title: "SYSTEM INIT: CORE LOOP",
    step1Desc: "Click the button to write code. Each line earns you $1. This is your seed capital.",
    step2Title: "EXPANSION: BLACK MARKET",
    step2Desc: "Buy coffee, keyboards, or hire devs here. They generate income automatically (Passive Income).",
    step3Title: "OBJECTIVE: ON-CHAIN PROOF",
    step3Desc: "Reach $100,000 to unlock NFT minting. Connect Phantom Wallet (Solana Devnet Only) to claim your trophy!"
  }
};

// === Upgrade Item Data ===
const INITIAL_UPGRADES = [
  { 
    id: 1, 
    name: { zh: '冰美式咖啡', en: 'Iced Americano' }, 
    cost: 15, 
    rate: 1, 
    type: 'auto', 
    desc: { zh: '提神醒脑，每秒自动赚 $1', en: 'Caffeine boost, +$1/s' },
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

// === Inner Game Component ===
function GameContent() {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { connection } = useConnection();

  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [balance, setBalance] = useState(0); 
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0); 
  const [clickPower, setClickPower] = useState(1); 
  const [autoRate, setAutoRate] = useState(0); 
  const [inventory, setInventory] = useState<Record<number, number>>({});
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState(""); // User Name State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [matrixDrops, setMatrixDrops] = useState<{id: number, left: number, delay: number, duration: number, text: string}[]>([]);
  
  // Minting State
  const [hasMinted, setHasMinted] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintAddress, setMintAddress] = useState(""); 

  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState(0);

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'prompt';
    inputPlaceholder?: string;
    onConfirm?: (inputValue?: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const modalInputRef = useRef<HTMLInputElement>(null);
  const lifetimeEarningsRef = useRef(lifetimeEarnings);
  const userNameRef = useRef(userName); 
  const t = TRANSLATIONS[lang];

  // Helper functions for Custom Modal
  const showAlert = (message: string, title?: string) => {
    setModal({
      isOpen: true,
      title: title || t.sysNotice,
      message,
      type: 'alert'
    });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setModal({
      isOpen: true,
      title: t.sysWarning,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  const showPrompt = (message: string, placeholder: string, onConfirm: (val: string) => void) => {
    setModal({
      isOpen: true,
      title: t.sysInput,
      message,
      type: 'prompt',
      inputPlaceholder: placeholder,
      onConfirm: (val) => onConfirm(val || "")
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // 0. Fix Hydration & Tutorial Init
  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem("has_seen_tutorial_v1");
    if (!seen) {
        setTutorialStep(1);
    }
  }, []);

  // 1. Identity Management
  useEffect(() => {
    let currentId = "";
    if (publicKey) {
      currentId = publicKey.toBase58();
      localStorage.setItem("last_wallet_id", currentId); 
    } else {
      let guestId = localStorage.getItem("guest_id");
      if (!guestId) {
         guestId = "Dev_" + Math.floor(Math.random() * 10000);
         localStorage.setItem("guest_id", guestId);
      }
      currentId = guestId;
    }
    
    // FIXED: Clear username immediately when switching identities to prevent flickering
    // This ensures render cycle doesn't use old name with new userId
    setUserName(""); 
    setUserId(currentId);
  }, [publicKey]);

  // 2. Load Save 
  useEffect(() => {
    if (!userId) return;

    setBalance(0);
    setLifetimeEarnings(0);
    setClickPower(1);
    setAutoRate(0);
    setInventory({});
    setHasMinted(false);
    setMintAddress("");
    setUserName(""); // Reset name
    
    const saveKey = `founder_gameState_${userId}`;
    const saved = localStorage.getItem(saveKey);
    
    const savedName = localStorage.getItem(`founder_userName_${userId}`);
    if (savedName) setUserName(savedName);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBalance(parsed.balance ?? 0);
        setLifetimeEarnings(parsed.lifetimeEarnings ?? 0);
        setClickPower(parsed.clickPower ?? 1);
        setAutoRate(parsed.autoRate ?? 0);
        setInventory(parsed.inventory ?? {});
        setHasMinted(parsed.hasMinted ?? false);
        setMintAddress(parsed.mintAddress || ""); 
      } catch (e) {
        console.error("Save corrupted", e);
      }
    }
    setIsLoaded(true);
  }, [userId]);

  // 3. Auto Save
  useEffect(() => {
    if (!isLoaded || !userId) return;
    
    const saveKey = `founder_gameState_${userId}`;
    const gameState = {
      balance,
      lifetimeEarnings,
      clickPower,
      autoRate,
      inventory,
      hasMinted,
      mintAddress,
      timestamp: Date.now()
    };
    localStorage.setItem(saveKey, JSON.stringify(gameState));
  }, [balance, lifetimeEarnings, clickPower, autoRate, inventory, hasMinted, mintAddress, isLoaded, userId]);

  // 4. Sync Ref
  useEffect(() => {
    lifetimeEarningsRef.current = lifetimeEarnings;
    userNameRef.current = userName;
  }, [lifetimeEarnings, userName]);

  // Matrix Rain
  useEffect(() => {
    const drops = Array.from({ length: 30 }).map((_, i) => {
      const randomText = Array.from({ length: 20 }).map(() => Math.random() > 0.5 ? '1' : '0').join('');
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

  // Firebase Listener
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaderboard(data);
    }, (e) => console.error(e));
    return () => unsubscribe();
  }, []);

  // Firebase Upload
  useEffect(() => {
    if (!db || !userId) return;
    const saveInterval = setInterval(async () => {
        const currentScore = lifetimeEarningsRef.current;
        const currentName = userNameRef.current;
        if (currentScore > 0) {
            try {
                // Construct payload dynamically to avoid overwriting name with null
                const payload: any = {
                    wallet: userId,
                    score: currentScore,
                    updatedAt: Date.now()
                };
                
                // Only update userName if we have a valid one locally
                // This prevents wiping the server-side name if local state is empty/loading
                if (currentName && currentName.trim() !== "") {
                    payload.userName = currentName;
                }

                await setDoc(doc(db, "leaderboard", userId), payload, { merge: true });
            } catch (e) { console.error(e); }
        }
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [userId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (autoRate > 0) {
        setBalance(p => p + autoRate);
        setLifetimeEarnings(p => p + autoRate);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRate]);

  const handleClick = () => {
    setBalance(p => p + clickPower);
    setLifetimeEarnings(p => p + clickPower);
  };

  const buyUpgrade = (upgrade: any) => {
    const currentCount = inventory[upgrade.id] || 0;
    const currentCost = Math.floor(upgrade.cost * Math.pow(1.15, currentCount));
    if (balance >= currentCost) {
      setBalance(p => p - currentCost);
      setInventory(p => ({ ...p, [upgrade.id]: currentCount + 1 }));
      if (upgrade.type === 'auto') setAutoRate(p => p + upgrade.rate);
    } else {
      showAlert(t.notEnough, "ACCESS DENIED"); 
    }
  };

  const mintNft = async () => {
    if (!publicKey) {
        showAlert(t.connectFirst);
        return;
    }
    setIsMinting(true);

    try {
        const umi = createUmi(connection.rpcEndpoint)
            .use(mplTokenMetadata())
            .use(walletAdapterIdentity(wallet));

        const mint = generateSigner(umi);
        const uri = "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-offchain-data.json";

        await createNft(umi, {
            mint,
            name: "Unicorn Founder",
            symbol: "FNDR",
            uri: uri,
            sellerFeeBasisPoints: percentAmount(0),
        }).sendAndConfirm(umi);

        const mintAddressStr = mint.publicKey.toString();
        setHasMinted(true);
        setMintAddress(mintAddressStr);
        
        if (userId) {
            const saveKey = `founder_gameState_${userId}`;
            const gameState = {
                balance,
                lifetimeEarnings,
                clickPower,
                autoRate,
                inventory,
                hasMinted: true,
                mintAddress: mintAddressStr,
                timestamp: Date.now()
            };
            localStorage.setItem(saveKey, JSON.stringify(gameState));
        }

        showAlert(t.mintSuccess, "MINT COMPLETE");
    } catch (error: any) {
        console.error("Mint failed detail:", error);
        showAlert(`${t.mintFailed}: ${error?.message || "Unknown error"}. Check console.`);
    } finally {
        setIsMinting(false);
    }
  };

  const resetData = () => {
      showConfirm(t.resetConfirm, () => {
          setBalance(0);
          setLifetimeEarnings(0);
          setClickPower(1);
          setAutoRate(0);
          setInventory({});
          setHasMinted(false);
          setMintAddress("");
          setUserName("");
          localStorage.removeItem("has_seen_tutorial_v1");
          if (userId) {
              localStorage.removeItem(`founder_gameState_${userId}`);
              localStorage.removeItem(`founder_userName_${userId}`);
          }
          window.location.reload();
      });
  };

  const changeName = () => {
      showPrompt(t.enterName, "Neo...", (newName) => {
          const trimmed = newName.trim().slice(0, 12);
          if (trimmed) {
              setUserName(trimmed);
              localStorage.setItem(`founder_userName_${userId}`, trimmed);
          }
      });
  };

  const nextTutorial = () => {
      if (tutorialStep < 3) {
          setTutorialStep(prev => prev + 1);
      } else {
          setTutorialStep(0);
          localStorage.setItem("has_seen_tutorial_v1", "true");
      }
  };

  const getCost = (baseCost: number, id: number) => {
    const count = inventory[id] || 0;
    return Math.floor(baseCost * Math.pow(1.15, count));
  };

  const toggleLang = () => setLang(p => p === 'en' ? 'zh' : 'en');
  const fontStyle = lang === 'en' ? { fontFamily: 'Consolas, monospace' } : {};
  const UNLOCK_THRESHOLD = 100000;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 flex flex-col transition-all duration-300 overflow-hidden relative" style={fontStyle}>
      <style>{`
        @keyframes code-fall { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { transform: translateY(100vh); opacity: 0; } }
        @keyframes work-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes modal-pop { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .wallet-adapter-button { background-color: transparent !important; border: 1px solid #d946ef !important; color: #d946ef !important; font-family: inherit !important; font-weight: bold !important; height: 36px !important; padding: 0 16px !important; font-size: 12px !important; text-transform: uppercase !important; border-radius: 4px !important; transition: all 0.3s !important; }
        .wallet-adapter-button:hover { background-color: #d946ef !important; color: white !important; }
      `}</style>

      {/* Top Bar */}
      <div className="absolute top-6 right-6 z-50 flex gap-4 items-center">
        <button onClick={toggleLang} className="bg-black/50 backdrop-blur border border-fuchsia-500 text-fuchsia-400 px-4 py-1 skew-x-[-10deg] hover:bg-fuchsia-500 hover:text-white transition-all uppercase font-bold text-xs tracking-widest shadow-[0_0_10px_rgba(217,70,239,0.5)] h-[36px]">
          {lang === 'en' ? 'CN/EN' : '中/英'}
        </button>
        <div className="skew-x-[-10deg] shadow-[0_0_10px_rgba(217,70,239,0.5)]">
            {mounted && <WalletMultiButton />}
        </div>
      </div>

      {/* Tutorial Overlay */}
      {tutorialStep > 0 && (
          <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center">
              <div className="bg-black border-2 border-green-500 p-6 max-w-md w-full relative shadow-[0_0_50px_rgba(34,197,94,0.3)]" style={{ animation: 'modal-pop 0.3s' }}>
                  <div className="absolute top-0 left-0 bg-green-500 text-black text-xs font-bold px-2 py-1">
                      STEP {tutorialStep} / 3
                  </div>
                  
                  <h3 className="text-xl font-bold text-green-400 mt-4 mb-2">
                      {tutorialStep === 1 ? t.step1Title : tutorialStep === 2 ? t.step2Title : t.step3Title}
                  </h3>
                  <p className="text-gray-300 font-mono text-sm mb-6 leading-relaxed">
                      {tutorialStep === 1 ? t.step1Desc : tutorialStep === 2 ? t.step2Desc : t.step3Desc}
                  </p>

                  <div className="flex justify-end">
                      <button 
                          onClick={nextTutorial}
                          className="bg-green-600 hover:bg-green-500 text-black font-bold px-6 py-2 rounded skew-x-[-10deg] transition-all"
                      >
                          {tutorialStep === 3 ? t.tutorialFinish : t.tutorialNext}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 mb-32 z-10">
        
        {/* Left: Action */}
        <div className={`flex-1 bg-black/40 backdrop-blur-md rounded-[2rem_0_2rem_0] p-8 border-2 border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.15)] flex flex-col items-center justify-center relative overflow-hidden -rotate-1 hover:rotate-0 transition-transform duration-500 ${tutorialStep === 1 ? 'z-50 ring-4 ring-green-500 ring-opacity-50 relative bg-black' : ''}`}>
          
          {/* UPDATED: ID & Name Display with Edit Button (Always Visible) */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="text-[10px] text-fuchsia-500/50 font-mono tracking-[0.2em] border border-fuchsia-500/20 px-2 py-1 rounded bg-black/50">
                  ID: {userName || (userId.length > 10 ? `${userId.slice(0, 6)}...` : userId)}
              </div>
              <button 
                onClick={changeName}
                className="text-xs text-fuchsia-400 hover:text-white bg-fuchsia-500/10 hover:bg-fuchsia-500/30 p-1 rounded transition-colors"
                title="Change Name"
              >
                ✏️
              </button>
          </div>

          <div className="absolute inset-0 opacity-20 pointer-events-none select-none overflow-hidden">
            {matrixDrops.map((drop) => (
              <div key={drop.id} className="absolute top-0 text-[10px] text-fuchsia-500 font-mono leading-none break-all"
                style={{ left: `${drop.left}%`, animation: `code-fall ${drop.duration}s linear infinite`, animationDelay: `${drop.delay}s`, writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                {drop.text}
              </div>
            ))}
          </div>
          <div className="z-10 text-center mb-10 transform skew-x-[-5deg]">
            <h2 className="text-fuchsia-400 text-xs font-black uppercase tracking-[0.3em] mb-2 drop-shadow-lg">{t.totalAssets}</h2>
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 mb-2 tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
              ${balance.toLocaleString()}
            </div>
            <div className="text-cyan-400 text-sm font-bold bg-cyan-900/30 px-3 py-1 rounded inline-block border border-cyan-500/30">
              +${autoRate} {t.perSecond}
            </div>
          </div>
          <button onClick={handleClick} className="z-10 w-56 h-56 rounded-full bg-gradient-to-br from-gray-900 to-black border-[6px] border-fuchsia-500 flex flex-col items-center justify-center transition-all shadow-[0_0_50px_rgba(217,70,239,0.4)] group active:scale-95 active:shadow-[0_0_80px_rgba(217,70,239,0.8)] relative overflow-hidden">
            <div className="absolute inset-0 bg-fuchsia-500/10 rounded-full animate-pulse group-hover:bg-fuchsia-500/20"></div>
            <span className="text-5xl group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">🚀</span>
            <span className="mt-3 text-xs text-fuchsia-300 font-bold tracking-widest uppercase">{t.clickDesc}</span>
            <span className="text-lg text-white font-black mt-1 group-hover:text-fuchsia-200">+{clickPower} {t.clickButton}</span>
          </button>
        </div>

        {/* Right: Store & Leaderboard */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 rotate-1 hover:rotate-0 transition-transform duration-500 h-[calc(100vh-8rem)]">
          {/* Store Section */}
          <div className={`bg-black/40 backdrop-blur-md rounded-[0_2rem_0_2rem] p-6 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] relative ${tutorialStep === 2 ? 'z-50 ring-4 ring-green-500 ring-opacity-50 relative bg-black' : ''}`}>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 mb-6 border-b-2 border-purple-500/20 pb-4 uppercase tracking-tighter italic">
                {t.storeTitle}
              </h3>
              <div className="space-y-4">
              {INITIAL_UPGRADES.map((item) => {
                  const currentCost = getCost(item.cost, item.id);
                  const canAfford = balance >= currentCost;
                  const count = inventory[item.id] || 0;
                  return (
                  <div key={item.id} onClick={() => canAfford && buyUpgrade(item)} className={`group relative p-3 border-2 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-[0_5px_15px_rgba(0,0,0,0.5)] ${ canAfford ? 'bg-gray-900/80 border-purple-500/50 hover:border-fuchsia-400 hover:bg-gray-800 cursor-pointer rounded-tr-xl rounded-bl-xl' : 'bg-black/50 border-gray-800 opacity-60 cursor-not-allowed grayscale rounded-lg' }`}>
                      <div className="flex gap-4 items-center">
                          <div className={`w-16 h-16 flex-shrink-0 bg-black rounded border ${canAfford ? 'border-purple-500' : 'border-gray-700'} overflow-hidden relative`}>
                            <img src={item.image} alt={item.name[lang]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                            <div className="absolute bottom-0 right-0 bg-purple-600 text-white text-[10px] px-1 font-bold">Lv.{count}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between"><span className="font-bold text-white text-lg group-hover:text-fuchsia-300 transition-colors">{item.name[lang]}</span></div>
                            <div className="text-xs text-gray-400 mt-1 truncate font-mono">{item.desc[lang]}</div>
                            <div className="text-xs text-cyan-400 mt-1 font-bold shadow-cyan-500/20">{t.effect}: <span className="text-white">+${item.rate}/{t.sec}</span></div>
                          </div>
                          <button className={`px-4 py-3 font-black text-sm whitespace-nowrap skew-x-[-10deg] transition-all shadow-lg ${ canAfford ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500 shadow-purple-500/30' : 'bg-gray-800 text-gray-500' }`}>
                            <span className="skew-x-[10deg] inline-block">${currentCost.toLocaleString()}</span>
                          </button>
                      </div>
                  </div>
                  );
              })}
              </div>

              {/* === NFT Achievement Section === */}
              <div className={`mt-8 transition-all duration-500 ${tutorialStep === 3 ? 'z-50 ring-4 ring-green-500 ring-opacity-50 relative bg-black rounded-lg' : ''}`}>
                {hasMinted ? (
                    <div className="p-4 border border-green-500/50 bg-green-900/20 rounded-lg text-center shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse">
                        <div className="text-4xl mb-2 drop-shadow-md">🦄</div>
                        <div className="text-green-400 font-bold text-sm tracking-widest">{t.minted}</div>
                        {/* View Proof Button */}
                        {mintAddress ? (
                            <a 
                                href={`https://solscan.io/token/${mintAddress}?cluster=devnet`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block mt-2 bg-green-800/50 hover:bg-green-700/50 text-green-300 text-[10px] px-3 py-1 rounded border border-green-500/30 transition-colors font-mono uppercase"
                            >
                                🔗 {t.viewProof}
                            </a>
                        ) : (
                            <div className="text-[10px] text-red-400 mt-2 font-mono">
                                (Proof unavailable for this session)
                            </div>
                        )}
                    </div>
                ) : lifetimeEarnings >= UNLOCK_THRESHOLD ? (
                    <div 
                        onClick={!isMinting ? mintNft : undefined}
                        className={`p-6 border-2 border-yellow-500/50 bg-yellow-900/10 rounded-lg text-center cursor-pointer hover:bg-yellow-900/20 transition-all group ${isMinting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <div className="text-yellow-400 font-black text-xl mb-3 animate-bounce">🎉 ACHIEVEMENT UNLOCKED</div>
                        <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-lg shadow-orange-500/30 uppercase tracking-wider text-sm">
                            {isMinting ? t.minting : t.mintBtn}
                        </button>
                        <div className="text-[10px] text-yellow-500/50 mt-3 font-mono">Gas fee only (~0.00001 SOL)</div>
                    </div>
                ) : (
                    <div className="p-4 border-2 border-dashed border-gray-700 rounded-lg text-center opacity-70 bg-black/30">
                        <div className="flex justify-between text-xs text-gray-500 uppercase tracking-widest mb-2">
                            <span>🔒 {t.lockedTitle}</span>
                            <span>{Math.floor((lifetimeEarnings / UNLOCK_THRESHOLD) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden border border-gray-700">
                            <div 
                                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 h-full transition-all duration-500 shadow-[0_0_10px_rgba(192,38,211,0.5)]" 
                                style={{width: `${Math.min(100, (lifetimeEarnings / UNLOCK_THRESHOLD) * 100)}%`}}
                            ></div>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2 font-mono">${lifetimeEarnings.toLocaleString()} / ${UNLOCK_THRESHOLD.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 mt-1 italic">{t.lockedDesc}</p>
                    </div>
                )}
              </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-[2rem_0_2rem_0] p-6 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <h3 className="text-xl font-black text-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-tight border-b border-cyan-500/20 pb-2">
                  <span className="animate-bounce">🏆</span> {t.leaderboardTitle}
              </h3>
              {!db ? <div className="text-xs text-cyan-500/50 p-4 text-center border border-dashed border-cyan-900 rounded font-mono">[ SYSTEM OFFLINE ]<br/>Connect Firebase</div> : (
                  <div className="space-y-2 font-mono">
                      {leaderboard.length === 0 && <div className="text-cyan-500/50 text-sm text-center py-4 animate-pulse">{t.waiting}</div>}
                      {leaderboard.map((player, index) => {
                          // Calculate display name logic
                          let displayName = player.userName; // Default to remote name
                          
                          // If it's me, and I have a local name input, override to prevent flickering
                          if (player.id === userId && userName) {
                              displayName = userName;
                          }

                          // Fallback to wallet address if no name exists
                          if (!displayName) {
                              displayName = player.wallet.length > 10 
                                  ? `${player.wallet.slice(0, 4)}...${player.wallet.slice(-4)}` 
                                  : player.wallet;
                          }

                          return (
                          <div key={player.id} className={`flex justify-between items-center p-2 border-l-2 transform transition-all hover:pl-4 ${player.id === userId ? 'bg-cyan-900/20 border-cyan-400 text-cyan-100' : 'bg-gray-900/30 border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                              <div className="flex items-center gap-3">
                                  <span className={`font-black w-6 text-center italic ${index === 0 ? 'text-yellow-400 text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : index === 1 ? 'text-gray-300 text-md' : index === 2 ? 'text-orange-400 text-md' : 'text-gray-600 text-xs'}`}>{index === 0 ? '1ST' : index === 1 ? '2ND' : index === 2 ? '3RD' : `#${index + 1}`}</span>
                                  <span className={`text-xs tracking-tight ${player.id === userId ? 'text-cyan-300 font-bold' : ''}`}>
                                      {displayName}
                                      {player.id === userId && <span className="text-[10px] ml-1 opacity-70">{t.you}</span>}
                                  </span>
                              </div>
                              <span className="text-cyan-400 font-bold text-sm">${player.score?.toLocaleString()}</span>
                          </div>
                          );
                      })}
                  </div>
              )}
          </div>
        </div>
      </div>

      {/* Bottom Workspace */}
      <div className="fixed bottom-0 left-0 right-0 h-28 bg-black/80 backdrop-blur-lg border-t-2 border-green-500/50 z-40 flex items-end p-2 overflow-x-auto custom-scrollbar gap-2 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        <div className="absolute top-2 left-4 text-[10px] text-green-500 uppercase tracking-widest font-mono border border-green-500/30 px-2 py-0.5 rounded bg-green-900/20">{t.workspace}</div>
        {INITIAL_UPGRADES.map(item => {
          const count = inventory[item.id] || 0;
          if (count === 0) return null;
          const renderCount = Math.min(count, 6);
          const hasMore = count > 6;
          return (
            <div key={item.id} className="flex gap-1 items-end mx-2 group relative">
              {Array.from({ length: renderCount }).map((_, i) => (
                <div key={i} className="w-12 h-12 relative transition-all hover:scale-110" style={{ animation: `work-bounce ${0.5 + Math.random()}s infinite ease-in-out`, animationDelay: `${Math.random() * -1}s` }}>
                  <img src={item.image} alt="worker" className="w-full h-full object-cover rounded border border-green-500/30 shadow-[0_0_10px_rgba(0,255,0,0.1)]"/>
                </div>
              ))}
              {hasMore && <div className="h-12 flex items-center justify-center bg-gray-800 text-xs text-green-400 font-bold px-2 rounded border border-gray-700">+{count - 6}</div>}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">{item.name[lang]} x {count}</div>
            </div>
          );
        })}
        {Object.keys(inventory).length === 0 && <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-mono animate-pulse">[ WAITING FOR RECRUITMENT... ]</div>}
      </div>

      {/* DEBUG: Reset Button */}
      <div className="fixed bottom-2 right-2 z-50">
          <button 
            onClick={resetData}
            className="text-[10px] text-red-500/30 hover:text-red-500 hover:bg-red-900/20 px-2 py-1 rounded transition-colors uppercase tracking-widest"
          >
            [ {t.reset} ]
          </button>
      </div>

      {/* --- CUSTOM MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div 
            className="bg-black/90 border-2 border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.3)] rounded-lg max-w-sm w-full p-6 relative overflow-hidden"
            style={{ animation: 'modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

            <h3 className="text-xl font-black text-fuchsia-400 mb-4 uppercase tracking-widest border-b border-fuchsia-500/30 pb-2">
              {modal.title}
            </h3>
            
            <p className="text-gray-300 mb-6 font-mono text-sm leading-relaxed">
              {modal.message}
            </p>

            {/* Input Field for Prompt */}
            {modal.type === 'prompt' && (
                <div className="mb-6">
                    <input 
                        ref={modalInputRef}
                        type="text" 
                        placeholder={modal.inputPlaceholder}
                        className="w-full bg-gray-900 border border-fuchsia-500/50 rounded p-2 text-white font-mono focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400 transition-all"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (modal.onConfirm) modal.onConfirm(e.currentTarget.value);
                                closeModal();
                            }
                        }}
                    />
                </div>
            )}

            <div className="flex justify-end gap-3">
              {(modal.type === 'confirm' || modal.type === 'prompt') && (
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded transition-all"
                >
                  {t.cancel}
                </button>
              )}
              <button 
                onClick={() => {
                  if (modal.onConfirm) {
                      const val = modalInputRef.current?.value;
                      modal.onConfirm(val);
                  }
                  closeModal();
                }}
                className="px-6 py-2 text-xs font-bold uppercase tracking-wider bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded shadow-[0_0_15px_rgba(217,70,239,0.5)] transition-all"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === Main Export: Wraps Game with Web3 Providers ===
export default function FounderSimulator() {
  return (
    <SolanaProvider>
      <GameContent />
    </SolanaProvider>
  );
}