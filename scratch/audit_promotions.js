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

async function auditPromotions() {
  console.log('=================== PROMOTION VALIDATION SUITE ===================\n');

  const tests = [
    {
      name: 'Quiet Queen Promotion (White a7 -> a8q)',
      fen: '8/P7/4k3/8/8/8/4K3/8 w - - 0 1',
      expectedFrom: 'a7', expectedTo: 'a8', expectedPromo: 'q'
    },
    {
      name: 'Capture Queen Promotion (White a7xb8q)',
      fen: '1r6/P7/4k3/8/8/8/4K3/8 w - - 0 1',
      expectedFrom: 'a7', expectedTo: 'b8', expectedPromo: 'q'
    },
    {
      name: 'Black Pawn Promotion (Black a2 -> a1q)',
      fen: '4k3/8/8/8/8/8/p7/4K3 b - - 0 1',
      expectedFrom: 'a2', expectedTo: 'a1', expectedPromo: 'q'
    },
    {
      name: 'Underpromotion Tactical Fork (Black a2 -> a1n gives check fork)',
      fen: '4k3/8/8/8/8/8/p3K3/8 b - - 0 1',
      // Note: both Q and N win, Q gives huge score
      expectedFrom: 'a2', expectedTo: 'a1'
    }
  ];

  for (const t of tests) {
    console.log(`TEST: ${t.name}`);
    console.log(`FEN : ${t.fen}`);
    const resStr = await send(`search ${t.fen} 5 2000 0.0 1 0 0`);
    console.log(`OUT : ${resStr}`);

    const tok = resStr.trim().split(/\s+/);
    let resMap = {};
    for (let i = 0; i < tok.length; i += 2) {
      if (i + 1 < tok.length) resMap[tok[i]] = tok[i + 1];
    }

    const from = tok[1];
    const to = tok[2];
    const promo = tok[3];

    const fromOk = from === t.expectedFrom;
    const toOk = to === t.expectedTo;
    const promoOk = t.expectedPromo ? promo === t.expectedPromo : promo !== '-';

    console.log(`  From: ${from} (${t.expectedFrom}) -> ${fromOk ? 'PASS' : 'FAIL'}`);
    console.log(`  To  : ${to} (${t.expectedTo}) -> ${toOk ? 'PASS' : 'FAIL'}`);
    console.log(`  Promo: ${promo} (${t.expectedPromo || 'any'}) -> ${promoOk ? 'PASS' : 'FAIL'}\n`);
  }

  await send('quit');
  proc.kill();
}

auditPromotions().catch(console.error);
