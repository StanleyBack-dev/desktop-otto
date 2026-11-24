// Downloads the offline speech models used to hear "Otto" (not committed:
// ~105 MB). From the official sherpa-onnx releases, checked by SHA-256.
// Run with `npm run models`; `npm run dev` and `npm run dist` run it first.
//   - silero_vad.onnx: detects when someone is speaking;
//   - Whisper tiny (int8): transcribes short phrases locally, to find the
//     assistant's name. Nothing leaves the PC until the name is heard.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const RELEASE =
  "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models";
const DIR = join("resources", "models");

const FILES = [
  {
    name: "silero_vad.onnx",
    url: `${RELEASE}/silero_vad.onnx`,
    sha256: "9e2449e1087496d8d4caba907f23e0bd3f78d91fa552479bb9c23ac09cbb1fd6",
  },
  {
    name: "tiny-encoder.int8.onnx",
    archive: "whisper",
    sha256: "d24fb083ae3b1041fc24e97971d60e280c9342201fbb67b0ab428a8b4a51a434",
  },
  {
    name: "tiny-decoder.int8.onnx",
    archive: "whisper",
    sha256: "d2fece8dd42771f1df975c6c0445770d0c292bf7547c2cae04a6c0cc57540925",
  },
  {
    name: "tiny-tokens.txt",
    archive: "whisper",
    sha256: "b34b360dbb493e781e479794586d661700670d65564001f23024971d1f2fa126",
  },
];
const WHISPER = {
  url: `${RELEASE}/sherpa-onnx-whisper-tiny.tar.bz2`,
  folder: "sherpa-onnx-whisper-tiny",
};

const sha256 = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
const ok = (file) =>
  existsSync(join(DIR, file.name)) &&
  sha256(join(DIR, file.name)) === file.sha256;

async function download(url, to) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  writeFileSync(to, Buffer.from(await response.arrayBuffer()));
}

mkdirSync(DIR, { recursive: true });
const missing = FILES.filter((file) => !ok(file));
if (missing.length === 0) {
  console.log("Speech models already present.");
  process.exit(0);
}

for (const file of missing.filter((f) => f.url)) {
  console.log(`Downloading ${file.name}…`);
  await download(file.url, join(DIR, file.name));
}
if (missing.some((file) => file.archive === "whisper")) {
  const archive = join(DIR, "whisper.tar.bz2");
  console.log("Downloading Whisper tiny (~116 MB)…");
  await download(WHISPER.url, archive);
  const names = FILES.filter((f) => f.archive === "whisper").map(
    (f) => `${WHISPER.folder}/${f.name}`,
  );
  const tar = spawnSync("tar", ["-xjf", archive, "-C", DIR, ...names], {
    stdio: "inherit",
  });
  if (tar.status !== 0)
    throw new Error("Could not extract the Whisper archive (tar).");
  for (const name of names)
    renameSync(join(DIR, name), join(DIR, name.split("/")[1]));
  rmSync(join(DIR, WHISPER.folder), { recursive: true, force: true });
  rmSync(archive, { force: true });
}

const bad = FILES.filter((file) => !ok(file));
if (bad.length > 0) {
  for (const file of bad) rmSync(join(DIR, file.name), { force: true });
  throw new Error(`Checksum mismatch: ${bad.map((f) => f.name).join(", ")}`);
}
console.log(`Speech models ready in ${DIR}.`);
