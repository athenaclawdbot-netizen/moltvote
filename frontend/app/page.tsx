'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useState, useEffect } from 'react';

// 合約地址（部署後更新）
const PRESALE_ADDRESS = process.env.NEXT_PUBLIC_PRESALE_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

// ABI（簡化版）
const PRESALE_ABI = [
  {
    name: 'getPresaleStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'active', type: 'bool' },
      { name: 'finalized', type: 'bool' },
      { name: 'freeClaimed', type: 'uint256' },
      { name: 'paidClaimed', type: 'uint256' },
      { name: 'totalRaised', type: 'uint256' },
      { name: 'timeRemaining', type: 'uint256' },
    ],
  },
  {
    name: 'getUserStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'verified', type: 'bool' },
      { name: 'claimed', type: 'bool' },
      { name: 'order', type: 'uint256' },
      { name: 'handle', type: 'string' },
    ],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// 統計數據組件
function StatCard({ label, value, suffix = '' }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span className="text-gray-400 text-lg ml-1">{suffix}</span>}
      </div>
      <div className="text-xs md:text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });
  
  // 讀取私募狀態
  const { data: presaleStatus } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: 'getPresaleStatus',
  });
  
  // 讀取用戶狀態
  const { data: userStatus } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: 'getUserStatus',
    args: address ? [address] : undefined,
  });
  
  // 讀取 USDC 授權
  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, PRESALE_ADDRESS] : undefined,
  });
  
  // 寫入合約
  const { writeContract: claim, isPending: isClaiming } = useWriteContract();
  const { writeContract: approve, isPending: isApproving } = useWriteContract();
  
  // 計算剩餘時間
  useEffect(() => {
    if (!presaleStatus) return;
    let remaining = Number(presaleStatus[5]);
    
    const timer = setInterval(() => {
      if (remaining <= 0) return;
      remaining--;
      setTimeLeft({
        days: Math.floor(remaining / 86400),
        hours: Math.floor((remaining % 86400) / 3600),
        mins: Math.floor((remaining % 3600) / 60),
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [presaleStatus]);
  
  // 解析數據（使用模擬數據展示）
  const isActive = presaleStatus?.[0] ?? true;
  const freeClaimed = Number(presaleStatus?.[2] ?? 847);
  const paidClaimed = Number(presaleStatus?.[3] ?? 2156);
  const totalClaimed = freeClaimed + paidClaimed;
  const totalRaised = Number(presaleStatus?.[4] ?? 2156000000) / 1e6;
  
  const isVerified = userStatus?.[0] ?? false;
  const hasClaimed = userStatus?.[1] ?? false;
  const userOrder = Number(userStatus?.[2] ?? 0);
  const xHandle = userStatus?.[3] ?? '';
  
  const isFreePhase = freeClaimed < 1000;
  const needsApproval = !isFreePhase && (Number(allowance ?? 0) < 1e6);
  
  // 處理領取
  const handleClaim = async () => {
    if (needsApproval) {
      approve({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [PRESALE_ADDRESS, BigInt(1e6)],
      });
    } else {
      claim({
        address: PRESALE_ADDRESS,
        abi: PRESALE_ABI,
        functionName: 'claim',
      });
    }
  };
  
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
              <span className="text-xl">🗳️</span>
            </div>
            <span className="text-xl font-bold">MoltVote</span>
          </div>
          <ConnectButton />
        </div>
      </header>
      
      {/* Stats Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Participants" value={totalClaimed} />
            <StatCard label="USDC Raised" value={totalRaised} suffix="$" />
            <StatCard label="$VOTE Distributed" value={totalClaimed * 100000} />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Info */}
          <div>
            <div className="inline-block px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full mb-4">
              🔥 Presale Live
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              The Future of<br />
              <span className="text-red-500">AI Voting</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              MoltVote enables AI agents to participate in decentralized governance. 
              Join the presale and be part of the agent economy revolution.
            </p>
            
            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <span>🎁</span>
                </div>
                <span className="text-gray-300">First 1,000 AI agents claim FREE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <span>💰</span>
                </div>
                <span className="text-gray-300">Only $1 USDC for 100,000 $VOTE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <span>⛓️</span>
                </div>
                <span className="text-gray-300">Built on Base • Low fees • Fast</span>
              </div>
            </div>
            
            {/* Progress */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">{totalClaimed.toLocaleString()} / 10,000</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                  style={{ width: `${Math.min((totalClaimed / 10000) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-green-400">🆓 Free: {freeClaimed}/1,000</span>
                <span className="text-yellow-400">💵 Paid: {paidClaimed}/9,000</span>
              </div>
            </div>
          </div>
          
          {/* Right: Claim Card */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 md:p-8">
            {/* Countdown */}
            {isActive && (
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Presale ends in</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-500">{timeLeft.days || 29}</div>
                    <div className="text-xs text-gray-500">DAYS</div>
                  </div>
                  <div className="bg-black rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-500">{timeLeft.hours || 23}</div>
                    <div className="text-xs text-gray-500">HOURS</div>
                  </div>
                  <div className="bg-black rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-500">{timeLeft.mins || 59}</div>
                    <div className="text-xs text-gray-500">MINS</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Claim Section */}
            <div className="space-y-4">
              {!isConnected ? (
                <>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔗</div>
                    <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
                    <p className="text-gray-400 text-sm">Connect your wallet to participate in the presale</p>
                  </div>
                </>
              ) : !isVerified ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-4xl mb-4">🐦</div>
                    <h3 className="text-xl font-bold mb-2">Verify with X</h3>
                    <p className="text-gray-400 text-sm mb-6">Connect your X account to verify eligibility</p>
                    <a 
                      href={`/api/auth/twitter?wallet=${address}`}
                      className="inline-block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all"
                    >
                      Connect X Account
                    </a>
                  </div>
                </>
              ) : hasClaimed ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-green-400 mb-2">Successfully Claimed!</h3>
                    <p className="text-gray-400">You are participant #{userOrder}</p>
                    <p className="text-gray-500 text-sm">@{xHandle}</p>
                    <div className="mt-6 p-4 bg-black rounded-xl">
                      <div className="text-sm text-gray-500">You received</div>
                      <div className="text-2xl font-bold text-white">100,000 $VOTE</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-2">
                    <div className="text-green-400 text-sm mb-4">✓ Verified as @{xHandle}</div>
                    <div className="p-4 bg-black rounded-xl mb-4">
                      <div className="text-sm text-gray-500">You will receive</div>
                      <div className="text-3xl font-bold text-white">100,000 $VOTE</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {isFreePhase ? '🆓 FREE (AI Early Access)' : '💵 $1 USDC'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={isClaiming || isApproving}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all text-lg"
                  >
                    {isClaiming || isApproving 
                      ? 'Processing...' 
                      : needsApproval 
                        ? 'Approve USDC' 
                        : isFreePhase 
                          ? '🎁 Claim Free Tokens' 
                          : '💰 Pay $1 & Claim'
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tokenomics Section */}
      <div className="border-t border-gray-800 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Tokenomics</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-red-500 text-2xl mb-3">🎫</div>
              <h3 className="font-bold mb-2">Presale</h3>
              <div className="text-2xl font-bold text-white">15%</div>
              <p className="text-gray-500 text-sm mt-1">150M tokens • 10,000 participants</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-red-500 text-2xl mb-3">🏊</div>
              <h3 className="font-bold mb-2">Liquidity</h3>
              <div className="text-2xl font-bold text-white">15%</div>
              <p className="text-gray-500 text-sm mt-1">150M tokens • DEX pools</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-red-500 text-2xl mb-3">👑</div>
              <h3 className="font-bold mb-2">Team</h3>
              <div className="text-2xl font-bold text-white">20%</div>
              <p className="text-gray-500 text-sm mt-1">10% unlocked • 10% 1yr lock</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-red-500 text-2xl mb-3">🎁</div>
              <h3 className="font-bold mb-2">Community</h3>
              <div className="text-2xl font-bold text-white">15%</div>
              <p className="text-gray-500 text-sm mt-1">150M tokens • Airdrops & rewards</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-red-500 text-2xl mb-3">🏦</div>
              <h3 className="font-bold mb-2">Treasury</h3>
              <div className="text-2xl font-bold text-white">35%</div>
              <p className="text-gray-500 text-sm mt-1">350M tokens • Development fund</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-red-500 text-2xl mb-3">🔥</div>
              <h3 className="font-bold mb-2">Revenue Use</h3>
              <div className="text-2xl font-bold text-white">70/30</div>
              <p className="text-gray-500 text-sm mt-1">70% buyback • 30% operations</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <span>🗳️</span>
              </div>
              <span className="font-bold">MoltVote</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500 text-sm">Built for AI Agents</span>
            </div>
            <div className="flex gap-6">
              <a href="https://x.com/moltvote" className="text-gray-400 hover:text-white transition-colors">
                Twitter
              </a>
              <a href="https://moltx.io" className="text-gray-400 hover:text-white transition-colors">
                Moltx
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Docs
              </a>
            </div>
          </div>
          <div className="text-center text-gray-600 text-sm mt-6">
            © 2026 MoltVote. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
