// Chessley C++ Chess Engine
// Native Chess Engine with Iterative Deepening Alpha-Beta, TT + Zobrist Hashing,
// Quiescence Search, MVV-LVA / Killer / History Move Ordering, PST Evaluation,
// Embedded Opening Book, Skill-Based Controlled Candidate Selection, and Perft Harness.

#include <cstdint>
#include <cstring>
#include <cctype>
#include <cstdlib>
#include <string>
#include <sstream>
#include <iostream>
#include <vector>
#include <chrono>
#include <random>
#include <algorithm>
#include <unordered_map>
#include <map>

using namespace std;
using Clock = chrono::steady_clock;

enum { WHITE = 0, BLACK = 1 };
enum { PT_NONE = 0, PT_P = 1, PT_N = 2, PT_B = 3, PT_R = 4, PT_Q = 5, PT_K = 6 };

static inline int makePiece(int color, int type) { return type == PT_NONE ? 0 : color * 6 + type; }
static inline int pieceColor(int p) { return (p - 1) / 6; }
static inline int pieceType(int p) { return (p - 1) % 6 + 1; }

static const int PIECE_VALUE[7] = { 0, 100, 320, 330, 500, 900, 20000 };
static const int MATE_VALUE = 1000000;
static const int INF_SCORE = 2000000;

// ---------------- Piece-square tables (White's perspective, row0 = rank8) ----------------
static const int PAWN_TABLE[64] = {
  0,0,0,0,0,0,0,0,
  50,50,50,50,50,50,50,50,
  10,10,20,30,30,20,10,10,
  5,5,10,25,25,10,5,5,
  0,0,0,20,20,0,0,0,
  5,-5,-10,0,0,-10,-5,5,
  5,10,10,-20,-20,10,10,5,
  0,0,0,0,0,0,0,0
};
static const int PAWN_EG_TABLE[64] = {
  0,0,0,0,0,0,0,0,
  80,80,80,80,80,80,80,80,
  50,50,50,50,50,50,50,50,
  30,30,30,30,30,30,30,30,
  15,15,15,20,20,15,15,15,
  5,5,5,5,5,5,5,5,
  5,5,5,-10,-10,5,5,5,
  0,0,0,0,0,0,0,0
};
static const int KNIGHT_TABLE[64] = {
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,0,0,0,0,-20,-40,
  -30,0,10,15,15,10,0,-30,
  -30,5,15,20,20,15,5,-30,
  -30,0,15,20,20,15,0,-30,
  -30,5,10,15,15,10,5,-30,
  -40,-20,0,5,5,0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
};
static const int BISHOP_TABLE[64] = {
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,0,0,0,0,0,0,-10,
  -10,0,5,10,10,5,0,-10,
  -10,5,5,10,10,5,5,-10,
  -10,0,10,10,10,10,0,-10,
  -10,10,10,10,10,10,10,-10,
  -10,5,0,0,0,0,5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
};
static const int ROOK_TABLE[64] = {
  0,0,0,0,0,0,0,0,
  5,10,10,10,10,10,10,5,
  -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5,
  0,0,0,5,5,0,0,0
};
static const int QUEEN_TABLE[64] = {
  -20,-10,-10,-5,-5,-10,-10,-20,
  -10,0,0,0,0,0,0,-10,
  -10,0,5,5,5,5,0,-10,
  -5,0,5,5,5,5,0,-5,
  0,0,5,5,5,5,0,-5,
  -10,5,5,5,5,5,0,-10,
  -10,0,5,0,0,0,0,-10,
  -20,-10,-10,-5,-5,-10,-10,-20
};
static const int KING_MG_TABLE[64] = {
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20,20,0,0,0,0,20,20,
  20,30,10,0,0,10,30,20
};
static const int KING_EG_TABLE[64] = {
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,0,0,-10,-20,-30,
  -30,-10,20,30,30,20,-10,-30,
  -30,-10,30,40,40,30,-10,-30,
  -30,-10,30,40,40,30,-10,-30,
  -30,-10,20,30,30,20,-10,-30,
  -30,-30,0,0,0,0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50
};

static inline int pstIndex(int sq, int color) {
  int rank = sq / 8, file = sq % 8;
  return color == WHITE ? (7 - rank) * 8 + file : rank * 8 + file;
}
static int pstScore(int type, int color, int sq, bool endgame) {
  int idx = pstIndex(sq, color);
  switch (type) {
    case PT_P: return endgame ? PAWN_EG_TABLE[idx] : PAWN_TABLE[idx];
    case PT_N: return KNIGHT_TABLE[idx];
    case PT_B: return BISHOP_TABLE[idx];
    case PT_R: return ROOK_TABLE[idx];
    case PT_Q: return QUEEN_TABLE[idx];
    case PT_K: return endgame ? KING_EG_TABLE[idx] : KING_MG_TABLE[idx];
  }
  return 0;
}

// ---------------- Move / Board ----------------
struct Move {
  uint8_t from = 64, to = 64, promo = 0, flags = 0;
};
static const uint8_t MF_CAP = 1, MF_EP = 2, MF_DOUBLE = 4, MF_CASTLE_K = 8, MF_CASTLE_Q = 16;

struct Undo {
  int captured = 0; int capturedSq = -1;
  int castling = 0; int epSquare = -1; int halfmoveClock = 0; uint64_t hash = 0;
};

struct Board {
  int sq[64];
  int side;
  int castling;
  int epSquare;
  int halfmoveClock;
  int fullmove;
  uint64_t hash;
};

