const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/pc/.gemini/antigravity-cli/brain/ddff0503-8c5f-4e89-b885-1ffa03ad9ffd/.system_generated/logs/transcript_full.jsonl', 'utf8');

const target = 'function buildTown(info: MapInfo): Omit<MapData, \'info\'>';
let pos = 0;
while (true) {
  const idx = transcript.indexOf(target, pos);
  if (idx === -1) break;
  const endIdx = transcript.indexOf('function exitsOf', idx);
  if (endIdx !== -1) {
    const raw = transcript.slice(idx, endIdx);
    fs.writeFileSync('scripts/buildTown_full.txt', raw.replace(/\\n/g, '\n').replace(/\\"/g, '"'), 'utf8');
    console.log('Found buildTown full length:', raw.length);
    break;
  }
  pos = idx + target.length;
}
