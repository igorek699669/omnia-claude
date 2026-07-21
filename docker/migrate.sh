#!/bin/sh
set -e

# Better Auth's CLI works fine — unaffected by the Payload/tsx bug below.
npx better-auth migrate -y

# `payload migrate` is broken by an upstream tsx ESM/CJS interop bug in Payload's own
# CLI loader (ERR_REQUIRE_ASYNC_MODULE / ERR_REQUIRE_ESM, payloadcms/payload#16378) —
# reproduces identically on Windows and in this Linux image, so it's not fixable from
# our config. Schema sync instead goes through Payload's dev-mode "push" (drizzle push),
# which only runs when NODE_ENV !== 'production' (see @payloadcms/db-postgres connect.js).
# `next start`/the standalone server hardcode NODE_ENV=production, so we boot briefly via
# `next dev` (which forces NODE_ENV=development) to trigger push once, then shut it down —
# the real production container is started separately afterwards.
PAYLOAD_CONFIG_PATH=payload/payload.config.ts npx next dev --port 4000 &
DEV_PID=$!

node -e "
const http = require('http');
const tryOnce = () => new Promise((resolve, reject) => {
  const req = http.get('http://localhost:4000/api/products?limit=1', (res) => {
    res.resume();
    if (res.statusCode === 200) resolve(); else reject(new Error('status ' + res.statusCode));
  });
  req.on('error', reject);
  req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')); });
});
(async () => {
  for (let i = 0; i < 120; i++) {
    try {
      await tryOnce();
      console.log('Schema pushed.');
      process.exit(0);
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.error('Timed out waiting for schema push.');
  process.exit(1);
})();
"

kill "$DEV_PID" 2>/dev/null || true
wait "$DEV_PID" 2>/dev/null || true