// ---------------- Zobrist hashing ----------------
static uint64_t Z_PIECE[13][64];
static uint64_t Z_SIDE;
static uint64_t Z_CASTLE[16];
static uint64_t Z_EP[8];

static void initZobrist() {
  mt19937_64 rng(0x9E3779B97F4A7C15ULL);
  for (int p = 0; p < 13; p++) for (int s = 0; s < 64; s++) Z_PIECE[p][s] = rng();
  Z_SIDE = rng();
  for (int i = 0; i < 16; i++) Z_CASTLE[i] = rng();
  for (int i = 0; i < 8; i++) Z_EP[i] = rng();
}

static uint64_t computeHash(const Board& b) {
  uint64_t h = 0;
  for (int s = 0; s < 64; s++) if (b.sq[s]) h ^= Z_PIECE[b.sq[s]][s];
  if (b.side == BLACK) h ^= Z_SIDE;
  h ^= Z_CASTLE[b.castling];
  if (b.epSquare >= 0) h ^= Z_EP[b.epSquare % 8];
  return h;
}

// ---------------- FEN helpers ----------------
static int parseSquare(const string& s) {
  if (s == "-" || s.size() < 2) return -1;
  int file = s[0] - 'a';
  int rank = s[1] - '1';
  return rank * 8 + file;
}
static string squareName(int sq) {
  if (sq < 0 || sq > 63) return "-";
  string r; r += char('a' + sq % 8); r += char('1' + sq / 8); return r;
}

static void setFEN(Board& b, const string& f1, const string& f2, const string& f3,
                    const string& f4, const string& f5, const string& f6) {
  memset(b.sq, 0, sizeof(b.sq));
  int rank = 7, file = 0;
  for (char c : f1) {
    if (c == '/') { rank--; file = 0; continue; }
    if (isdigit((unsigned char)c)) { file += c - '0'; continue; }
    int color = isupper((unsigned char)c) ? WHITE : BLACK;
    int type;
    switch (tolower(c)) {
      case 'p': type = PT_P; break;
      case 'n': type = PT_N; break;
      case 'b': type = PT_B; break;
      case 'r': type = PT_R; break;
      case 'q': type = PT_Q; break;
      case 'k': type = PT_K; break;
      default: type = PT_NONE;
    }
    if (rank >= 0 && rank < 8 && file >= 0 && file < 8) b.sq[rank * 8 + file] = makePiece(color, type);
    file++;
  }
  b.side = (f2 == "w") ? WHITE : BLACK;
  b.castling = 0;
  if (f3.find('K') != string::npos) b.castling |= 1;
  if (f3.find('Q') != string::npos) b.castling |= 2;
  if (f3.find('k') != string::npos) b.castling |= 4;
  if (f3.find('q') != string::npos) b.castling |= 8;
  b.epSquare = parseSquare(f4);
  b.halfmoveClock = f5.empty() ? 0 : atoi(f5.c_str());
  b.fullmove = f6.empty() ? 1 : atoi(f6.c_str());
  b.hash = computeHash(b);
}

static string getPositionFenKey(const Board& b) {
  string s;
  for (int rank = 7; rank >= 0; rank--) {
    int empty = 0;
    for (int file = 0; file < 8; file++) {
      int p = b.sq[rank * 8 + file];
      if (!p) { empty++; }
      else {
        if (empty > 0) { s += to_string(empty); empty = 0; }
        int c = pieceColor(p), t = pieceType(p);
        char ch = 'p';
        switch (t) {
          case PT_P: ch = 'p'; break;
          case PT_N: ch = 'n'; break;
          case PT_B: ch = 'b'; break;
          case PT_R: ch = 'r'; break;
          case PT_Q: ch = 'q'; break;
          case PT_K: ch = 'k'; break;
        }
        s += (c == WHITE) ? (char)toupper(ch) : ch;
      }
    }
    if (empty > 0) s += to_string(empty);
    if (rank > 0) s += "/";
  }
  s += (b.side == WHITE) ? " w" : " b";
  return s;
}

// ---------------- Attack detection ----------------
static const int KNIGHT_D[8][2] = { {1,2},{2,1},{2,-1},{1,-2},{-1,-2},{-2,-1},{2,1},{-1,2} };
static const int KING_D[8][2]   = { {1,0},{1,1},{0,1},{-1,1},{-1,0},{-1,-1},{0,-1},{1,-1} };
static const int BISHOP_D[4][2] = { {1,1},{1,-1},{-1,1},{-1,-1} };
static const int ROOK_D[4][2]   = { {1,0},{-1,0},{0,1},{0,-1} };

static inline bool onBoard(int f, int r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }

static bool isSquareAttacked(const Board& b, int s, int byColor) {
  int sf = s % 8, sr = s / 8;
  if (byColor == WHITE) {
    if (sr > 0) {
      if (sf > 0 && b.sq[s - 9] == makePiece(WHITE, PT_P)) return true;
      if (sf < 7 && b.sq[s - 7] == makePiece(WHITE, PT_P)) return true;
    }
  } else {
    if (sr < 7) {
      if (sf > 0 && b.sq[s + 7] == makePiece(BLACK, PT_P)) return true;
      if (sf < 7 && b.sq[s + 9] == makePiece(BLACK, PT_P)) return true;
    }
  }
  for (auto& d : KNIGHT_D) {
    int f = sf + d[0], r = sr + d[1];
    if (onBoard(f, r) && b.sq[r * 8 + f] == makePiece(byColor, PT_N)) return true;
  }
  for (auto& d : KING_D) {
    int f = sf + d[0], r = sr + d[1];
    if (onBoard(f, r) && b.sq[r * 8 + f] == makePiece(byColor, PT_K)) return true;
  }
  for (auto& d : BISHOP_D) {
    int f = sf + d[0], r = sr + d[1];
    while (onBoard(f, r)) {
      int p = b.sq[r * 8 + f];
      if (p) { if (pieceColor(p) == byColor && (pieceType(p) == PT_B || pieceType(p) == PT_Q)) return true; break; }
      f += d[0]; r += d[1];
    }
  }
  for (auto& d : ROOK_D) {
    int f = sf + d[0], r = sr + d[1];
    while (onBoard(f, r)) {
      int p = b.sq[r * 8 + f];
      if (p) { if (pieceColor(p) == byColor && (pieceType(p) == PT_R || pieceType(p) == PT_Q)) return true; break; }
      f += d[0]; r += d[1];
    }
  }
  return false;
}

