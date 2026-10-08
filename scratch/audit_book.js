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

async function auditOpeningBook() {
  console.log('=================== OPENING BOOK AUDIT SUITE ===================\n');

  const lines = [
    { name: '1. Initial Position (useBook=1)', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', useBook: 1 },
    { name: '2. Initial Position (useBook=0)', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', useBook: 0 },
    { name: '3. Sicilian Response (1. e4 c5)', fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', useBook: 1 },
    { name: '4. French Response (1. e4 e6)', fen: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', useBook: 1 },
    { name: '5. Caro-Kann Response (1. e4 c6)', fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', useBook: 1 },
    { name: '6. Ruy Lopez Response (3. Bb5 a6)', fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1', useBook: 1 },
    { name: '7. Italian Game Response (3. Bc4 Bc5/Nf6)', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1', useBook: 1 },
    { name: '8. Queen\'s Gambit (1. d4 d5 2. c4)', fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 1', useBook: 1 },
    { name: '9. English Opening (1. c4)', fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1', useBook: 1 },
    { name: '10. Réti Opening (1. Nf3)', fen: 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 0 1', useBook: 1 }
  ];

  for (const item of lines) {
    console.log(`TEST: ${item.name}`);
    const resStr = await send(`search ${item.fen} 5 1500 0.0 1 ${item.useBook} 0`);
    console.log(`OUT : ${resStr}`);
    const tok = resStr.trim().split(/\s+/);
    let resMap = {};
    for (let i = 0; i < tok.length; i += 2) {
      if (i + 1 < tok.length) resMap[tok[i]] = tok[i + 1];
    }
    const move = `${tok[1]}${tok[2]}`;
    const isBook = resMap['isbook'] === '1';
    console.log(`  Move: ${move} | Book Used: ${isBook}\n`);
  }

  await send('quit');
  proc.kill();
}

auditOpeningBook().catch(console.error);
