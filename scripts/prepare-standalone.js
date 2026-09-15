// Next's standalone output (.next/standalone) doesn't include the static
// assets, public folder, or .env files by design — copy them in so the
// bundled server can serve the app on its own, with no other files from the
// repo needed. Without .env.local, the packaged server boots with no
// VISUAL_BRAIN_TOKEN/ANTHROPIC_API_KEY/etc. and every protected route 500s.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.error(
    "`.next/standalone` not found — run `next build` first (check next.config.ts has output: \"standalone\")."
  );
  process.exit(1);
}

fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), {
  recursive: true,
});
fs.cpSync(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static"),
  { recursive: true }
);

const envLocal = path.join(root, ".env.local");
if (fs.existsSync(envLocal)) {
  fs.cpSync(envLocal, path.join(standalone, ".env.local"));
} else {
  console.warn("No .env.local found at repo root — packaged app will boot with no env vars set.");
}

console.log("Copied public/, .next/static, and .env.local into .next/standalone");