static inline int kingSquare(const Board& b, int color) {
  int kp = makePiece(color, PT_K);
  for (int s = 0; s < 64; s++) if (b.sq[s] == kp) return s;
  return -1;
}
static inline bool inCheck(const Board& b, int color) {
  int ks = kingSquare(b, color);
  return ks >= 0 && isSquareAttacked(b, ks, 1 - color);
}

// ---------------- Move generation ----------------
static int genPseudo(const Board& b, Move* list) {
  int n = 0;
  int us = b.side, them = 1 - us;
  for (int s = 0; s < 64; s++) {
    int p = b.sq[s];
    if (!p || pieceColor(p) != us) continue;
    int type = pieceType(p);
    int f = s % 8, r = s / 8;

    if (type == PT_P) {
      int dir = us == WHITE ? 1 : -1;
      int startRank = us == WHITE ? 1 : 6;
      int promoRank = us == WHITE ? 7 : 0;
      int oneSq = s + dir * 8;
      if (oneSq >= 0 && oneSq < 64 && b.sq[oneSq] == 0) {
        if (oneSq / 8 == promoRank) {
          for (int pr = PT_Q; pr >= PT_N; pr--) list[n++] = { (uint8_t)s,(uint8_t)oneSq,(uint8_t)pr,0 };
        } else {
          list[n++] = { (uint8_t)s,(uint8_t)oneSq,0,0 };
          if (r == startRank) {
            int twoSq = s + dir * 16;
            if (b.sq[twoSq] == 0) list[n++] = { (uint8_t)s,(uint8_t)twoSq,0,MF_DOUBLE };
          }
        }
      }
      for (int df : {-1, 1}) {
        int nf = f + df, nr = r + dir;
        if (!onBoard(nf, nr)) continue;
        int ts = nr * 8 + nf;
        if (b.sq[ts] && pieceColor(b.sq[ts]) == them) {
          if (nr == promoRank) { for (int pr = PT_Q; pr >= PT_N; pr--) list[n++] = { (uint8_t)s,(uint8_t)ts,(uint8_t)pr,MF_CAP }; }
          else list[n++] = { (uint8_t)s,(uint8_t)ts,0,MF_CAP };
        } else if (ts == b.epSquare) {
          list[n++] = { (uint8_t)s,(uint8_t)ts,0,(uint8_t)(MF_CAP | MF_EP) };
        }
      }
    } else if (type == PT_N) {
      for (auto& d : KNIGHT_D) {
        int nf = f + d[0], nr = r + d[1];
        if (!onBoard(nf, nr)) continue;
        int ts = nr * 8 + nf; int tp = b.sq[ts];
        if (!tp) list[n++] = { (uint8_t)s,(uint8_t)ts,0,0 };
        else if (pieceColor(tp) == them) list[n++] = { (uint8_t)s,(uint8_t)ts,0,MF_CAP };
      }
    } else if (type == PT_K) {
      for (auto& d : KING_D) {
        int nf = f + d[0], nr = r + d[1];
        if (!onBoard(nf, nr)) continue;
        int ts = nr * 8 + nf; int tp = b.sq[ts];
        if (!tp) list[n++] = { (uint8_t)s,(uint8_t)ts,0,0 };
        else if (pieceColor(tp) == them) list[n++] = { (uint8_t)s,(uint8_t)ts,0,MF_CAP };
      }
      if (us == WHITE && s == 4) {
        if ((b.castling & 1) && b.sq[5] == 0 && b.sq[6] == 0 && b.sq[7] == makePiece(WHITE, PT_R) &&
            !isSquareAttacked(b, 4, BLACK) && !isSquareAttacked(b, 5, BLACK) && !isSquareAttacked(b, 6, BLACK))
          list[n++] = { 4,6,0,MF_CASTLE_K };
        if ((b.castling & 2) && b.sq[3] == 0 && b.sq[2] == 0 && b.sq[1] == 0 && b.sq[0] == makePiece(WHITE, PT_R) &&
            !isSquareAttacked(b, 4, BLACK) && !isSquareAttacked(b, 3, BLACK) && !isSquareAttacked(b, 2, BLACK))
          list[n++] = { 4,2,0,MF_CASTLE_Q };
      } else if (us == BLACK && s == 60) {
        if ((b.castling & 4) && b.sq[61] == 0 && b.sq[62] == 0 && b.sq[63] == makePiece(BLACK, PT_R) &&
            !isSquareAttacked(b, 60, WHITE) && !isSquareAttacked(b, 61, WHITE) && !isSquareAttacked(b, 62, WHITE))
          list[n++] = { 60,62,0,MF_CASTLE_K };
        if ((b.castling & 8) && b.sq[59] == 0 && b.sq[58] == 0 && b.sq[57] == 0 && b.sq[56] == makePiece(BLACK, PT_R) &&
            !isSquareAttacked(b, 60, WHITE) && !isSquareAttacked(b, 59, WHITE) && !isSquareAttacked(b, 58, WHITE))
          list[n++] = { 60,58,0,MF_CASTLE_Q };
      }
    } else if (type == PT_Q) {
      for (auto& d : BISHOP_D) {
        int nf = f + d[0], nr = r + d[1];
        while (onBoard(nf, nr)) {
          int ts = nr * 8 + nf; int tp = b.sq[ts];
          if (!tp) list[n++] = { (uint8_t)s,(uint8_t)ts,0,0 };
          else { if (pieceColor(tp) == them) list[n++] = { (uint8_t)s,(uint8_t)ts,0,MF_CAP }; break; }
          nf += d[0]; nr += d[1];
        }
      }
      for (auto& d : ROOK_D) {
        int nf = f + d[0], nr = r + d[1];
        while (onBoard(nf, nr)) {
          int ts = nr * 8 + nf; int tp = b.sq[ts];
          if (!tp) list[n++] = { (uint8_t)s,(uint8_t)ts,0,0 };
          else { if (pieceColor(tp) == them) list[n++] = { (uint8_t)s,(uint8_t)ts,0,MF_CAP }; break; }
          nf += d[0]; nr += d[1];
        }
      }
    } else {
      const int (*dirs)[2] = (type == PT_B) ? BISHOP_D : ROOK_D;
      for (int i = 0; i < 4; i++) {
        int nf = f + dirs[i][0], nr = r + dirs[i][1];
        while (onBoard(nf, nr)) {
          int ts = nr * 8 + nf; int tp = b.sq[ts];
          if (!tp) list[n++] = { (uint8_t)s,(uint8_t)ts,0,0 };
          else { if (pieceColor(tp) == them) list[n++] = { (uint8_t)s,(uint8_t)ts,0,MF_CAP }; break; }
          nf += dirs[i][0]; nr += dirs[i][1];
        }
      }
    }
  }
  return n;
}

