/**
 * Chess.com-style 14-Bot Tier Ladder & 100% Offline Local Avatars (250 to 1800 Elo)
 *
 * All bots search with the native C++ engine at searchDepth: 5.
 * Strength differences are controlled by `maxEvalLoss` (in centipawns),
 * which determines how far from the optimal move a bot candidate choice can be.
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
    searchDepth: 5,
    maxEvalLoss: 250, // 2.5 pawns
    usePST: false,
    useBook: false
  },
  wayne: {
    id: 'wayne',
    name: 'Wayne',
    rating: 400,
    category: 'beginner',
    avatar: `${AVATAR_PATH}wayne.svg`,
    tagline: 'Grabs loose pieces, ignores basic tactics.',
    quote: "I like taking pieces. Watch out!",
    searchDepth: 5,
    maxEvalLoss: 200, // 2.0 pawns
    usePST: false,
    useBook: false
  },
  mina: {
    id: 'mina',
    name: 'Mina',
    rating: 550,
    category: 'beginner',
    avatar: `${AVATAR_PATH}mina.svg`,
    tagline: 'Casual attacker making frequent blunders.',
    quote: "Chess is fun! Hope I don't blunder.",
    searchDepth: 5,
    maxEvalLoss: 160, // 1.6 pawns
    usePST: false,
    useBook: false
  },
  elena: {
    id: 'elena',
    name: 'Elena',
    rating: 700,
    category: 'beginner',
    avatar: `${AVATAR_PATH}elena.svg`,
    tagline: 'Basic piece coordination with early positional play.',
    quote: "Let's have a nice, friendly game.",
    searchDepth: 5,
    maxEvalLoss: 130, // 1.3 pawns
    usePST: true,
    useBook: true
  },

  // --- Intermediate Tier (850 – 1300 Elo) ---
  oliver: {
    id: 'oliver',
    name: 'Oliver',
    rating: 850,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}oliver.svg`,
    tagline: 'Calculates simple tactical combinations.',
    quote: "I've been studying basic tactics!",
    searchDepth: 5,
    maxEvalLoss: 100, // 1.0 pawn
    usePST: true,
    useBook: true
  },
  nelson: {
    id: 'nelson',
    name: 'Nelson',
    rating: 1000,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}nelson.svg`,
    tagline: 'Early Queen attacks and relentless aggression!',
    quote: "My Queen is coming for you right away!",
    searchDepth: 5,
    maxEvalLoss: 80, // 0.8 pawn
    usePST: true,
    useBook: true,
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
    searchDepth: 5,
    maxEvalLoss: 70, // 0.7 pawn
    usePST: true,
    useBook: true
  },
  antonio: {
    id: 'antonio',
    name: 'Antonio',
    rating: 1200,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}antonio.svg`,
    tagline: 'Balanced positional play with piece-square bonuses.',
    quote: "Let's see how well you know your fundamentals.",
    searchDepth: 5,
    maxEvalLoss: 60, // 0.6 pawn
    usePST: true,
    useBook: true
  },
  zara: {
    id: 'zara',
    name: 'Zara',
    rating: 1300,
    category: 'intermediate',
    avatar: `${AVATAR_PATH}zara.svg`,
    tagline: 'Careful defender who rarely makes clear mistakes.',
    quote: "I rarely leave pieces undefended.",
    searchDepth: 5,
    maxEvalLoss: 45, // 0.45 pawn
    usePST: true,
    useBook: true
  },

  // --- Advanced Tier (1400 – 1800 Elo) ---
  isabel: {
    id: 'isabel',
    name: 'Isabel',
    rating: 1400,
    category: 'advanced',
    avatar: `${AVATAR_PATH}isabel.svg`,
    tagline: 'Solid positional play. Rarely strays from best moves.',
    quote: "I play solid, positional chess. Ready?",
    searchDepth: 5,
    maxEvalLoss: 35, // 0.35 pawn
    usePST: true,
    useBook: true
  },
  mateo: {
    id: 'mateo',
    name: 'Mateo',
    rating: 1500,
    category: 'advanced',
    avatar: `${AVATAR_PATH}mateo.svg`,
    tagline: 'Sharp tactical lines with slight variation.',
    quote: "Let's see if you can handle sharp complications.",
    searchDepth: 5,
    maxEvalLoss: 30, // 0.30 pawn
    usePST: true,
    useBook: true
  },
  li: {
    id: 'li',
    name: 'Li',
    rating: 1600,
    category: 'advanced',
    avatar: `${AVATAR_PATH}li.svg`,
    tagline: 'Deep Alpha-Beta search with MVV-LVA move ordering.',
    quote: "Balance and patience will decide this game.",
    searchDepth: 5,
    maxEvalLoss: 25, // 0.25 pawn
    usePST: true,
    useBook: true
  },
  sven: {
    id: 'sven',
    name: 'Sven',
    rating: 1700,
    category: 'advanced',
    avatar: `${AVATAR_PATH}sven.svg`,
    tagline: 'Relentless positional pressure and endgame conversions.',
    quote: "I will slowly grind down your position.",
    searchDepth: 5,
    maxEvalLoss: 15, // 0.15 pawn
    usePST: true,
    useBook: true
  },
  wojtek: {
    id: 'wojtek',
    name: 'Wojtek',
    rating: 1800,
    category: 'advanced',
    avatar: `${AVATAR_PATH}wojtek.svg`,
    tagline: 'Strict optimal play, deep search & move ordering.',
    quote: "I will crush you.",
    searchDepth: 5,
    maxEvalLoss: 0, // 0.0 pawn (strictly best move)
    usePST: true,
    useBook: true
  }
};

export const DEFAULT_BOT_ID = 'antonio';
