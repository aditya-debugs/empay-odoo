// Hard-blocks `prisma migrate dev`.
// `migrate dev` resets the database when it detects drift. We intentionally use
// `prisma db push` for the dev DB, which adds columns non-destructively.
//
// If you ABSOLUTELY need to run migrate dev (you almost never do), invoke it
// directly with `npx prisma migrate dev` — but understand it WILL wipe data
// when drift is detected, and the team's shared dev DB will lose all users.
console.error('');
console.error('╔════════════════════════════════════════════════════════════════╗');
console.error('║  BLOCKED: `prisma migrate dev` is disabled in this project.    ║');
console.error('║                                                                ║');
console.error('║  Use `npm run db:push` instead. It adds columns non-destruc-   ║');
console.error('║  tively without touching existing rows.                        ║');
console.error('║                                                                ║');
console.error('║  Why blocked: migrate dev resets the DB on drift, which is the ║');
console.error('║  drift it always detects on a `db push`-managed schema. This   ║');
console.error('║  has wiped users 3+ times for this team already.               ║');
console.error('╚════════════════════════════════════════════════════════════════╝');
console.error('');
process.exit(1);
