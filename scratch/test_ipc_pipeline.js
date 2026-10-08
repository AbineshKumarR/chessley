import { spawn } from 'child_process';
import readline from 'readline';

const engineProc = spawn('native/engine.exe', [], { stdio: ['pipe', 'pipe', 'inherit'] });
const engineRl = readline.createInterface({ input: engineProc.stdout });

let queue = [];
engineRl.on('line', (line) => {
  const req = queue.shift();
  if (req) req.resolve(line);
});

function sendEngineCommand(line) {
  return new Promise((resolve, reject) => {
    queue.push({ resolve, reject });
    engineProc.stdin.write(line + '\n');
  });
}

async function testEngineIPC(fen, config) {
  const parts = fen.trim().split(/\s+/);
  while (parts.length < 6) parts.push(parts.length === 4 ? "0" : parts.length === 5 ? "1" : "-");

  const targetDepth = config.targetDepth || 5;
  const timeMs = config.timeMs || 1500;
  const maxEvalLoss = config.maxEvalLoss !== undefined ? config.maxEvalLoss : 0.0;
  const usePST = config.usePST === false ? 0 : 1;
  const useBook = config.useBook === false ? 0 : 1;
  const queenBonus = config.queenBonus ? 1 : 0;

  const cmd = `search ${parts.slice(0, 6).join(" ")} ${targetDepth} ${Math.round(timeMs)} ${maxEvalLoss} ${usePST} ${useBook} ${queenBonus}`;

  console.log(`[IPC Request]  : ${cmd}`);
  const line = await sendEngineCommand(cmd);
  console.log(`[IPC Response] : ${line}`);

  const tok = line.trim().split(/\s+/);
  let resMap = {};
  for (let i = 0; i < tok.length; i += 2) {
    if (i + 1 < tok.length) {
      resMap[tok[i]] = tok[i + 1];
    }
  }

  const from = tok[1];
  const to = tok[2];
  const promo = tok[3] === "-" ? null : tok[3];
  const score = Number(resMap["score"] || 0);
  const depth = Number(resMap["depth"] || 0);
  const nodes = Number(resMap["nodes"] || 0);
  const elapsedMs = Number(resMap["timems"] || 0);
  const nps = Number(resMap["nps"] || 0);
  const isBook = resMap["isbook"] === "1";
  const err = resMap["err"] || "ok";

  return { from, to, promotion: promo, score, depth, nodes, timeMs: elapsedMs, nps, isBook, err };
}

async function runIPCTests() {
  console.log('=== IPC PIPELINE VERIFICATION FOR BOTS ===\n');

  const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const midGameFen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5';

  console.log('--- TEST 1: Martin (250 Elo: depth 5, maxEvalLoss 250, usePST false, useBook false) ---');
  const martinResult = await testEngineIPC(midGameFen, {
    targetDepth: 5,
    timeMs: 800,
    maxEvalLoss: 250,
    usePST: false,
    useBook: false
  });
  console.log('Martin Output Parsed:', martinResult, '\n');

  console.log('--- TEST 2: Nelson (1000 Elo: depth 5, maxEvalLoss 80, usePST true, useBook true, queenBonus true) ---');
  const nelsonResult = await testEngineIPC(startFen, {
    targetDepth: 5,
    timeMs: 1400,
    maxEvalLoss: 80,
    usePST: true,
    useBook: true,
    queenBonus: true
  });
  console.log('Nelson Output Parsed:', nelsonResult, '\n');

  console.log('--- TEST 3: Wojtek (1800 Elo: depth 5, maxEvalLoss 0, usePST true, useBook true) ---');
  const wojtekResult = await testEngineIPC(midGameFen, {
    targetDepth: 5,
    timeMs: 2000,
    maxEvalLoss: 0,
    usePST: true,
    useBook: true
  });
  console.log('Wojtek Output Parsed:', wojtekResult, '\n');

  await sendEngineCommand('quit');
  engineProc.kill();
  console.log('=== IPC PIPELINE VERIFICATION FINISHED ===');
}

runIPCTests().catch(console.error);
