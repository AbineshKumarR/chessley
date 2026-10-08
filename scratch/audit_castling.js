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

async function auditCastling() {
  console.log('=================== CASTLING VALIDATION SUITE ===================\n');

  const tests = [
    {
      name: 'White Kingside/Queenside Castling Option (White e1g1 or e1c1)',
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      allowedMoves: ['e1g1', 'e1c1']
    },
    {
      name: 'Black Kingside/Queenside Castling Option (Black e8g8 or e8c8)',
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1',
      allowedMoves: ['e8g8', 'e8c8']
    },
    {
      name: 'Rejection of Castling when King is in check (White King checked by Black Rook on e8)',
      fen: '4r3/8/8/8/8/8/8/R3K2R w KQ - 0 1',
      rejectedMove: 'e1g1'
    },
    {
      name: 'Rejection of Castling when King crosses attacked square (f1 attacked by Black Rook on f8)',
      fen: '5r2/8/8/8/8/8/8/R3K2R w KQ - 0 1',
      rejectedMove: 'e1g1'
    },
    {
      name: 'Rejection of Castling when destination square is attacked (g1 attacked by Black Rook on g8)',
      fen: '6r1/8/8/8/8/8/8/R3K2R w KQ - 0 1',
      rejectedMove: 'e1g1'
    }
  ];

  for (const t of tests) {
    console.log(`TEST: ${t.name}`);
    console.log(`FEN : ${t.fen}`);
    const resStr = await send(`search ${t.fen} 5 2000 0.0 1 0 0`);
    console.log(`OUT : ${resStr}`);

    const tok = resStr.trim().split(/\s+/);
    const move = `${tok[1]}${tok[2]}`;

    if (t.allowedMoves) {
      const isAllowed = t.allowedMoves.includes(move);
      console.log(`  Actual Move: ${move} (Allowed: ${t.allowedMoves.join(', ')}) -> ${isAllowed ? 'PASS' : 'FAIL'}\n`);
    } else if (t.rejectedMove) {
      const rejectedOk = move !== t.rejectedMove;
      console.log(`  Rejected Move: ${t.rejectedMove} | Actual: ${move} -> ${rejectedOk ? 'PASS' : 'FAIL'}\n`);
    }
  }

  await send('quit');
  proc.kill();
}

auditCastling().catch(console.error);
