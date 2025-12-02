// test-search.js

// 1. Configuration (Make sure this matches your running server port!)
const API_URL = "http://localhost:3000/api/jobs/search";
const SEARCH_TERM = "hoitaja"; // Try terms like "Java", "Nurse", "Chef"

async function testSearch() {
  console.log(`🔎 Searching for: "${SEARCH_TERM}"...`);

  try {
    // 2. Send the request
    const response = await fetch(`${API_URL}?term=${SEARCH_TERM}`);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const jobs = await response.json();

    console.log(`✅ Found ${jobs.length} jobs.\n`);
    console.log("--- TOP RESULTS (Ranked by Score) ---");

    // 3. Display results to verify ranking
    jobs.slice(0, 5).forEach((job, index) => {
      console.log(`#${index + 1}: ${job.title}`);
      console.log(`    Score: ${job.score}`); // This proves the aggregation works!
      console.log(`    Posted: ${job.createdAt}`);
      console.log("-------------------------------------");
    });
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
    console.error("Hint: Is your server running?");
  }
}

testSearch();
