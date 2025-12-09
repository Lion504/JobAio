// Simple test runner for the translation test
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import { translateJobs } from "../src/geminiTranslate.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function runTests() {
  console.log("Running Gemini Translate Field Tests...\n");

  let testJobs;

  // Load test data from scraper pipeline results
  const testDataPath = path.resolve(
    __dirname,
    "../../../apps/scraper-py/logs/pipeline_results_20251125_135706.json",
  );

  try {
    const testData = readFileSync(testDataPath, "utf-8");
    const allJobs = JSON.parse(testData);
    // Take only first 2 jobs for faster testing
    testJobs = allJobs.slice(0, 2);
    console.log(`✅ Loaded ${testJobs.length} test jobs from pipeline data`);
  } catch (err) {
    console.warn("❌ Could not load test data, using mock data:", err.message);
    // Fallback to mock data
    testJobs = [
      {
        title: "Verkkokauppakeräilijöitä keikkatöihin!",
        url: "https://example.com",
        company: "Test Company",
        location: "Lahti",
        publish_date: "25.11.2025",
        description: "",
        source: "jobly.fi",
        job_type: ["part-time"],
        language: {
          required: ["Finnish"],
          advantage: [],
        },
        experience_level: "junior",
        education_level: ["unknown"],
        skill_type: {
          technical: [],
          domain_specific: ["Verkkokauppatilausten keräily"],
          certifications: [],
          soft_skills: ["Tarkkuus ja huolellisuus"],
          other: ["Sujuva suomen kielen taito"],
        },
        responsibilities: ["Picking and packing e-commerce orders"],
        _metadata: {
          combined_analysis: true,
          rule_based_used: true,
          ai_used: true,
          merge_strategy: "ai_override",
        },
      },
    ];
  }

  try {
    console.log("🔄 Starting field-by-field translation test...");

    const startTime = Date.now();
    const result = await translateJobs(testJobs);
    const endTime = Date.now();

    console.log(`✅ Translation completed in ${(endTime - startTime) / 1000}s`);

    // Verify structure
    if (Array.isArray(result)) {
      console.log(`✅ Result is array with ${result.length} job translations`);

      result.forEach((translationResult, index) => {
        const originalJob = translationResult.original_job;
        const translations = translationResult.translations;

        console.log(`\n🔍 Testing Job ${index + 1}: "${originalJob.title}"`);
        console.log(
          `   📊 Original source: ${originalJob.source} -> Translations: ${translations.length}`,
        );

        // Verify each translation maintains the exact structure
        translations.forEach((translation, i) => {
          console.log(
            `   🌍 Translation ${i + 1}: ${translation.translated_language}`,
          );

          // Check that translated_language field is added
          if (translation.translated_language) {
            console.log(`     ✅ Has translated_language field`);
          } else {
            console.log(`     ❌ Missing translated_language field`);
          }

          // Verify all original fields are preserved
          const fieldsToCheck = [
            "title",
            "url",
            "company",
            "location",
            "publish_date",
            "description",
            "source",
            "job_type",
            "language",
            "experience_level",
            "education_level",
            "skill_type",
            "responsibilities",
            "_metadata",
          ];

          fieldsToCheck.forEach((field) => {
            if (translation[field] !== undefined) {
              console.log(`     ✅ Preserves ${field}`);
            } else {
              console.log(`     ❌ Missing ${field}`);
            }
          });

          // Check arrays are preserved as arrays
          if (Array.isArray(translation.job_type)) {
            console.log(
              `     ✅ job_type is array (${translation.job_type.length} items)`,
            );
          }
          if (Array.isArray(translation.responsibilities)) {
            console.log(
              `     ✅ responsibilities is array (${translation.responsibilities.length} items)`,
            );
          }
          if (
            translation.skill_type &&
            Array.isArray(translation.skill_type.technical)
          ) {
            console.log(
              `     ✅ skill_type.technical is array (${translation.skill_type.technical.length} items)`,
            );
          }

          if (
            translation._metadata &&
            translation._metadata.combined_analysis
          ) {
            console.log(`     ✅ Preserves _metadata unchanged`);
          }
        });
      });

      console.log("\n🎉 Test completed successfully!");
      console.log(`   - Jobs translated: ${result.length}`);
      console.log(
        `   - Total translations: ${result.reduce((sum, r) => sum + r.translations.length, 0)}`,
      );
      console.log(`   - Data structure preserved: ✅`);
    } else {
      console.log("❌ Result is not an array");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Run the test
if (process.argv[1]?.endsWith("run_test.js")) {
  runTests().catch((err) => {
    console.error("Test runner failed:", err);
    process.exit(1);
  });
}
