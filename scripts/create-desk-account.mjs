/**
 * Make a studio desk account.
 *
 * The desk at `/admin` only signs people in — there is no sign-up on the site,
 * so nobody who finds the page can claim an address. Accounts are made here
 * instead, on a machine that already has the deployment's URL.
 *
 *   node scripts/create-desk-account.mjs            # the dev deployment
 *   node scripts/create-desk-account.mjs --prod     # the live site
 *   node scripts/create-desk-account.mjs --url https://….convex.cloud
 *
 * The address has to be listed in ADMIN_EMAILS on that deployment; anything
 * else is refused before a row is written. The password is typed at the prompt,
 * never passed as an argument, so it stays out of the shell history and out of
 * the process list.
 */
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

/** Must match convex/auth.ts. */
const MIN_PASSWORD = 10;

/** The project's production deployment; override with --url. */
const PRODUCTION = "https://tremendous-walrus-53.convex.cloud";

const args = process.argv.slice(2);

function deploymentUrl() {
  const flagged = args.indexOf("--url");
  if (flagged >= 0) return args[flagged + 1];
  if (args.includes("--prod")) return PRODUCTION;
  const envFile = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envFile)) {
    throw new Error("No .env.local here. Run `npx convex dev` first, or pass --prod / --url.");
  }
  const url = fs
    .readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .find((line) => line.startsWith("NEXT_PUBLIC_CONVEX_URL="))
    ?.split("=")[1]
    ?.trim()
    .replace(/^["']|["']$/g, "");
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not in .env.local.");
  return url;
}

// One reader for every prompt: opening a fresh one per question loses whatever
// the previous reader had already pulled out of stdin.
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let muted = false;
let asking = "";
rl._writeToOutput = (text) => {
  // While muted, only the prompt is written — so keystrokes leave no echo.
  if (!muted) rl.output.write(text);
  else if (text.includes(asking)) rl.output.write(asking);
};

// Lines are pulled from the reader one at a time. Asking with a callback drops
// whatever the reader had already buffered, which loses every prompt after the
// first unless the answers arrive one keystroke at a time.
const queue = rl[Symbol.asyncIterator]();

/** Read a line; with `hidden`, the keystrokes are not echoed. */
async function ask(question, hidden = false) {
  muted = hidden;
  asking = question;
  rl.setPrompt(question);
  rl.prompt();
  const { value } = await queue.next();
  if (hidden) rl.output.write("\n");
  muted = false;
  if (value === undefined) stop("\nNothing left to read — run this in a terminal.");
  return value.trim();
}

/** Every way out goes through here, so the terminal is never left muted. */
function stop(message, code = 1) {
  muted = false;
  rl.close();
  console.error(message);
  process.exit(code);
}

const url = deploymentUrl();
const live = url === PRODUCTION;
console.log(`\nStudio desk — new account on the ${live ? "LIVE" : "dev"} deployment`);
console.log(`${url}\n`);

const email = (await ask("Studio email: ")).toLowerCase();
if (!email.includes("@")) stop("\nThat is not an email address.");

const password = await ask("Password (not shown): ", true);
if (password.length < MIN_PASSWORD) stop(`\nUse at least ${MIN_PASSWORD} characters.`);

const again = await ask("Password again: ", true);
if (password !== again) stop("\nThe two passwords are not the same.");

const client = new ConvexHttpClient(url);
try {
  await client.action(anyApi.auth.signIn, {
    provider: "password",
    params: { email, password, flow: "signUp" },
  });
} catch (error) {
  const text = String(error?.data ?? error?.message ?? error);
  if (/already exists|InvalidAccountId/i.test(text)) {
    stop(
      `\n${email} already has an account. To reset it, delete its row in the authAccounts\n` +
        "table on the Convex dashboard, then run this again.",
    );
  }
  if (/does not have access|No studio accounts/i.test(text)) {
    stop(
      `\n${email} is not in ADMIN_EMAILS on this deployment, so it cannot have an account.\n` +
        `Add it with:  npx convex env set ADMIN_EMAILS "…"${live ? "   (add --prod)" : ""}`,
    );
  }
  stop(`\nThe account was not made: ${text}`);
}

rl.close();
console.log(`\n✔ ${email} can now sign in at /admin.\n`);
