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

async function auditDifficulty() {
  console.log('=================== DIFFICULTY FILTERING AUDIT ===================\n');

  const fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5';

  const configs = [
    { name: 'Wojtek (maxEvalLoss 0)', maxLoss: 0 },
    { name: 'Antonio (maxEvalLoss 60)', maxLoss: 60 },
    { name: 'Oliver (maxEvalLoss 100)', maxLoss: 100 },
    { name: 'Martin (maxEvalLoss 250)', maxLoss: 250 }
  ];

  for (const c of configs) {
    console.log(`TEST: ${c.name}`);
    const resStr = await send(`search ${fen} 5 1500 ${c.maxLoss} 1 0 0`);
    console.log(`OUT : ${resStr}`);
    const tok = resStr.trim().split(/\s+/);
    let resMap = {};
    for (let i = 0; i < tok.length; i += 2) {
      if (i + 1 < tok.length) resMap[tok[i]] = tok[i + 1];
    }
    const move = `${tok[1]}${tok[2]}`;
    const score = Number(resMap['score'] || 0);
    const depth = Number(resMap['depth'] || 0);
    console.log(`  Selected Move: ${move} | Score: ${score}cp | Depth: ${depth}\n`);
  }

  await send('quit');
  proc.kill();
}

auditDifficulty().catch(console.error);
