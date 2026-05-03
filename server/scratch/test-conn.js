const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.rdnllksxoaeokmkwdape:Ashpikachu%401641@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
  connectionTimeoutMillis: 5000,
});
client.connect()
  .then(() => {
    console.log('CONNECTED TO SUPABASE');
    client.end();
  })
  .catch(err => {
    console.error('FAILED:', err.message);
    process.exit(1);
  });
