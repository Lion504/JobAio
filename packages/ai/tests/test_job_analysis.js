/**
 * Comprehensive Test for Job Analysis AI Module
 *
 * Tests 6 analysis functions per job or all 7 functions with --self-test option
 */
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  analyzeJob,
  analyzeJobType,
  analyzeLanguage,
  analyzeExperienceLevel,
  analyzeEducationLevel,
  analyzeSkills,
  analyzeResponsibilities,
} from "../src/job_analysis.js";

// Load real job data from logs
async function loadJobData() {
  try {
    // Target specific file: jobs_jobly_20251121_213443.json
    const targetFile = "jobs_jobly_20251121_213443.json";
    const logsDir = path.join(__dirname, "../../../apps/scraper-py/logs");
    const targetFilePath = path.join(logsDir, targetFile);

    // Check if target file exists
    try {
      await fs.access(targetFilePath);
    } catch {
      console.error(`Target job file not found: ${targetFilePath}`);
      return [];
    }

    const content = await fs.readFile(targetFilePath, "utf-8");
    const jobs = JSON.parse(content);

    console.log(`✅ Loaded ${jobs.length} jobs from ${targetFile}`);
    return jobs;
  } catch (error) {
    console.error("Error loading job data:", error);
    return [];
  }
}

// Test individual analysis function
async function testFunction(functionName, description, jobTitle, company) {
  try {
    console.log(
      `\n--- Testing ${functionName} for: ${jobTitle} at ${company} ---`,
    );

    const result = await analyzeJob(functionName, description);

    console.log(`✓ ${functionName} result:`, JSON.stringify(result, null, 2));

    // Basic validation
    if (result.error) {
      console.warn(`⚠️ ${functionName} returned error: ${result.error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`✗ ${functionName} failed:`, error.message);
    return false;
  }
}

// Test all functions on a single job
async function testSingleJob(job, testLimit = 7) {
  const { title, company, description } = job;

  // Skip jobs with very short descriptions
  if (description.length < 100) {
    console.log(`\nSkipping ${title} - description too short`);
    return;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing Job: ${title}`);
  console.log(`Company: ${company}`);
  console.log(`Description length: ${description.length} characters`);
  console.log(`${"=".repeat(60)}`);

  // Test all 7 analysis functions
  const functions = [
    "job_type",
    "language",
    "experience_level",
    "education_level",
    "skills",
    "responsibilities",
  ];
  let successCount = 0;

  for (let i = 0; i < Math.min(functions.length, testLimit); i++) {
    const functionName = functions[i];
    const success = await testFunction(
      functionName,
      description,
      title,
      company,
    );
    if (success) successCount++;

    // Small delay between requests to be respectful to the API
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(
    `\nSuccess rate for ${title}: ${successCount}/${Math.min(functions.length, testLimit)}`,
  );
  return successCount === Math.min(functions.length, testLimit);
}

// Run comprehensive tests
async function runTests() {
  console.log("🚀 Starting Job Analysis AI Test Suite");
  console.log("Testing job_analysis.js with real job data");

  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not found in environment variables");
    console.log("Please set your Gemini API key to run the tests");
    console.log('Example: export GEMINI_API_KEY="your-api-key-here"');
    return;
  }

  // Load real job data
  const jobs = await loadJobData();

  if (jobs.length === 0) {
    console.error("❌ No job data loaded. Cannot proceed with tests.");
    return;
  }

  // Select diverse jobs for testing
  const testJobs = jobs
    .filter((job) => job.description && job.description.length > 200)
    .slice(0, 5); // Test first 5 suitable jobs

  console.log(`\nSelected ${testJobs.length} jobs for testing`);

  // Run tests
  let totalTests = 0;
  let successfulTests = 0;

  for (const job of testJobs) {
    const success = await testSingleJob(job, 6); // Test 6 analysis functions per job
    if (success) successfulTests++;
    totalTests++;

    // Delay between jobs
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 TEST SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Jobs tested: ${totalTests}`);
  console.log(`Successful jobs: ${successfulTests}`);
  console.log(
    `Success rate: ${Math.round((successfulTests / totalTests) * 100)}%`,
  );

  if (successfulTests === totalTests) {
    console.log(
      "✅ ALL TESTS PASSED - job_analysis.js is working correctly with Gemini AI!",
    );
  } else {
    console.log("⚠️ Some tests failed. Check the logs above for details.");
  }
}

// Self-test: Test all exported functions from job_analysis.js
async function testAllExports() {
  console.log("\n🧪 SELF-TEST: Testing all job_analysis.js functions\n");

  let passedTests = 0;
  let totalTests = 0;

  // Load real job data instead of using sample
  const jobs = await loadJobData();

  if (jobs.length === 0) {
    console.error("❌ No job data loaded. Cannot proceed with tests.");
    return;
  }

  // Use first suitable job
  const suitableJob = jobs.find(
    (job) => job.description && job.description.length > 200,
  );

  if (!suitableJob) {
    console.error("❌ No suitable job found for testing.");
    return;
  }

  const sampleDescription = suitableJob.description;

  console.log(`Using real job: ${suitableJob.title} at ${suitableJob.company}`);

  // Test 1: analyzeJobType
  console.log("Test 1: analyzeJobType()");
  try {
    totalTests++;
    const result = await analyzeJobType(sampleDescription);
    if (result && result.job_type) {
      console.log(`✅ analyzeJobType: ${result.job_type}`);
      passedTests++;
    } else {
      console.log("❌ analyzeJobType: Invalid response");
    }
  } catch (error) {
    console.log(`❌ analyzeJobType: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 2: analyzeLanguage
  console.log("\nTest 2: analyzeLanguage()");
  try {
    totalTests++;
    const result = await analyzeLanguage(sampleDescription);
    if (result && result.languages) {
      console.log(
        `✅ analyzeLanguage: ${result.languages.length} language(s) found`,
      );
      passedTests++;
    } else {
      console.log("❌ analyzeLanguage: Invalid response");
    }
  } catch (error) {
    console.log(`❌ analyzeLanguage: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 3: analyzeExperienceLevel
  console.log("\nTest 3: analyzeExperienceLevel()");
  try {
    totalTests++;
    const result = await analyzeExperienceLevel(sampleDescription);
    if (result && result.level) {
      console.log(`✅ analyzeExperienceLevel: ${result.level}`);
      passedTests++;
    } else {
      console.log("❌ analyzeExperienceLevel: Invalid response");
    }
  } catch (error) {
    console.log(`❌ analyzeExperienceLevel: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 4: analyzeEducationLevel
  console.log("\nTest 4: analyzeEducationLevel()");
  try {
    totalTests++;
    const result = await analyzeEducationLevel(sampleDescription);
    if (result && result.education_level) {
      console.log(`✅ analyzeEducationLevel: ${result.education_level}`);
      passedTests++;
    } else {
      console.log("❌ analyzeEducationLevel: Invalid response");
    }
  } catch (error) {
    console.log(`❌ analyzeEducationLevel: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 5: analyzeSkills
  console.log("\nTest 5: analyzeSkills()");
  try {
    totalTests++;
    const result = await analyzeSkills(sampleDescription);
    if (result && result.skills) {
      const totalSkills = Object.values(result.skills).flat().length;
      console.log(`✅ analyzeSkills: Found ${totalSkills} skills`);
      passedTests++;
    } else {
      console.log("❌ analyzeSkills: Invalid response");
    }
  } catch (error) {
    console.log(`❌ analyzeSkills: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 6: analyzeResponsibilities
  console.log("\nTest 6: analyzeResponsibilities()");
  try {
    totalTests++;
    const result = await analyzeResponsibilities(sampleDescription);
    if (result && Array.isArray(result.responsibilities)) {
      console.log(
        `✅ analyzeResponsibilities: Found ${result.responsibilities.length} responsibilities`,
      );
      passedTests++;
    } else {
      console.log("❌ analyzeResponsibilities: Invalid response");
    }
  } catch (error) {
    console.log(`❌ analyzeResponsibilities: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 7: analyzeJob (wrapper function)
  console.log("\nTest 7: analyzeJob() wrapper");
  try {
    totalTests++;
    const result = await analyzeJob("job_type", sampleDescription);
    if (result && result.job_type) {
      console.log(`✅ analyzeJob: Wrapper working (${result.job_type})`);
      passedTests++;
    } else {
      console.log("❌ analyzeJob: Invalid response");
    }
  } catch (error) {
    console.log(`❌ analyzeJob: ${error.message}`);
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 SELF-TEST SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Tests passed: ${passedTests}/${totalTests}`);
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log("✅ ALL 7 ANALYSIS FUNCTIONS ARE WORKING!");
  } else {
    console.log("⚠️ Some functions failed. Check details above.");
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
Usage: node test_job_analysis.js [options]

Options:
  (no args)     Run comprehensive tests on real job data
  --self-test   Test all 7 exported analysis functions
  --help        Show this help message
    `);
  } else {
    await runTests();
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main().catch(console.error);
}
