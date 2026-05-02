// Explicit, double-gated DB reset. Wipes the public schema and re-applies
// the Prisma schema. ONLY use this if you genuinely need a clean slate
// AND you've coordinated with the team.
//
// Requires both:
//   1. CONFIRM_RESET=YES env var
//   2. Typing "RESET" into the prompt
const readline = require('readline');
const { spawnSync } = require('child_process');

if (process.env.CONFIRM_RESET !== 'YES') {
  console.error('');
  console.error('Refusing to reset.');
  console.error('To proceed: CONFIRM_RESET=YES npm run db:reset:DANGER');
  console.error('You will then be prompted to type RESET to actually run it.');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('\n⚠  This wipes ALL data in the shared Neon DB. Type RESET to continue: ', (ans) => {
  rl.close();
  if (ans.trim() !== 'RESET') {
    console.error('Aborted.');
    process.exit(1);
  }
  console.log('Running prisma db push --force-reset --accept-data-loss…');
  const r = spawnSync('npx', ['prisma', 'db', 'push', '--force-reset', '--accept-data-loss'], {
    stdio: 'inherit', shell: true,
  });
  process.exit(r.status || 0);
});