static Undo makeMove(Board& b, const Move& m) {
  Undo u;
  u.castling = b.castling; u.epSquare = b.epSquare; u.halfmoveClock = b.halfmoveClock; u.hash = b.hash;
  u.captured = 0; u.capturedSq = -1;

  int piece = b.sq[m.from];
  int us = b.side;
  int type = pieceType(piece);

  if (m.flags & MF_EP) {
    int capSq = m.to + (us == WHITE ? -8 : 8);
    u.captured = b.sq[capSq]; u.capturedSq = capSq;
    b.sq[capSq] = 0;
  } else if (b.sq[m.to]) {
    u.captured = b.sq[m.to]; u.capturedSq = m.to;
  }

  b.sq[m.from] = 0;
  int placedPiece = m.promo ? makePiece(us, m.promo) : piece;
  b.sq[m.to] = placedPiece;

  if (m.flags & MF_CASTLE_K) {
    if (us == WHITE) { b.sq[7] = 0; b.sq[5] = makePiece(WHITE, PT_R); }
    else { b.sq[63] = 0; b.sq[61] = makePiece(BLACK, PT_R); }
  } else if (m.flags & MF_CASTLE_Q) {
    if (us == WHITE) { b.sq[0] = 0; b.sq[3] = makePiece(WHITE, PT_R); }
    else { b.sq[56] = 0; b.sq[59] = makePiece(BLACK, PT_R); }
  }

  if (type == PT_K) { if (us == WHITE) b.castling &= ~3; else b.castling &= ~12; }
  if (m.from == 0 || m.to == 0) b.castling &= ~2;
  if (m.from == 7 || m.to == 7) b.castling &= ~1;
  if (m.from == 56 || m.to == 56) b.castling &= ~8;
  if (m.from == 63 || m.to == 63) b.castling &= ~4;

  b.epSquare = (m.flags & MF_DOUBLE) ? (m.from + m.to) / 2 : -1;

  if (type == PT_P || u.captured) b.halfmoveClock = 0; else b.halfmoveClock++;
  if (us == BLACK) b.fullmove++;

  b.side = 1 - us;
  b.hash = computeHash(b);
  return u;
}

static void unmakeMove(Board& b, const Move& m, const Undo& u) {
  int us = 1 - b.side;
  int placedPiece = b.sq[m.to];
  int origPiece = m.promo ? makePiece(us, PT_P) : placedPiece;

  b.sq[m.from] = origPiece;
  b.sq[m.to] = 0;
  if (u.capturedSq >= 0) b.sq[u.capturedSq] = u.captured;

  if (m.flags & MF_CASTLE_K) {
    if (us == WHITE) { b.sq[5] = 0; b.sq[7] = makePiece(WHITE, PT_R); }
    else { b.sq[61] = 0; b.sq[63] = makePiece(BLACK, PT_R); }
  } else if (m.flags & MF_CASTLE_Q) {
    if (us == WHITE) { b.sq[3] = 0; b.sq[0] = makePiece(WHITE, PT_R); }
    else { b.sq[59] = 0; b.sq[56] = makePiece(BLACK, PT_R); }
  }

  b.castling = u.castling; b.epSquare = u.epSquare; b.halfmoveClock = u.halfmoveClock; b.hash = u.hash;
  b.side = us;
  if (us == BLACK) b.fullmove--;
}

static int genLegal(Board& b, Move* list) {
  Move pseudo[256];
  int pn = genPseudo(b, pseudo);
  int n = 0;
  int us = b.side;
  for (int i = 0; i < pn; i++) {
    Undo u = makeMove(b, pseudo[i]);
    if (!inCheck(b, us)) list[n++] = pseudo[i];
    unmakeMove(b, pseudo[i], u);
  }
  return n;
}

