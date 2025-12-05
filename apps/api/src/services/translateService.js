import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { translateJobs } from "../../../../packages/ai/src/geminiTranslate.js"; // import translator

const SERVICE_DIR = path.dirname(fileURLToPath(import.meta.url)); // current folder path
const ROOT_DIR = path.resolve(SERVICE_DIR, "../../../.."); // project root
const SCRAPER_LOGS_DIR = path.join(ROOT_DIR, "apps/scraper-py/logs");
const OUT_PATH = path.join(SERVICE_DIR, "..", "translated_jobs.json"); // output file path

// Get latest pipeline results file
const getLatestPipelineFile = async () => {
  try {
    const files = await fs.readdir(SCRAPER_LOGS_DIR);
    const pipelineFiles = files.filter(
      (f) => f.startsWith("pipeline_results_") && f.endsWith(".json"),
    );
    if (pipelineFiles.length > 0) {
      // Sort by timestamp and take latest
      const latest = pipelineFiles.sort().reverse()[0];
      return path.join(SCRAPER_LOGS_DIR, latest);
    }
  } catch (err) {
    console.warn("Could not find pipeline results, falling back to seed file");
  }
  // Fallback to original seed file
  return path.join(SERVICE_DIR, "..", "seedJobs2.json");
};

async function readJobs() {
  const inputPath = await getLatestPipelineFile(); // auto-detect latest pipeline file
  console.log(`Reading jobs from: ${inputPath}`);
  const raw = await fs.readFile(inputPath, "utf-8"); // read job data file
  const jobs = JSON.parse(raw); // parse JSON data
  if (!Array.isArray(jobs)) throw new Error("Jobs file must be an array"); // validate format
  console.log(`Loaded ${jobs.length} jobs for translation`);
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

  const jobs = await readJobs();
  const allTranslated = await translateJobs(jobs); // translate job list
  await writeOutput(allTranslated); // save translated output

  let warnCount = 0; // track warnings
  for (const item of allTranslated) {
    for (const t of item.translations || []) {
      if (t?.warnings?.length) {
        warnCount += t.warnings.length; // count warnings
        console.warn(
          `Warning for job "${item.original_job.title}" -> ${t.translation_language}:`,
          t.warnings,
        ); // log warnings
      }
    }
    if (item.error)
      console.error(`Error for job "${item.original_job.title}":`, item.error);
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
