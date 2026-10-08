import { spawn } from 'child_process';
import readline from 'readline';

const proc = spawn('native/engine.exe', [], { stdio: ['pipe', 'pipe', 'inherit'] });
const rl = readline.createInterface({ input: proc.stdout });

let queue = [];
rl.on('line', (line) => {
  const req = queue.shift();
  if (req) req.resolve(line);
});

function send(cmd) {
  return new Promise((resolve, reject) => {
    queue.push({ resolve, reject });
    proc.stdin.write(cmd + '\n');
  });
}

async function auditMates() {
  console.log('=================== MATE VALIDATION SUITE ===================\n');

  const tests = [
    {
      name: 'Mate-in-1 (Scholar Mate)',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
      depth: 5,
      expectedMove: 'h5f7',
      expectedScore: 999999 // MATE_VALUE - 1
    },
    {
      name: 'Mate-in-2 (Légal Trap Mate)',
      fen: 'r2qkb1r/pp2nppp/3p4/2pNN3/2B1P3/8/PPPP1PPP/R1BbK2R w KQkq - 0 1',
      depth: 5,
      expectedMove: 'd5f6', // 1. Nf6+ gxf6 2. Bxf7#
      expectedScore: 999997 // MATE_VALUE - 3
    },
    {
      name: 'Mate-in-3 (Rook Back-Rank Mate)',
      fen: 'k7/8/1K6/8/8/8/8/1R6 w - - 0 1',
      depth: 5,
      expectedMove: 'b1a1', // 1. Ra1+ Kb8 2. Rh1 Ka8 3. Rh8#
      expectedScore: 999995 // MATE_VALUE - 5
    }
  ];

  for (const t of tests) {
    console.log(`TEST: ${t.name}`);
    console.log(`FEN : ${t.fen}`);
    const resStr = await send(`search ${t.fen} ${t.depth} 2000 0.0 1 0 0`);
    console.log(`OUT : ${resStr}`);

    const tok = resStr.trim().split(/\s+/);
    let resMap = {};
    for (let i = 0; i < tok.length; i += 2) {
      if (i + 1 < tok.length) resMap[tok[i]] = tok[i + 1];
    }

    const move = `${tok[1]}${tok[2]}`;
    const score = Number(resMap['score'] || 0);
    const depth = Number(resMap['depth'] || 0);

    const moveOk = move === t.expectedMove;
    const scoreOk = score >= 999900; // Mate score range

    console.log(`  Engine Move   : ${move} (Expected ${t.expectedMove}) -> ${moveOk ? 'PASS' : 'FAIL'}`);
    console.log(`  Engine Score  : ${score} (Expected ~${t.expectedScore}) -> ${scoreOk ? 'PASS' : 'FAIL'}`);
    console.log(`  Search Depth  : ${depth}\n`);
  }

  await send('quit');
  proc.kill();
}

auditMates().catch(console.error);