// ---------------- Perft Harness ----------------
static uint64_t perft(Board& b, int depth) {
  if (depth == 0) return 1ULL;
  Move moves[256];
  int n = genLegal(b, moves);
  if (depth == 1) return (uint64_t)n;
  uint64_t nodes = 0;
  for (int i = 0; i < n; i++) {
    Undo u = makeMove(b, moves[i]);
    nodes += perft(b, depth - 1);
    unmakeMove(b, moves[i], u);
  }
  return nodes;
}

// ---------------- Evaluation ----------------
static bool isEndgame(const Board& b) {
  int wq = 0, bq = 0, wmm = 0, bmm = 0;
  for (int s = 0; s < 64; s++) {
    int p = b.sq[s]; if (!p) continue;
    int c = pieceColor(p), t = pieceType(p);
    if (t == PT_Q) { if (c == WHITE) wq++; else bq++; }
    else if (t != PT_P && t != PT_K) { if (c == WHITE) wmm++; else bmm++; }
  }
  bool wOk = (wq == 0) || (wq == 1 && wmm <= 1);
  bool bOk = (bq == 0) || (bq == 1 && bmm <= 1);
  return wOk && bOk;
}

static bool insufficientMaterial(const Board& b) {
  int pawns = 0, rooks = 0, queens = 0, minors = 0;
  for (int s = 0; s < 64; s++) {
    int p = b.sq[s]; if (!p) continue;
    int t = pieceType(p);
    if (t == PT_P) pawns++;
    else if (t == PT_R) rooks++;
    else if (t == PT_Q) queens++;
    else if (t == PT_N || t == PT_B) minors++;
  }
  if (pawns || rooks || queens) return false;
  return minors <= 1;
}

static int evalStatic(const Board& b, bool usePST, bool queenBonus) {
  bool eg = usePST ? isEndgame(b) : false;
  int score = 0;
  for (int s = 0; s < 64; s++) {
    int p = b.sq[s]; if (!p) continue;
    int c = pieceColor(p), t = pieceType(p);
    int val = PIECE_VALUE[t];
    int pst = usePST ? pstScore(t, c, s, eg) : 0;
    int pieceScore = val + pst;
    if (queenBonus && t == PT_Q && c == BLACK && (s / 8) <= 5) pieceScore += 45;
    score += (c == WHITE ? pieceScore : -pieceScore);
  }
  return score;
}

// ---------------- Transposition table ----------------
enum { TT_EXACT = 0, TT_LOWER = 1, TT_UPPER = 2 };
struct TTEntry {
  uint64_t key = 0;
  int16_t depth = -1;
  int32_t score = 0;
  uint8_t bound = 0;
  uint8_t from = 64, to = 64, promo = 0;
};
static const size_t TT_SIZE = 1 << 20;
static vector<TTEntry> TT(TT_SIZE);
static long long ttProbes = 0, ttHits = 0;

static TTEntry* ttProbe(uint64_t key, int ply, int& outScore) {
  ttProbes++;
  TTEntry& e = TT[key % TT_SIZE];
  if (e.key == key) {
    ttHits++;
    int score = e.score;
    // Mate score normalization on probe
    if (score > MATE_VALUE - 1000) score -= ply;
    else if (score < -MATE_VALUE + 1000) score += ply;
    outScore = score;
    return &e;
  }
  return nullptr;
}

static void ttStore(uint64_t key, int depth, int score, int bound, Move best, int ply) {
  TTEntry& e = TT[key % TT_SIZE];
  if (e.key != key || depth >= e.depth) {
    e.key = key;
    e.depth = (int16_t)depth;
    // Mate score normalization on store
    int storeScore = score;
    if (storeScore > MATE_VALUE - 1000) storeScore += ply;
    else if (storeScore < -MATE_VALUE + 1000) storeScore -= ply;
    e.score = storeScore;
    e.bound = (uint8_t)bound;
    e.from = best.from; e.to = best.to; e.promo = best.promo;
  }
}

// ---------------- Move ordering ----------------
static Move killers[130][2];
static int history[64][64];

static int mvvLva(const Board& b, const Move& m) {
  int attacker = pieceType(b.sq[m.from]);
  int victimSq = (m.flags & MF_EP) ? (m.to + (b.side == WHITE ? -8 : 8)) : m.to;
  int victim = b.sq[victimSq];
  int victimType = victim ? pieceType(victim) : PT_P;
  return PIECE_VALUE[victimType] * 10 - PIECE_VALUE[attacker];
}

static void orderMoves(Board& b, Move* list, int n, const Move& ttMove, int ply) {
  static int scores[256];
  int kp = min(ply, 129);
  for (int i = 0; i < n; i++) {
    Move& m = list[i];
    int s;
    if (ttMove.to != 64 && m.from == ttMove.from && m.to == ttMove.to && m.promo == ttMove.promo) s = 1000000;
    else if (m.flags & MF_CAP) s = 500000 + mvvLva(b, m);
    else if (m.promo) s = 400000 + PIECE_VALUE[m.promo];
    else if (killers[kp][0].to == m.to && killers[kp][0].from == m.from) s = 300000;
    else if (killers[kp][1].to == m.to && killers[kp][1].from == m.from) s = 290000;
    else s = history[m.from][m.to];
    scores[i] = s;
  }
  for (int i = 1; i < n; i++) {
    int j = i;
    while (j > 0 && scores[j - 1] < scores[j]) {
      swap(scores[j - 1], scores[j]); swap(list[j - 1], list[j]); j--;
    }
  }
}

