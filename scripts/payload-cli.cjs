const path = require("node:path");
const { pathToFileURL } = require("node:url");

process.env.PAYLOAD_CONFIG_PATH = path.resolve(
  __dirname,
  "..",
  "src",
  "payload.config.ts",
);

(async () => {
  const payloadBinUrl = pathToFileURL(
    path.resolve(__dirname, "..", "node_modules", "payload", "dist", "bin", "index.js"),
  ).href;
  const { bin } = await import(payloadBinUrl);
  await bin();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
