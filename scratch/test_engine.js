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

async function runTests() {
  console.log('--- TESTING BLACK MATE IN 1 ---');
  const cmd = 'search r5k1/5ppp/8/8/8/6q1/6PP/7K b - - 0 1 5 1500 0.0 1 0 0';
  console.log(`CMD : ${cmd}`);
  const res = await send(cmd);
  console.log(`RES : ${res}\n`);

  await send('quit');
  proc.kill();
}

runTests().catch(console.error);
