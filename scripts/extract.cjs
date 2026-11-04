const fs = require('fs');
const transcript = fs.readFileSync('C:/Users/pc/.gemini/antigravity-cli/brain/ddff0503-8c5f-4e89-b885-1ffa03ad9ffd/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = transcript.split('\n');
for (const l of lines) {
  const idx = l.indexOf('function fenceRect');
  if (idx !== -1) {
    const segment = l.slice(idx, idx + 3500);
    fs.writeFileSync('scripts/extracted_code.txt', JSON.parse('"' + segment.replace(/"/g, '\\"') + '"'), 'utf8');
    console.log('Saved to scripts/extracted_code.txt');
    break;
  }
}
