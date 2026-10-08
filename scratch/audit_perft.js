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

async function runPerftAudit() {
  console.log('=================== PERFT AUDIT SUITE ===================\n');

  const suite = [
    {
      name: 'Position 1 (Initial Board)',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      expected: { 1: 20, 2: 400, 3: 8902, 4: 197281, 5: 4865609 }
    },
    {
      name: 'Position 2 (Kiwipete)',
      fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
      expected: { 1: 48, 2: 2039, 3: 97862, 4: 4085603 }
    },
    {
      name: 'Position 3 (Castling & EP)',
      fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
      expected: { 1: 14, 2: 191, 3: 2812, 4: 43238, 5: 674624 }
    },
    {
      name: 'Position 4 (Promotions & Checks)',
      fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
      expected: { 1: 6, 2: 264, 3: 9467, 4: 422333 }
    },
    {
      name: 'Position 5 (Alternative Position 5)',
      fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
      expected: { 1: 44, 2: 1486, 3: 62379, 4: 2103487 }
    }
  ];

  let allPass = true;

  for (const item of suite) {
    console.log(`--- ${item.name} ---`);
    for (const [dStr, expectedCount] of Object.entries(item.expected)) {
      const depth = Number(dStr);
      const res = await send(`perft ${item.fen} ${depth}`);
      const tok = res.trim().split(/\s+/);
      const actualCount = Number(tok[3]);
      const status = actualCount === expectedCount ? 'PASS' : `FAIL (Expected ${expectedCount}, got ${actualCount})`;
      if (actualCount !== expectedCount) allPass = false;
      console.log(`  Depth ${depth}: ${actualCount} | ${status}`);
    }
    console.log('');
  }

  await send('quit');
  proc.kill();

  console.log(`PERFT OVERALL STATUS: ${allPass ? 'ALL PASS' : 'SOME FAILURES'}`);
}

runPerftAudit().catch(console.error);
