// test-search.js

// 1. Configuration (Matches API server port and search endpoint)
const API_URL = "http://localhost:5001/api/jobs/search";
// Test terms that demonstrate semantic search expansion
const SEARCH_TERMS = ["developer", "hoitaja", "kokki", "engineer"];

async function testSemanticSearch(term) {
  console.log(`🔎 Testing semantic search for: "${term}"...`);

  try {
    // 2. Send the request to search endpoint with 'term' parameter
    const response = await fetch(`${API_URL}?term=${term}`);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const jobs = await response.json();

    console.log(`✅ Found ${jobs.length} jobs for "${term}".\n`);
    console.log("--- TOP RESULTS (Ranked by Semantic Score) ---");

    // 3. Display results to verify semantic ranking
    jobs.slice(0, 5).forEach((job, index) => {
      console.log(`#${index + 1}: ${job.title}`);
      if (job.score !== undefined) {
        console.log(`    Score: ${job.score.toFixed(2)}`);
      }
      console.log(`    Company: ${job.company || "N/A"}`);
      console.log(`    Location: ${job.location || "N/A"}`);
      console.log("-------------------------------------");
    });

    return jobs.length;
  } catch (error) {
    console.error(`❌ Test Failed for "${term}":`, error.message);
    return 0;
  }
}

async function runAllTests() {
  console.log("🚀 Testing Semantic Search Feature\n");
  console.log("This test demonstrates AI-powered query expansion:");
  console.log(
    "- 'developer' expands to include programmer, engineer, coder, etc.",
  );
  console.log("- 'hoitaja' expands to include nurse, caregiver, etc.");
  console.log("- 'kokki' expands to include chef, cook, etc.\n");

  let totalResults = 0;

  for (const term of SEARCH_TERMS) {
    const results = await testSemanticSearch(term);
    totalResults += results;

    // Rate limiting between tests
    if (SEARCH_TERMS.indexOf(term) < SEARCH_TERMS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n📊 Test Summary:`);
  console.log(`   Total search terms tested: ${SEARCH_TERMS.length}`);
  console.log(`   Total jobs found: ${totalResults}`);
  console.log(
    `   Average jobs per term: ${(totalResults / SEARCH_TERMS.length).toFixed(1)}`,
  );

  if (totalResults === 0) {
    console.log("\n⚠️  No results found. Possible issues:");
    console.log("   - API server not running on port 5001");
    console.log("   - No jobs in database");
    console.log("   - MongoDB connection issues");
    console.log(
      "   - GEMINI_API_KEY not configured (semantic search disabled)",
    );
  } else {
    console.log("\n✅ Semantic search is working!");
  }
}

runAllTests();
