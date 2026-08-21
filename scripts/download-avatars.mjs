import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVATAR_BASE_URL = 'https://api.dicebear.com/10.x/avataaars/svg?eyesVariant=closed,default,eyeRoll,happy,side,squint,surprised,wink,winkWacky,xDizzy&mouthVariant=concerned,default,eating,grimace,serious,smile,tongue,twinkle&eyebrowsVariant=default,defaultNatural,flatNatural,raisedExcited,raisedExcitedNatural,unibrowNatural,upDown,upDownNatural&seed=';

const TARGET_DIR = path.resolve(__dirname, '../public/avatars');

const BOTS_MAP = {
  martin: 'Martin',
  wayne: 'Wayne',
  mina: 'Mina',
  elena: 'Elena',
  oliver: 'Oliver',
  nelson: 'Nelson',
  devi: 'Devi',
  antonio: 'Antonio',
  zara: 'Zara',
  isabel: 'Isabel',
  mateo: 'Mateo',
  li: 'Li',
  sven: 'Sven',
  wojtek: 'Wojtek',
  player: 'Felix'
};

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function downloadSvg(key, seed) {
  return new Promise((resolve, reject) => {
    const url = `${AVATAR_BASE_URL}${seed}`;
    const filePath = path.join(TARGET_DIR, `${key}.svg`);

    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          let data = '';
          redirectRes.on('data', chunk => data += chunk);
          redirectRes.on('end', () => {
            fs.writeFileSync(filePath, data, 'utf-8');
            console.log(`✓ Downloaded ${key}.svg (${data.length} bytes)`);
            resolve();
          });
        }).on('error', reject);
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(filePath, data, 'utf-8');
        console.log(`✓ Downloaded ${key}.svg (${data.length} bytes)`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log(`Downloading avatars to ${TARGET_DIR}...`);
  for (const [key, seed] of Object.entries(BOTS_MAP)) {
    try {
      await downloadSvg(key, seed);
    } catch (err) {
      console.error(`Failed to download ${key}:`, err);
    }
  }
  console.log('All avatar SVGs downloaded successfully!');
}

main();
