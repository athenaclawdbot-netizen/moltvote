const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'moltvote.db'));

const markets = db.prepare('SELECT * FROM markets WHERE is_active = 1 ORDER BY is_hot DESC, created_at DESC').all();

fs.writeFileSync(
  path.join(__dirname, '..', 'frontend', 'public', 'data', 'markets.json'),
  JSON.stringify(markets, null, 2)
);

console.log(`Exported ${markets.length} markets to JSON`);