// ---------------- Time management ----------------
static Clock::time_point searchStart;
static long long timeLimitMs;
static long long nodeCount;
struct TimeUp {};
static inline void checkTime() {
  if ((nodeCount & 2047) == 0) {
    auto elapsed = chrono::duration_cast<chrono::milliseconds>(Clock::now() - searchStart).count();
    if (elapsed >= timeLimitMs) throw TimeUp{};
  }
}

// ---------------- Quiescence search ----------------
static int quiescence(Board& b, int alpha, int beta, int ply, bool usePST, bool queenBonus, int qDepthLeft) {
  nodeCount++; checkTime();
  if (ply >= 100) { int e = evalStatic(b, usePST, queenBonus); return b.side == WHITE ? e : -e; }

  int us = b.side;
  bool chk = inCheck(b, us);
  int standPat = 0;
  if (!chk) {
    int e = evalStatic(b, usePST, queenBonus);
    standPat = (us == WHITE) ? e : -e;
    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;
  }

  Move pseudo[256]; int pn = 0;
  if (chk) {
    pn = genPseudo(b, pseudo);
  } else if (qDepthLeft > 0) {
    Move all[256]; int an = genPseudo(b, all);
    for (int i = 0; i < an; i++) if ((all[i].flags & MF_CAP) || all[i].promo) pseudo[pn++] = all[i];
  }
  orderMoves(b, pseudo, pn, Move{}, min(ply, 129));

  int best = chk ? -INF_SCORE : standPat;
  int legalCount = 0;
  for (int i = 0; i < pn; i++) {
    Move m = pseudo[i];
    Undo u = makeMove(b, m);
    if (inCheck(b, us)) { unmakeMove(b, m, u); continue; }
    legalCount++;
    int score = -quiescence(b, -beta, -alpha, ply + 1, usePST, queenBonus, qDepthLeft - 1);
    unmakeMove(b, m, u);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  if (chk && legalCount == 0) return -(MATE_VALUE - ply);
  return best;
}

// ---------------- Main alpha-beta search ----------------
static uint64_t pathHash[300];

static int alphaBeta(Board& b, int depth, int alpha, int beta, int ply, bool usePST, bool queenBonus) {
  nodeCount++; checkTime();
  if (ply >= 100) { int e = evalStatic(b, usePST, queenBonus); return b.side == WHITE ? e : -e; }

  if (insufficientMaterial(b)) return 0;
  if (b.halfmoveClock >= 100) return 0;

  pathHash[ply] = b.hash;
  for (int pp = ply - 2; pp >= 0; pp -= 2) if (pathHash[pp] == b.hash) return 0;

  uint64_t key = b.hash;
  Move ttMove{};
  int ttScore = 0;
  TTEntry* tte = ttProbe(key, ply, ttScore);
  if (tte) {
    ttMove = Move{ tte->from, tte->to, tte->promo, 0 };
    if (tte->depth >= depth) {
      if (tte->bound == TT_EXACT) return ttScore;
      if (tte->bound == TT_LOWER && ttScore >= beta) return ttScore;
      if (tte->bound == TT_UPPER && ttScore <= alpha) return ttScore;
    }
  }

  int us = b.side;
  bool chk = inCheck(b, us);

  if (depth <= 0) return quiescence(b, alpha, beta, ply, usePST, queenBonus, 8);

  Move moves[256];
  int n = genLegal(b, moves);
  if (n == 0) return chk ? -(MATE_VALUE - ply) : 0;

  orderMoves(b, moves, n, ttMove, min(ply, 129));

  int best = -INF_SCORE;
  Move bestMove = moves[0];
  int bound = TT_UPPER;

  for (int i = 0; i < n; i++) {
    Move m = moves[i];
    Undo u = makeMove(b, m);
    int score = -alphaBeta(b, depth - 1, -beta, -alpha, ply + 1, usePST, queenBonus);
    unmakeMove(b, m, u);

    if (score > best) { best = score; bestMove = m; }
    if (best > alpha) { alpha = best; bound = TT_EXACT; }
    if (alpha >= beta) {
      bound = TT_LOWER;
      if (!(m.flags & MF_CAP) && !m.promo) {
        int kp = min(ply, 129);
        killers[kp][1] = killers[kp][0];
        killers[kp][0] = m;
        history[m.from][m.to] += depth * depth;
      }
      break;
    }
  }

  ttStore(key, depth, best, bound, bestMove, ply);
  return best;
}

// ---------------- Embedded Opening Book ----------------
static const unordered_map<string, vector<string>> BOOK_TABLE = {
  // 1. Initial position
  { "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w", { "e2e4", "d2d4", "c2c4", "g1f3" } },
  // After 1. e4
  { "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b", { "e7e5", "c7c5", "e7e6", "c7c6" } },
  // 1. e4 e5
  { "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w", { "g1f3", "b1c3", "f2f4" } },
  // 1. e4 e5 2. Nf3
  { "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b", { "b8c6", "g8f6" } },
  // 1. e4 e5 2. Nf3 Nc6
  { "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w", { "f1b5", "f1c4", "d2d4" } },
  // Ruy Lopez: 1. e4 e5 2. Nf3 Nc6 3. Bb5
  { "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b", { "a7a6", "g8f6" } },
  // Italian Game: 1. e4 e5 2. Nf3 Nc6 3. Bc4
  { "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b", { "f8c5", "g8f6" } },
  // Sicilian: 1. e4 c5
  { "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w", { "g1f3", "b1c3", "c2c3" } },
  // Sicilian: 1. e4 c5 2. Nf3
  { "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b", { "d7d6", "e7e6", "b8c6" } },
  // French: 1. e4 e6
  { "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w", { "d2d4" } },
  // French: 1. e4 e6 2. d4
  { "rnbqkbnr/pppp1ppp/4p3/8/3PP3/8/PPP2PPP/RNBQKBNR b", { "d7d5" } },
  // French: 1. e4 e6 2. d4 d5
  { "rnbqkbnr/pppp1ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w", { "b1c3", "e4e5", "b1d2" } },
  // Caro-Kann: 1. e4 c6
  { "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w", { "d2d4" } },
  // Caro-Kann: 1. e4 c6 2. d4
  { "rnbqkbnr/pp1ppppp/2p5/8/3PP3/8/PPP2PPP/RNBQKBNR b", { "d7d5" } },
  // Caro-Kann: 1. e4 c6 2. d4 d5
  { "rnbqkbnr/pp1ppppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w", { "b1c3", "e4e5" } },
  // 1. d4
  { "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b", { "d7d5", "g8f6" } },
  // 1. d4 d5
  { "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w", { "c2c4", "g1f3", "c2c3" } },
  // Queen's Gambit: 1. d4 d5 2. c4
  { "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b", { "e7e6", "c7c6", "d5c4" } },
  // 1. d4 Nf6
  { "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w", { "c2c4", "g1f3" } },
  // 1. c4
  { "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b", { "e7e5", "c7c5", "g8f6" } },
  // 1. Nf3
  { "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b", { "d7d5", "g8f6", "c7c5" } }
};

static Move parseMoveStr(const Board& b, const string& mstr) {
  if (mstr.size() < 4) return Move{};
  int from = parseSquare(mstr.substr(0, 2));
  int to = parseSquare(mstr.substr(2, 2));
  uint8_t promo = 0;
  if (mstr.size() >= 5) {
    switch (tolower(mstr[4])) {
      case 'n': promo = PT_N; break;
      case 'b': promo = PT_B; break;
      case 'r': promo = PT_R; break;
      case 'q': promo = PT_Q; break;
    }
  }
  Move legal[256];
  int n = genLegal(const_cast<Board&>(b), legal);
  for (int i = 0; i < n; i++) {
    if (legal[i].from == from && legal[i].to == to && legal[i].promo == promo) return legal[i];
  }
  return Move{};
}

static bool getBookMove(const Board& b, Move& outMove) {
  string key = getPositionFenKey(b);
  auto it = BOOK_TABLE.find(key);
  if (it == BOOK_TABLE.end() || it->second.empty()) return false;

  static mt19937 rng(0x12345678);
  const auto& choices = it->second;
  int idx = rng() % choices.size();
  Move m = parseMoveStr(b, choices[idx]);
  if (m.to != 64) {
    outMove = m;
    return true;
  }
  return false;
}

// ---------------- Root Search & Candidate Selection ----------------
struct SearchResult {
  Move best;
  int scoreCp;
  int completedDepth;
  long long nodes;
  long long timeMs;
  double ttHitRate;
  bool isBook;
  string errorCode;
};

struct RootCandidate {
  Move move;
  int score;
};

static SearchResult searchPosition(Board rootBoard, int targetDepth, int timeMs, double maxEvalLossCp,
                                   bool usePST, bool useBook, bool queenBonus) {
  searchStart = Clock::now();
  timeLimitMs = timeMs;
  nodeCount = 0; ttProbes = 0; ttHits = 0;

  // Clear Transposition Table and Heuristics for each new independent search to prevent cross-position TT pollution
  fill(TT.begin(), TT.end(), TTEntry{});
  memset(killers, 0, sizeof(killers));
  memset(history, 0, sizeof(history));

  if (targetDepth < 1) targetDepth = 1;
  if (targetDepth > 64) targetDepth = 64;

  // 1. Try Opening Book if enabled
  if (useBook) {
    Move bookMove;
    if (getBookMove(rootBoard, bookMove)) {
      return { bookMove, 0, 0, 0, 0, 0.0, true, "ok" };
    }
  }

  Move legal[256];
  int n = genLegal(rootBoard, legal);
  if (n == 0) {
    return { Move{}, 0, 0, 0, 0, 0.0, false, "no_legal_moves" };
  }

  int completedDepth = 0;
  vector<RootCandidate> lastCompletedScores;
  Move prevBestMove{};

  // Populate initial root candidates
  for (int i = 0; i < n; i++) {
    lastCompletedScores.push_back({ legal[i], 0 });
  }

  static mt19937 rng((unsigned)chrono::system_clock::now().time_since_epoch().count());

  // 2. Iterative Deepening from depth 1 to targetDepth
  for (int depth = 1; depth <= targetDepth; depth++) {
    Board b = rootBoard;
    Move moves[256]; int mn = n;
    memcpy(moves, legal, sizeof(Move) * n);
    orderMoves(b, moves, mn, prevBestMove, 0);

    vector<RootCandidate> currentDepthScores;
    bool iterationAborted = false;

    try {
      for (int i = 0; i < mn; i++) {
        Move m = moves[i];
        Undo u = makeMove(b, m);

        // Exact full-window search at root for all moves to get precise root candidate scores
        int score = -alphaBeta(b, depth - 1, -INF_SCORE, INF_SCORE, 1, usePST, queenBonus);
        unmakeMove(b, m, u);

        currentDepthScores.push_back({ m, score });
      }
    } catch (TimeUp&) {
      iterationAborted = true;
    }

    if (!iterationAborted && !currentDepthScores.empty()) {
      completedDepth = depth;
      lastCompletedScores = currentDepthScores;

      // Find best move of this completed iteration for next depth move ordering
      int bestIdxScore = -INF_SCORE;
      for (const auto& rc : lastCompletedScores) {
        if (rc.score > bestIdxScore) {
          bestIdxScore = rc.score;
          prevBestMove = rc.move;
        }
      }
    } else {
      break; // Abort further deepening if time ran out
    }
  }

  long long elapsed = chrono::duration_cast<chrono::milliseconds>(Clock::now() - searchStart).count();
  double hitRate = ttProbes > 0 ? (double)ttHits / (double)ttProbes : 0.0;

  if (lastCompletedScores.empty()) {
    return { legal[0], 0, completedDepth, nodeCount, elapsed, hitRate, false, "ok" };
  }

  // Sort candidates by score descending
  sort(lastCompletedScores.begin(), lastCompletedScores.end(), [](const RootCandidate& a, const RootCandidate& b) {
    return a.score > b.score;
  });

  int bestScore = lastCompletedScores[0].score;

  // 3. Skill-Based Candidate Selection (evalLoss <= maxEvalLoss)
  vector<RootCandidate> eligible;
  for (const auto& rc : lastCompletedScores) {
    double evalLoss = (double)(bestScore - rc.score);

    // Filter out moves beyond maxEvalLoss
    if (evalLoss > maxEvalLossCp) continue;

    // Tactical Safety Guard: Never pick a move that hangs checkmate or catastrophic blunder if best move is fine
    if (bestScore > -MATE_VALUE + 1000 && rc.score <= -MATE_VALUE + 1000) {
      continue;
    }
    if (bestScore >= -300 && rc.score < bestScore - 500) {
      continue;
    }

    eligible.push_back(rc);
  }

  if (eligible.empty()) {
    eligible.push_back(lastCompletedScores[0]);
  }

  Move chosenMove = eligible[0].move;
  int chosenScore = eligible[0].score;

  if (maxEvalLossCp > 10.0 && eligible.size() > 1) {
    // Weighted selection favoring better candidate moves
    vector<double> weights;
    double sumW = 0.0;
    for (const auto& cand : eligible) {
      double diff = (double)(bestScore - cand.score);
      double w = exp(-diff / (maxEvalLossCp + 1.0));
      weights.push_back(w);
      sumW += w;
    }
    double rVal = ((double)rng() / (double)rng.max()) * sumW;
    double accum = 0.0;
    for (size_t i = 0; i < eligible.size(); i++) {
      accum += weights[i];
      if (rVal <= accum) {
        chosenMove = eligible[i].move;
        chosenScore = eligible[i].score;
        break;
      }
    }
  }

  return { chosenMove, chosenScore, completedDepth, nodeCount, elapsed, hitRate, false, "ok" };
}

// ---------------- Command Loop ----------------
int main() {
  initZobrist();
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  string line;
  while (getline(cin, line)) {
    if (line.empty()) continue;
    istringstream iss(line);
    string cmd; iss >> cmd;
    if (cmd == "quit") {
      break;
    } else if (cmd == "newgame") {
      fill(TT.begin(), TT.end(), TTEntry{});
      memset(killers, 0, sizeof(killers));
      memset(history, 0, sizeof(history));
      cout << "ok" << endl;
    } else if (cmd == "perft") {
      string f1, f2, f3, f4, f5, f6;
      int depth = 1;
      iss >> f1 >> f2 >> f3 >> f4 >> f5 >> f6 >> depth;
      Board b; setFEN(b, f1, f2, f3, f4, f5, f6);
      uint64_t n = perft(b, depth);
      cout << "perft " << depth << " nodes " << n << endl;
    } else if (cmd == "search") {
      string f1, f2, f3, f4, f5, f6;
      int targetDepth = 5;
      long long timeMs = 1500;
      double maxEvalLoss = 0.0;
      int usePSTi = 1, useBooki = 1, queenBonusi = 0;

      iss >> f1 >> f2 >> f3 >> f4 >> f5 >> f6 >> targetDepth >> timeMs >> maxEvalLoss >> usePSTi >> useBooki >> queenBonusi;
      if (timeMs < 50) timeMs = 50;

      Board b; setFEN(b, f1, f2, f3, f4, f5, f6);

      SearchResult r = searchPosition(b, targetDepth, (int)timeMs, maxEvalLoss, usePSTi != 0, useBooki != 0, queenBonusi != 0);

      string promoStr = "-";
      if (r.best.promo) {
        switch (r.best.promo) {
          case PT_N: promoStr = "n"; break;
          case PT_B: promoStr = "b"; break;
          case PT_R: promoStr = "r"; break;
          case PT_Q: promoStr = "q"; break;
        }
      }
      string fromS = (r.best.to == 64) ? "-" : squareName(r.best.from);
      string toS = (r.best.to == 64) ? "-" : squareName(r.best.to);
      long long nps = r.timeMs > 0 ? (r.nodes * 1000 / r.timeMs) : r.nodes;

      cout << "bestmove " << fromS << " " << toS << " " << promoStr
           << " score " << r.scoreCp
           << " depth " << r.completedDepth
           << " nodes " << r.nodes
           << " timems " << r.timeMs
           << " nps " << nps
           << " isbook " << (r.isBook ? 1 : 0)
           << " err " << r.errorCode
           << endl;
    } else {
      cout << "bestmove - - - score 0 depth 0 nodes 0 timems 0 nps 0 isbook 0 err unknown_command" << endl;
    }
  }
  return 0;
}
