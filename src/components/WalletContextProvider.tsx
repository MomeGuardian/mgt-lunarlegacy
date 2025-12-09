"use client";

import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// ✅ 显式引入核心钱包适配器 (为了解决 OKX 注入延迟问题)
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

// ✅ 确保样式被引入 (这是点击没反应最常见的原因！)
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // ⚡️ 你的 Helius 高速节点
  // ⚠️ 务必确认这个 Key 是有效的，否则按钮会一直转圈或没反应
  const endpoint = "https://mainnet.helius-rpc.com/?api-key=f6ac37ee-435b-440c-9114-87bf7783319b";

  const wallets = useMemo(
    () => [
      // 1. 优先尝试自动检测 (Standard Wallet)
      // 2. 显式加入 Phantom (OKX App 经常伪装成 Phantom，这能强制唤起它)
      new PhantomWalletAdapter(),
      // 3. 加入 Solflare (Solana 生态第二大钱包，增加兼容性)
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider 
        endpoint={endpoint}
        // ⚡️ 降低确认级别，加快连接速度
        config={{ commitment: 'confirmed' }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
