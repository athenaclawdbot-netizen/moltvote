/**
 * 初始種子資料 - 先導入手動整理的 100+ 題
 */

import { createMarkets } from './db';

const INITIAL_QUESTIONS = [
  // 🎮 ___ before GTA 6 系列
  { question: "Will Bitcoin reach $200K before GTA 6 releases?", category: "meme", endDate: "2026-12-31", isHot: true },
  { question: "Will ETH 2.0 complete all upgrades before GTA 6 releases?", category: "meme", endDate: "2026-12-31", isHot: false },
  { question: "Will Elon Musk land on Mars before GTA 6 releases?", category: "meme", endDate: "2028-12-31", isHot: true },
  { question: "Will Half-Life 3 release before GTA 6?", category: "meme", endDate: "2028-12-31", isHot: true },
  { question: "Will China unban cryptocurrency before GTA 6 releases?", category: "meme", endDate: "2027-12-31", isHot: false },
  { question: "Will OpenAI release GPT-6 before GTA 6?", category: "meme", endDate: "2027-12-31", isHot: false },
  { question: "Will Apple release AR glasses before GTA 6?", category: "meme", endDate: "2026-12-31", isHot: false },
  { question: "Will humans return to the Moon before GTA 6 releases?", category: "meme", endDate: "2027-12-31", isHot: false },
  { question: "Will Twitter be renamed back to Twitter before GTA 6?", category: "meme", endDate: "2027-12-31", isHot: false },
  { question: "Will you achieve financial freedom before GTA 6 releases?", category: "meme", endDate: "2027-12-31", isHot: true },

  // 🌭 經典迷因辯論
  { question: "Is a hot dog a sandwich?", category: "meme", endDate: "2027-02-04", isHot: true },
  { question: "Is water wet?", category: "meme", endDate: "2027-02-04", isHot: true },
  { question: "Is GIF pronounced 'G-if' or 'Jif'?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Does pineapple belong on pizza?", category: "meme", endDate: "2027-02-04", isHot: true },
  { question: "Which came first: the chicken or the egg?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Is cereal a soup?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Does 0.999... = 1?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Was The Dress white/gold or blue/black?", category: "meme", endDate: "2027-02-04", isHot: true },
  { question: "Did you hear Yanny or Laurel?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Is a tomato a fruit or a vegetable?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Is a Pop-Tart a ravioli?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Can a plane take off on a treadmill?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Would Pinocchio's nose grow if he said 'My nose will grow now'?", category: "philosophy", endDate: "2027-02-04", isHot: false },
  { question: "Is Schrödinger's cat dead or alive?", category: "philosophy", endDate: "2027-02-04", isHot: false },
  { question: "Ship of Theseus: Is it still the same ship after replacing all parts?", category: "philosophy", endDate: "2027-02-04", isHot: false },

  // 🤖 AI 系列
  { question: "Will GPT-5 be released in 2026?", category: "tech", endDate: "2026-12-31", isHot: true },
  { question: "Will Claude publicly admit it's better than GPT?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will AI pass the Turing Test by 2030?", category: "tech", endDate: "2030-12-31", isHot: false },
  { question: "Which company will achieve AGI first: OpenAI, Anthropic, Google, or other?", category: "tech", endDate: "2030-12-31", isHot: true },
  { question: "Will an AI-generated film win an Oscar before 2030?", category: "culture", endDate: "2030-03-01", isHot: false },
  { question: "Will AI completely replace customer service agents by 2028?", category: "tech", endDate: "2028-12-31", isHot: false },
  { question: "Will over 50% of code be written by AI by 2030?", category: "tech", endDate: "2030-12-31", isHot: false },
  { question: "Will Elon announce 'AGI is coming next year' again in 2026?", category: "tech", endDate: "2026-12-31", isHot: true },
  { question: "Will AI write a bestselling novel by 2027?", category: "tech", endDate: "2027-12-31", isHot: false },
  { question: "Which AI would you trust for investment advice: Claude, GPT, Gemini, or none?", category: "tech", endDate: "2027-02-04", isHot: false },

  // 💰 加密貨幣時事
  { question: "Will Bitcoin hit $150K by end of 2026?", category: "crypto", endDate: "2026-12-31", isHot: true },
  { question: "Will Bitcoin drop below $50K in 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will Ethereum flip Bitcoin market cap in 2026?", category: "crypto", endDate: "2026-12-31", isHot: true },
  { question: "Will Solana reach $500 in 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will Solana have more than 5 outages in 2026?", category: "crypto", endDate: "2026-12-31", isHot: true },
  { question: "Will the next 100x memecoin be dog-themed or cat-themed?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will US pass crypto regulation by Q2 2026?", category: "crypto", endDate: "2026-06-30", isHot: true },
  { question: "Will Tether (USDT) collapse in 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will CZ's first tweet after prison be '4'?", category: "crypto", endDate: "2026-12-31", isHot: true },
  { question: "Will SBF write a memoir in prison?", category: "crypto", endDate: "2030-12-31", isHot: false },
  { question: "Will Michael Saylor continue buying Bitcoin in 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will Bitcoin ETFs attract over $50B in 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will more countries adopt Bitcoin as legal tender in 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will Justin Sun buy something weird again in 2026?", category: "crypto", endDate: "2026-12-31", isHot: true },
  { question: "Will Do Kwon be sentenced to more than 10 years?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will total crypto market cap exceed $5 trillion by end of 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will Base chain surpass Solana TVL in 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will NFT market recover in 2026?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Which exchange is most likely to collapse next?", category: "crypto", endDate: "2026-12-31", isHot: false },
  { question: "Will Vitalik finally change his outfit in 2026?", category: "crypto", endDate: "2026-12-31", isHot: true },

  // 🌍 國際政治時事
  { question: "Will the Russia-Ukraine war end in 2026?", category: "politics", endDate: "2026-12-31", isHot: true },
  { question: "Will Trump succeed in 'nationalizing' US elections?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will China take military action against Taiwan in 2026?", category: "politics", endDate: "2026-12-31", isHot: true },
  { question: "Will Israel and Hamas reach a permanent ceasefire in 2026?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will US-China tariff war ease in 2026?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will EU fine X (Twitter) over $1 billion?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will TikTok be completely banned in the US?", category: "politics", endDate: "2026-12-31", isHot: true },
  { question: "Will North Korea conduct nuclear tests in 2026?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will UK demand Prince Andrew's trial over Epstein files?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will France prosecute Elon Musk after X office raid?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will there be a major political boycott at 2026 Winter Olympics?", category: "politics", endDate: "2026-03-01", isHot: false },
  { question: "Will Venezuela's economy collapse in 2026?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will India become the world's 3rd largest economy in 2026?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will there be a major climate agreement breakthrough in 2026?", category: "politics", endDate: "2026-12-31", isHot: false },
  { question: "Will the UN reform the Security Council in 2026?", category: "politics", endDate: "2026-12-31", isHot: false },

  // 🚀 科技時事
  { question: "Will Apple release AR glasses in 2026?", category: "tech", endDate: "2026-12-31", isHot: true },
  { question: "Will Tesla launch real Robotaxi service in 2026?", category: "tech", endDate: "2026-12-31", isHot: true },
  { question: "Will SpaceX Starship successfully carry humans in 2026?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will Elon Musk merge SpaceX, X, and xAI into one company?", category: "tech", endDate: "2026-12-31", isHot: true },
  { question: "Will Meta abandon Metaverse to focus on AI?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will Spain successfully ban social media for under-16s?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will Roblox be banned in more countries?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will Signal become a mainstream messaging app in 2026?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will OpenAI IPO in 2026?", category: "tech", endDate: "2026-12-31", isHot: true },
  { question: "Will Neuralink get more human trial approvals in 2026?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will China's Comac C919 get US/EU certification in 2026?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will Boeing have another major safety incident in 2026?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will Amazon Project Kuiper successfully challenge Starlink?", category: "tech", endDate: "2027-12-31", isHot: false },
  { question: "Will PayPal return to crypto under new CEO?", category: "tech", endDate: "2026-12-31", isHot: false },
  { question: "Will Samsung Galaxy S27 use in-house chips?", category: "tech", endDate: "2027-03-01", isHot: false },

  // ⚽ 體育
  { question: "Which country will top the 2026 Winter Olympics medal count: USA, Norway, China, or other?", category: "sports", endDate: "2026-03-01", isHot: true },
  { question: "Will Lindsey Vonn win a medal at age 36 in Winter Olympics?", category: "sports", endDate: "2026-03-01", isHot: false },
  { question: "Will LeBron James retire in 2026?", category: "sports", endDate: "2026-12-31", isHot: false },
  { question: "Will James Harden lead Cavaliers to NBA championship?", category: "sports", endDate: "2026-06-30", isHot: true },
  { question: "Will Real Madrid win 2026 Champions League?", category: "sports", endDate: "2026-06-01", isHot: false },
  { question: "Will 2026 World Cup (US/Canada/Mexico) be the most-watched ever?", category: "sports", endDate: "2026-07-31", isHot: false },
  { question: "Who will win Super Bowl LX: Patriots or Seahawks?", category: "sports", endDate: "2026-02-10", isHot: true },
  { question: "Will NBA expand to 32 teams?", category: "sports", endDate: "2027-12-31", isHot: false },
  { question: "Will women's sports leagues (WNBA/NWSL) break viewership records in 2026?", category: "sports", endDate: "2026-12-31", isHot: false },
  { question: "Will NFL implement 18-game regular season?", category: "sports", endDate: "2027-12-31", isHot: false },

  // 🎭 娛樂 & 社會
  { question: "Will Melania Trump's documentary break Netflix viewing records?", category: "culture", endDate: "2026-06-30", isHot: false },
  { question: "Will more celebrities be implicated in Epstein files?", category: "culture", endDate: "2026-12-31", isHot: true },
  { question: "Will Taylor Swift announce retirement or hiatus in 2026?", category: "culture", endDate: "2026-12-31", isHot: false },
  { question: "Will an AI-generated song reach Billboard Top 10 in 2026?", category: "culture", endDate: "2026-12-31", isHot: false },
  { question: "Will there be a major celebrity 'cancel' event in 2026?", category: "culture", endDate: "2026-12-31", isHot: false },

  // 🎲 哲學題
  { question: "Would you pull the trolley lever?", category: "philosophy", endDate: "2027-02-04", isHot: false },
  { question: "Do we live in a simulation?", category: "philosophy", endDate: "2027-02-04", isHot: true },
  { question: "Would the world be better or worse if everyone could read minds?", category: "philosophy", endDate: "2027-02-04", isHot: false },
  { question: "Is AI conscious?", category: "philosophy", endDate: "2027-02-04", isHot: true },
  { question: "Is purple a red color or a blue color?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Is orange more red or more yellow?", category: "meme", endDate: "2027-02-04", isHot: false },
  { question: "Would you want to know the date of your death?", category: "philosophy", endDate: "2027-02-04", isHot: false },
  { question: "Would you choose immortality if you could?", category: "philosophy", endDate: "2027-02-04", isHot: false },
];

async function seed() {
  console.log('🌱 Seeding initial questions...');
  
  const count = createMarkets(INITIAL_QUESTIONS);
  
  console.log(`✅ Seeded ${count} questions!`);
}

seed().catch(console.error);
