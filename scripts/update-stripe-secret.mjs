import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads a webhook signing secret from stdin and updates STRIPE_WEBHOOK_SECRET in .dev.vars
 * Usage: `stripe listen --print-secret | node scripts/update-stripe-secret.mjs`
 */
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString().trim();
  return raw;
}

function updateDevVars(secret) {
  const devVarsPath = path.resolve('.dev.vars');
  if (!fs.existsSync(devVarsPath)) {
    throw new Error('.dev.vars not found. Create it first.');
  }
  const content = fs.readFileSync(devVarsPath, 'utf8').split('\n');
  const key = 'STRIPE_WEBHOOK_SECRET=';
  const quoted = `"${secret}"`;
  let found = false;
  const updated = content.map((line) => {
    if (line.startsWith(key)) {
      found = true;
      return `${key}${quoted}`;
    }
    return line;
  });
  if (!found) {
    updated.push(`${key}${quoted}`);
  }
  fs.writeFileSync(devVarsPath, updated.join('\n'));
}

try {
  const secret = await readStdin();
  if (!secret || !secret.startsWith('whsec_')) {
    console.error('Invalid secret received. Expected value starting with "whsec_"');
    process.exit(1);
  }
  updateDevVars(secret);
  console.log('Updated .dev.vars with STRIPE_WEBHOOK_SECRET');
} catch (err) {
  console.error(err?.message || err);
  process.exit(1);
}