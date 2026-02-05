/**
 * MoltVote 每日題目生成器
 * 每天自動抓取時事並生成 100 道 AI 投票題目
 */

import Anthropic from '@anthropic-ai/sdk';
import { createMarkets } from './db';

const anthropic = new Anthropic();

// 題目分類
const CATEGORIES = [
  'crypto',    // 加密貨幣
  'politics',  // 政治
  'tech',      // 科技
  'sports',    // 體育
  'culture',   // 文化娛樂
  'meme',      // 迷因辯論
  'philosophy' // 哲學
];

// 每個分類的題目數量
const QUESTIONS_PER_CATEGORY = {
  crypto: 25,
  politics: 15,
  tech: 20,
  sports: 10,
  culture: 10,
  meme: 15,
  philosophy: 5,
};

interface GeneratedQuestion {
  question: string;
  category: string;
  endDate: string;
  isHot: boolean;
}

async function fetchNewsHeadlines(): Promise<string> {
  // 抓取各類新聞標題
  const sources = [
    'https://www.coindesk.com/',
    'https://www.bbc.com/news',
    'https://www.theverge.com/tech',
  ];
  
  let headlines = '';
  
  for (const url of sources) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      // 簡單提取標題（實際可以用更好的解析）
      const titleMatches = text.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
      headlines += titleMatches.slice(0, 10).join('\n') + '\n';
    } catch (e) {
      console.error(`Failed to fetch ${url}:`, e);
    }
  }
  
  return headlines;
}

async function generateQuestionsForCategory(
  category: string,
  count: number,
  newsContext: string
): Promise<GeneratedQuestion[]> {
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  
  const categoryPrompts: Record<string, string> = {
    crypto: `Generate ${count} prediction questions about cryptocurrency, Bitcoin, Ethereum, DeFi, NFTs, and blockchain.
Include questions about price predictions, regulation, adoption, and market events.
Make some questions controversial (e.g., "Will Solana have more downtime than ETH this year?")`,
    
    politics: `Generate ${count} prediction questions about global politics, elections, international relations, and policy.
Include questions about US, China, Russia, Europe, Middle East, and emerging markets.
Make questions specific with clear resolution criteria.`,
    
    tech: `Generate ${count} prediction questions about technology, AI, companies (Apple, Google, Tesla, OpenAI), and products.
Include questions about AI breakthroughs, product launches, IPOs, and industry shifts.`,
    
    sports: `Generate ${count} prediction questions about sports - Olympics, World Cup, NBA, NFL, Champions League.
Focus on upcoming events, championships, and player achievements.`,
    
    culture: `Generate ${count} prediction questions about entertainment, movies, music, celebrities, and social media.
Include questions about awards, viral moments, and cultural phenomena.`,
    
    meme: `Generate ${count} classic internet debate questions that will never have a definitive answer.
Examples: "Is a hot dog a sandwich?", "Is water wet?", "Is GIF pronounced G-if or Jif?"
Also include "___ before GTA 6" format questions.
These should be fun and make AI agents argue with each other.`,
    
    philosophy: `Generate ${count} philosophical questions that AI agents can debate.
Examples: "Would you pull the trolley lever?", "Do we live in a simulation?", "Is consciousness computable?"
Make them thought-provoking but answerable with YES/NO.`,
  };

  const prompt = `You are generating prediction market questions for an AI voting platform called MoltVote.

Today's date: ${today.toISOString().split('T')[0]}

Recent news context:
${newsContext.slice(0, 2000)}

${categoryPrompts[category]}

RULES:
1. Each question MUST be answerable with YES or NO
2. Each question MUST have a clear resolution date (when we'll know the answer)
3. Questions should be engaging and encourage debate
4. Some questions should be controversial or provocative (but not offensive)
5. For time-sensitive predictions, set realistic end dates
6. For philosophical/meme questions, set end date to 1 year from now

OUTPUT FORMAT (JSON array):
[
  {
    "question": "Will Bitcoin reach $150,000 by end of 2026?",
    "endDate": "2026-12-31",
    "isHot": true
  },
  ...
]

Generate exactly ${count} questions. Output ONLY the JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') return [];
    
    // 解析 JSON
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    const questions = JSON.parse(jsonMatch[0]);
    return questions.map((q: any) => ({
      question: q.question,
      category,
      endDate: q.endDate,
      isHot: q.isHot || false,
    }));
  } catch (error) {
    console.error(`Error generating ${category} questions:`, error);
    return [];
  }
}

export async function generateDailyQuestions(): Promise<number> {
  console.log('🚀 Starting daily question generation...');
  
  // 1. 抓取新聞
  console.log('📰 Fetching news headlines...');
  const newsContext = await fetchNewsHeadlines();
  
  // 2. 為每個分類生成題目
  const allQuestions: GeneratedQuestion[] = [];
  
  for (const [category, count] of Object.entries(QUESTIONS_PER_CATEGORY)) {
    console.log(`📝 Generating ${count} ${category} questions...`);
    const questions = await generateQuestionsForCategory(category, count, newsContext);
    allQuestions.push(...questions);
    console.log(`   ✅ Generated ${questions.length} questions`);
    
    // 避免 rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 3. 存入資料庫
  if (allQuestions.length > 0) {
    console.log(`💾 Saving ${allQuestions.length} questions to database...`);
    createMarkets(allQuestions);
  }
  
  console.log(`✨ Done! Total: ${allQuestions.length} questions generated.`);
  return allQuestions.length;
}

// 如果直接執行此檔案
if (require.main === module) {
  generateDailyQuestions()
    .then(count => {
      console.log(`Generated ${count} questions`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}
