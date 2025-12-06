// test-search.js

// 1. Configuration (Matches default API port and route)
const API_URL = "http://localhost:5001/api/jobs";
//const SEARCH_TERM = "IT service development"; 
const SEARCH_TERM = "Helsinki"; 

async function testSearch() {
  console.log(`🔎 Searching for: "${SEARCH_TERM}"...`);

  try {
    // 2. Send the request
    // API uses 'search' query param for general text search
    const response = await fetch(`${API_URL}?search=${SEARCH_TERM}`);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();

    // 3. Handle response format { count, jobs, source, search }
    const jobs = data.jobs || [];

    console.log(`✅ Found ${jobs.length} jobs (Source: ${data.source}).\n`);
    console.log("--- TOP RESULTS (Ranked by Score) ---");

    // 4. Display results to verify ranking
    jobs.slice(0, 5).forEach((job, index) => {
      console.log(`#${index + 1}: ${job.title}`);
      // Score might not be present in all response types, check if it exists
      if (job.score !== undefined) {
        console.log(`    Score: ${job.score}`);
      }
      console.log(`    Company: ${job.company}`);
      console.log(`    Location: ${job.location}`);
      console.log("-------------------------------------");
    });
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
    if (error.cause) console.error("Cause:", error.cause);
    console.error("Hint: Is your server running on port 5001?");
  }
}

testSearch();
