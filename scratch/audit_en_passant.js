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

async function auditEnPassant() {
  console.log('=================== EN-PASSANT VALIDATION SUITE ===================\n');

  const tests = [
    {
      name: 'Tactical En-passant Capture (White e5xd6 e.p. wins pawn)',
      fen: '6k1/8/8/3pP3/8/8/1B6/6K1 w - d6 0 1',
      expectedFrom: 'e5', expectedTo: 'd6'
    },
    {
      name: 'Tactical En-passant Capture of Rook (Black c4xd3 e.p. captures Rook!)',
      fen: '3r2k1/1b6/8/8/2pP4/8/8/3R2K1 b - d3 0 1',
      expectedFrom: 'c4', expectedTo: 'd3'
    }
  ];

  for (const t of tests) {
    console.log(`TEST: ${t.name}`);
    console.log(`FEN : ${t.fen}`);
    const resStr = await send(`search ${t.fen} 5 2000 0.0 1 0 0`);
    console.log(`OUT : ${resStr}`);

    const tok = resStr.trim().split(/\s+/);
    const from = tok[1];
    const to = tok[2];

    const fromOk = from === t.expectedFrom;
    const toOk = to === t.expectedTo;

    console.log(`  From: ${from} (${t.expectedFrom}) -> ${fromOk ? 'PASS' : 'FAIL'}`);
    console.log(`  To  : ${to} (${t.expectedTo}) -> ${toOk ? 'PASS' : 'FAIL'}\n`);
  }

  await send('quit');
  proc.kill();
}

auditEnPassant().catch(console.error);
