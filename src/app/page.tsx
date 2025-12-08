"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Leaderboard from "@/components/Leaderboard";
import { Copy, Check } from "lucide-react";

export default function Home() {
  const { publicKey, connected, signMessage } = useWallet();
  const [inviter, setInviter] = useState<string | null>(null);
  const [myRefs, setMyRefs] = useState(0);
  const [pendingReward, setPendingReward] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasCheckedRef = useRef(false);
  const bindRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const claimReward = async () => {
    setClaiming(true);
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: publicKey?.toBase58() }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("领取成功！交易: " + data.sig);
      setPendingReward(0);
    } else {
      alert("领取失败: " + data);
    }
    setClaiming(false);
  };

  const copyLink = () => {
    if (myLink) {
      navigator.clipboard.writeText(myLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const myLink = publicKey ? `${window.location.origin}?ref=${publicKey.toBase58()}` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-950 to-black relative overflow-hidden">
      {}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),transparent_70%)] animate-pulse [animation-delay:1s]" />

      <div className="fixed top-4 right-4 z-50">
        <WalletMultiButton 
          className="transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25 rounded-full animate-float"
          style={{ background: "#9333ea" }} 
        />
      </div>

      <div className="container mx-auto px-4 py-20 text-center relative z-10">
        {!publicKey ? (
          <div className={`max-w-2xl mx-auto ${isLoaded ? 'opacity-100 animate-slide-up' : 'opacity-0'}`}>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent mb-8 drop-shadow-lg animate-fade-in-up">
              $你的MEME 直推奖励
            </h1>
            <p className="text-2xl text-gray-300 mb-8 animate-pulse animate-fade-in-up [animation-delay:0.4s]">
              点右上角连接钱包开始赚钱
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-12">
            {}
            <div className={`bg-gray-900/90 backdrop-blur-lg rounded-3xl p-10 border border-purple-600/50 shadow-2xl shadow-purple-500/10 animate-slide-up ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-4xl text-green-400 mb-4 animate-pulse">连接成功！</p>
              <p className="font-mono text-sm text-gray-400 break-all animate-fade-in-up [animation-delay:0.3s]">
                {publicKey.toBase58()}
              </p>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-8 border border-purple-500/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 animate-slide-up [animation-delay:0.2s]">
                <p className="text-gray-400 mb-3">我的上级</p>
                <p className="text-2xl font-bold animate-fade-in-up [animation-delay:0.4s]">
                  {inviter ? `${inviter.slice(0, 10)}...` : "无（一代祖宗）"}
                </p>
              </div>

              <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-8 border border-green-500/50 shadow-lg hover:shadow-green-500/20 transition-all duration-300 animate-slide-up [animation-delay:0.3s]">
                <p className="text-gray-400 mb-3">我已邀请</p>
                <p className="text-6xl font-bold text-green-400 animate-fade-in-up [animation-delay:0.5s]">
                  {myRefs} 人
                </p>
              </div>

              <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-8 border border-yellow-500/50 shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 animate-slide-up [animation-delay:0.4s]">
                <p className="text-gray-400 mb-3">可领取返现</p>
                <p className="text-6xl font-bold text-yellow-400 animate-fade-in-up [animation-delay:0.6s]">
                  {pendingReward.toFixed(4)} MGT
                </p>
                {pendingReward > 0 && (
                  <button
                    onClick={claimReward}
                    disabled={claiming}
                    className="mt-6 px-8 py-3 bg-yellow-600 rounded-full hover:bg-yellow-700 disabled:opacity-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-yellow-500/25 animate-fade-in-up [animation-delay:0.7s]"
                  >
                    {claiming ? "领取中..." : "一键领取"}
                  </button>
                )}
              </div>
            </div>

            {}
            <Leaderboard className="animate-slide-up [animation-delay:0.5s]" />

            {}
            <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-8 border border-pink-500/50 shadow-lg hover:shadow-pink-500/20 transition-all duration-300 animate-slide-up [animation-delay:0.6s]">
              <p className="text-gray-400 mb-3">我的邀请链接</p>
              <p className="font-mono text-xs break-all mt-3 text-pink-400 bg-gray-800 p-2 rounded-lg animate-fade-in-up [animation-delay:0.8s]">
                {myLink}
              </p>
              <button
                onClick={copyLink}
                className="mt-6 px-8 py-3 bg-pink-600 rounded-full hover:bg-pink-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2 animate-fade-in-up [animation-delay:0.9s]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "已复制！" : "一键复制链接"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
