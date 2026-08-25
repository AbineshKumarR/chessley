/**
 * Chess.com-style 14-Bot Tier Ladder & 100% Offline Local Avatars (250 to 1800 Elo)
 */
const AVATAR_PATH = `${import.meta.env.BASE_URL}avatars/`;

export const DEFAULT_PLAYER_AVATAR = `${AVATAR_PATH}player.svg`;

export const BOT_CATEGORIES = [
  { id: 'beginner', name: 'Beginner', eloRange: '250 - 700' },
  { id: 'intermediate', name: 'Intermediate', eloRange: '850 - 1300' },
  { id: 'advanced', name: 'Advanced', eloRange: '1400 - 1800' }
];

export const BOTS = {
  // --- Beginner Tier (250 – 700 Elo) ---
  martin: {
    id: 'martin',
    name: 'Martin',
    rating: 250,
    category: 'beginner',
    avatar: `${AVATAR_PATH}martin.svg`,
    tagline: 'Learning the rules. Hangs pieces often!',
    quote: "Hi, I'm Martin! Let's play chess.",
    depth: 1,
    blunderRate: 0.80,
    evalNoise: 200,
    usePST: false
  },
  wayne: {
    id: 'wayne',
    name: 'Wayne',
    rating: 400,
    category: 'beginner',
    avatar: `${AVATAR_PATH}wayne.svg`,
    tagline: 'Grabs loose pieces, ignores basic tactics.',
    quote: "I like taking pieces. Watch out!",
    depth: 1,
    blunderRate: 0.65,
    evalNoise: 160,
    usePST: false
  },
  mina: {
    id: 'mina',
    name: 'Mina',
    rating: 550,
    category: 'beginner',
    avatar: `${AVATAR_PATH}mina.svg`,
    tagline: 'Casual attacker making frequent blunders.',
    quote: "Chess is fun! Hope I don't blunder.",
    depth: 1,
    blunderRate: 0.50,
    evalNoise: 120,
    usePST: false
  },
  elena: {
    id: 'elena',
    name: 'Elena',
    rating: 700,
    category: 'beginner',
    avatar: `${AVATAR_PATH}elena.svg`,
    tagline: 'Basic piece coordination with early positional play.',
    quote: "Let's have a nice, friendly game.",
    depth: 1,
    blunderRate: 0.38,
    evalNoise: 80,
    usePST: true
  },

  // --- Intermediate Tier (850 – 1300 Elo) ---
  oliver: {
    id: 'oliver',
    name: 'Oliver',
    rating: 850,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}oliver.svg`,
    tagline: 'Calculates simple 2-ply tactical combinations.',
    quote: "I've been studying basic tactics!",
    depth: 2,
    blunderRate: 0.28,
    evalNoise: 60,
    usePST: true
  },
  nelson: {
    id: 'nelson',
    name: 'Nelson',
    rating: 1000,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}nelson.svg`,
    tagline: 'Early Queen attacks and relentless aggression!',
    quote: "My Queen is coming for you right away!",
    depth: 2,
    blunderRate: 0.20,
    evalNoise: 40,
    usePST: true,
    queenAttackBonus: true
  },
  devi: {
    id: 'devi',
    name: 'Devi',
    rating: 1100,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}devi.svg`,
    tagline: 'Fast attacker focusing on central dominance.',
    quote: "Quick tactical strikes are my specialty.",
    depth: 2,
    blunderRate: 0.15,
    evalNoise: 25,
    usePST: true
  },
  antonio: {
    id: 'antonio',
    name: 'Antonio',
    rating: 1200,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}antonio.svg`,
    tagline: 'Balanced positional play with piece-square bonuses.',
    quote: "Let's see how well you know your fundamentals.",
    depth: 2,
    blunderRate: 0.10,
    evalNoise: 15,
    usePST: true
  },
  zara: {
    id: 'zara',
    name: 'Zara',
    rating: 1300,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}zara.svg`,
    tagline: 'Careful defender who rarely makes clear mistakes.',
    quote: "I rarely leave pieces undefended.",
    depth: 2,
    blunderRate: 0.05,
    evalNoise: 5,
    usePST: true
  },

  // --- Advanced Tier (1400 – 1800 Elo) ---
  isabel: {
    id: 'isabel',
    name: 'Isabel',
    rating: 1400,
    category: 'advanced',
    avatar: `${AVATAR_PATH}isabel.svg`,
    tagline: 'Strict optimal 2-ply Minimax. Zero blunders.',
    quote: "I play solid, positional chess. Ready?",
    depth: 2,
    blunderRate: 0.00,
    evalNoise: 0,
    usePST: true
  },
  mateo: {
    id: 'mateo',
    name: 'Mateo',
    rating: 1500,
    category: 'advanced',
    avatar: `${AVATAR_PATH}mateo.svg`,
    tagline: 'Sharp 3-ply tactical lines with slight variation.',
    quote: "Let's see if you can handle sharp complications.",
    depth: 3,
    blunderRate: 0.08,
    evalNoise: 15,
    usePST: true
  },
  li: {
    id: 'li',
    name: 'Li',
    rating: 1600,
    category: 'advanced',
    avatar: `${AVATAR_PATH}li.svg`,
    tagline: 'Deep 3-ply Alpha-Beta with MVV-LVA move ordering.',
    quote: "Balance and patience will decide this game.",
    depth: 3,
    blunderRate: 0.04,
    evalNoise: 5,
    usePST: true
  },
  sven: {
    id: 'sven',
    name: 'Sven',
    rating: 1700,
    category: 'advanced',
    avatar: `${AVATAR_PATH}sven.svg`,
    tagline: 'Relentless positional pressure and endgame conversions.',
    quote: "I will slowly grind down your position.",
    depth: 3,
    blunderRate: 0.01,
    evalNoise: 0,
    usePST: true
  },
  wojtek: {
    id: 'wojtek',
    name: 'Wojtek',
    rating: 1800,
    category: 'advanced',
    avatar: `${AVATAR_PATH}wojtek.svg`,
    tagline: 'Strict optimal 3-ply + Alpha-Beta & deep move ordering.',
    quote: "I will crush you.",
    depth: 3,
    blunderRate: 0.00,
    evalNoise: 0,
    usePST: true
  }
};

export const DEFAULT_BOT_ID = 'antonio';
