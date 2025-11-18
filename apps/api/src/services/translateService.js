import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { translateJobs } from "../../../../packages/ai/src/translate.js"; // import translator

const SERVICE_DIR = path.dirname(fileURLToPath(import.meta.url)); // current folder path
const SEED_PATH = path.join(SERVICE_DIR, "..", "seedJobs.json"); // input jobs file
const OUT_PATH = path.join(SERVICE_DIR, "..", "translated_jobs.json"); // output file path

async function readSeedJobs() {
  const raw = await fs.readFile(SEED_PATH, "utf-8"); // read job seed file
  const jobs = JSON.parse(raw); // parse JSON data
  if (!Array.isArray(jobs)) throw new Error("seedJobs.json must be an array"); // validate format
  return jobs; // return job list
}

async function writeOutput(allTranslated) {
  const payload = {
    generated_at: new Date().toISOString(), // timestamp output
    count: allTranslated.length, // number of jobs translated
    jobs: allTranslated, // translated results
  };
  await fs.writeFile(OUT_PATH, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Wrote translations to ${OUT_PATH}`);
}

export async function runTranslation() {
  console.log("Starting translation run (Gemini)...");

  const jobs = await readSeedJobs();
  const allTranslated = await translateJobs(jobs); // translate job list
  await writeOutput(allTranslated); // save translated output

  let warnCount = 0; // track warnings
  for (const item of allTranslated) {
    for (const t of item.translations || []) {
      if (t?.warnings?.length) {
        warnCount += t.warnings.length; // count warnings
        console.warn(
          `Warning for job "${item.original_job.jobtitle}" -> ${t.translation_language}:`,
          t.warnings,
        ); // log warnings
      }
    }
    if (item.error)
      console.error(
        `Error for job "${item.original_job.jobtitle}":`,
        item.error,
      );
  }

  console.log(
    `Translation run complete. Jobs: ${allTranslated.length}. Warnings: ${warnCount}`,
  ); //
  return { jobs: allTranslated, warnings: warnCount };
}

// run script directly
if (process.argv[1]?.endsWith("translateService.js")) {
  runTranslation().catch((err) => {
    console.error("Translation run failed:", err); // log failure
    process.exit(1); // exit with error
  });
}
