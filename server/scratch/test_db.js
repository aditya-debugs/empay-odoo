const { Client } = require('pg');

const variants = [
  { name: 'Original', url: 'postgresql://postgres:Sukhbir@2003@localhost:5432/postgres' },
  { name: 'Encoded', url: 'postgresql://postgres:Sukhbir%402003@localhost:5432/postgres' },
  { name: 'No Password', url: 'postgresql://postgres@localhost:5432/postgres' },
  { name: 'Sukhbir User', url: 'postgresql://Sukhbir@localhost:5432/postgres' },
];

async function test() {
  for (const v of variants) {
    console.log(`Testing ${v.name}...`);
    const client = new Client({ connectionString: v.url });
    try {
      await client.connect();
      console.log(`✅ Success with ${v.name}!`);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
  console.log('All variants failed.');
}

test();
