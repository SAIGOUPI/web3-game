"use client";

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// 引入钱包适配器的默认样式
require('@solana/wallet-adapter-react-ui/styles.css');

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
    // 设置网络为 Devnet (开发环境) 或 Mainnet-beta (生产环境)
    // Hackathon 建议先用 Devnet，速度快且免费领测试币
    const network = WalletAdapterNetwork.Devnet;

    // 你也可以替换为你自己的 RPC 节点 URL (例如 Helius / Alchemy) 以获得更稳定的连接
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // 初始化支持的钱包 (Phantom 是必须的，Solflare 也很流行)
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}