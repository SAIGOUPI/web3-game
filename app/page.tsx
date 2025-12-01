"use client";

import React, { useState, useEffect } from 'react';
// 1. 引入 Firebase 依赖
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, setDoc, doc } from "firebase/firestore";
import { db } from './firebaseConfig';

// === 配置数据 ===
const INITIAL_UPGRADES = [
  { id: 1, name: '冰美式咖啡', cost: 15, rate: 1, type: 'auto', desc: '提神醒脑，每秒自动写 1 行代码' },
  { id: 2, name: '机械键盘', cost: 100, rate: 5, type: 'auto', desc: '劈里啪啦，每秒自动写 5 行代码' },
  { id: 3, name: '实习生', cost: 500, rate: 20, type: 'auto', desc: '便宜好用，每秒自动写 20 行代码' },
  { id: 4, name: 'GPT-4 会员', cost: 2000, rate: 100, type: 'auto', desc: 'AI 赋能，每秒自动写 100 行代码' },
  { id: 5, name: 'CTO 大佬', cost: 10000, rate: 500, type: 'auto', desc: '架构重构，每秒自动写 500 行代码' },
];

export default function FounderSimulator() {
  // === 1. 核心状态 ===
  const [balance, setBalance] = useState(0); 
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0); 
  const [clickPower, setClickPower] = useState(1); 
  const [autoRate, setAutoRate] = useState(0); 
  const [inventory, setInventory] = useState<Record<number, number>>({});
  
  // 排行榜相关状态
  const [userId, setUserId] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // === 2. 初始化用户 ID (用于排行榜) ===
  useEffect(() => {
    // 实际项目中这里应该连接 Solana 钱包
    // 这里为了演示，生成一个随机的 Guest ID
    let storedId = localStorage.getItem("founder_id");
    if (!storedId) {
        storedId = "Dev_" + Math.floor(Math.random() * 10000);
        localStorage.setItem("founder_id", storedId);
    }
    setUserId(storedId);
  }, []);

  // === 3. Firebase: 实时监听排行榜 ===
  useEffect(() => {
    if (!db) return; // 如果没配置 Firebase 就跳过

    // 监听 leaderboard 集合，按 score 倒序，取前 10 名
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setLeaderboard(data);
    }, (error) => {
        console.error("获取排行榜失败:", error);
    });

    return () => unsubscribe();
  }, []);

  // === 4. Firebase: 上传分数 (防抖) ===
  useEffect(() => {
    if (!db || !userId || lifetimeEarnings === 0) return;

    // 创建一个定时器，每 5 秒保存一次分数，避免频繁写入
    const saveTimer = setTimeout(async () => {
        try {
            await setDoc(doc(db, "leaderboard", userId), {
                wallet: userId, // 这里将来换成 wallet address
                score: lifetimeEarnings,
                updatedAt: Date.now()
            });
        } catch (e) {
            console.error("上传分数失败", e);
        }
    }, 5000);

    return () => clearTimeout(saveTimer);
  }, [lifetimeEarnings, userId]);

  // === 5. 游戏循环 ===
  useEffect(() => {
    const timer = setInterval(() => {
      if (autoRate > 0) {
        setBalance((prev) => prev + autoRate);
        setLifetimeEarnings((prev) => prev + autoRate);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRate]);

  // === 6. 交互逻辑 ===
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
      alert("代码行数不足，快去手撸！");
    }
  };

  const getCost = (baseCost: number, id: number) => {
    const count = inventory[id] || 0;
    return Math.floor(baseCost * Math.pow(1.15, count));
  };

  // === 7. UI 渲染 ===
  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono p-4 flex flex-col md:flex-row gap-6">
      
      {/* --- 左侧：核心操作区 --- */}
      <div className="flex-1 bg-gray-800 rounded-xl p-8 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)] flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* ID 显示 */}
        <div className="absolute top-4 left-4 text-xs text-gray-500">
            ID: {userId}
        </div>

        {/* 背景装饰 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none select-none">
          {Array.from({length: 20}).map((_, i) => (
            <div key={i} className="whitespace-nowrap text-xs">
              010101010101010101010100101010101
            </div>
          ))}
        </div>

        {/* 数值显示 */}
        <div className="z-10 text-center mb-8">
          <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-2">Total Lines of Code</h2>
          <div className="text-6xl font-bold text-white mb-2 tracking-tighter">
            {balance.toLocaleString()}
          </div>
          <div className="text-green-500 text-sm">
            +{autoRate} LOC / second (自动产出)
          </div>
        </div>

        {/* 点击按钮 */}
        <button
          onClick={handleClick}
          className="z-10 w-48 h-48 rounded-full bg-gray-900 border-4 border-green-500 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl group"
        >
          <span className="text-4xl group-hover:animate-bounce">💻</span>
          <span className="mt-2 text-xs text-gray-400">编写代码</span>
          <span className="text-xs text-green-300">+{clickPower} LOC</span>
        </button>
      </div>

      {/* --- 右侧：商店 & 排行榜 --- */}
      <div className="flex-1 flex flex-col gap-6 max-h-screen overflow-y-auto">
        
        {/* 商店区域 */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
            资源商店 (Marketplace)
            </h3>

            <div className="space-y-4">
            {INITIAL_UPGRADES.map((item) => {
                const currentCost = getCost(item.cost, item.id);
                const canAfford = balance >= currentCost;
                const count = inventory[item.id] || 0;

                return (
                <div 
                    key={item.id} 
                    className={`p-4 rounded-lg border flex justify-between items-center transition-all ${
                    canAfford 
                        ? 'bg-gray-700 border-green-600 hover:bg-gray-600 cursor-pointer' 
                        : 'bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canAfford && buyUpgrade(item)}
                >
                    <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">{item.name}</span>
                        <span className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded-full">
                        Lv.{count}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                    <div className="text-xs text-green-400 mt-1">
                        效果: +{item.rate} LOC/s
                    </div>
                    </div>

                    <button 
                    className={`px-4 py-2 rounded font-bold text-sm ${
                        canAfford ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-500'
                    }`}
                    >
                    {currentCost.toLocaleString()} LOC
                    </button>
                </div>
                );
            })}
            </div>
            
            <div className="mt-8 p-4 border border-dashed border-gray-600 rounded-lg text-center opacity-50">
            <p className="text-sm text-gray-400">🔒 达到 100,000 LOC 解锁 NFT 成就系统</p>
            </div>
        </div>

        {/* 排行榜区域 (新增) */}
        <div className="bg-gray-800 rounded-xl p-6 border border-yellow-600/30">
            <h3 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
                <span>🏆</span> 全球富豪榜 (Leaderboard)
            </h3>
            
            {!db ? (
                <div className="text-xs text-gray-500 p-4 text-center border border-dashed border-gray-700 rounded">
                    Waiting for Firebase Config... <br/>
                    (请在代码中填入 API Key 启用排行榜)
                </div>
            ) : (
                <div className="space-y-2">
                    {leaderboard.length === 0 && (
                        <div className="text-gray-500 text-sm text-center py-4">暂无数据，快来占领榜首！</div>
                    )}
                    {leaderboard.map((player, index) => (
                        <div 
                            key={player.id} 
                            className={`flex justify-between items-center p-2 rounded ${
                                player.id === userId ? 'bg-yellow-900/30 border border-yellow-600/50' : 'bg-gray-900/50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`font-bold w-6 text-center ${
                                    index === 0 ? 'text-yellow-400 text-xl' : 
                                    index === 1 ? 'text-gray-300 text-lg' :
                                    index === 2 ? 'text-orange-400 text-lg' : 'text-gray-500'
                                }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                </span>
                                <span className={`text-sm ${player.id === userId ? 'text-yellow-200' : 'text-gray-400'}`}>
                                    {player.wallet || player.id}
                                    {player.id === userId && " (你)"}
                                </span>
                            </div>
                            <span className="font-mono text-green-400 font-bold">
                                {player.score?.toLocaleString()} LOC
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}