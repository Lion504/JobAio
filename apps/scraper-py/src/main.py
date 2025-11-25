"""Job scraping and analysis pipeline: jobly scraper → hybrid analyzer → logs"""

import json
import random  # For delay calculations
import sys
import time
from pathlib import Path

# Add paths to allow importing jobly and job_analyzer
project_root = Path(__file__).parent  # apps/scraper-py/src
jobly_path = project_root / "jobly"
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
if str(project_root.parent) not in sys.path:
    sys.path.insert(0, str(project_root.parent))
if str(jobly_path) not in sys.path:
    sys.path.insert(0, str(jobly_path))

# Import components AFTER sys.path is updated
import jobly_extractor  # noqa: E402
import jobly_scraper  # noqa: E402

from job_analyzer.hybrid_job_analyzer import HybridJobAnalyzer  # noqa: E402


def main():
    """Full pipeline: scrape jobs → analyze → save to logs"""
    print("\n" + "=" * 70)
    print("🚀 JOB SCRAPER & ANALYZER PIPELINE")
    print(
        "🕷️ Step 1: Scrape jobs  →  🔬 Step 2: Analyze jobs  →  💾 Step 3: Save results"
    )
    print("=" * 70)

    # Step 1: Scrape jobs from jobly.fi
    print("\n🕷️ [1/3] Scraping jobs from jobly.fi...")
    try:
        # Create JoblyExtractor and modify to return jobs instead of saving
        scraper = jobly_scraper.JoblyScraper()
        extractor = jobly_extractor.JoblyExtractor(scraper)

        # Use a temporary output file for scraping
        temp_output = None  # None means save to default logs location

        # Reset extractor's job list
        extractor.jobs = []

        # Import the scraping variables/values from jobly_cli
        BASE_URL = "https://www.jobly.fi/en/jobs"
        MAX_PAGES = 1  # Quick test mode
        DELAY = random.uniform(1, 3) if hasattr(random, "uniform") else 1.5

        # Scrape jobs
        max_pages = MAX_PAGES if MAX_PAGES is not None else float("inf")
        page_num = 0

        while page_num < max_pages:
            job_url = BASE_URL if page_num == 0 else f"{BASE_URL}?page={page_num}"
            print(f"Scraping page {page_num + 1}...")

            try:
                job_cards = scraper.scrape_jobs_list(job_url)
                if not job_cards and page_num > 0:
                    print("No more job postings found.")
                    break

                print(f"Found {len(job_cards)} job postings.")
                for job_card in job_cards:
                    job_data = extractor.extract_job_data(job_card)
                    if (
                        job_data
                        and job_data.get("title")
                        and job_data["title"] != "N/A"
                    ):
                        extractor.jobs.append(job_data)

                page_num += 1
                if DELAY > 0:

                    time.sleep(DELAY)

            except Exception as e:
                print(f"Error during scraping: {e}")
                break

        # Save scraped jobs temporarily (will be used by analyzer)
        extractor.save_jobs(temp_output)
        scraped_jobs = extractor.jobs.copy()

        # Deduplicate jobs by URL to avoid duplicates
        seen_urls = set()
        deduped_jobs = []
        for job in scraped_jobs:
            if job.get("url") and job["url"] not in seen_urls:
                seen_urls.add(job["url"])
                deduped_jobs.append(job)

        print(f"✅ Scraped {len(scraped_jobs)} jobs total, {len(deduped_jobs)} unique")
        scraped_jobs = deduped_jobs

    except Exception as e:
        print(f"❌ Scraping failed: {e}")
        return

    # Step 2: Analyze jobs with hybrid analyzer
    print("\n🔬 [2/3] Analyzing jobs with hybrid engine...")
    try:
        analyzer = HybridJobAnalyzer()
        analyzed_jobs = analyzer.analyze_batch(scraped_jobs)
        print(f"✅ Analysis complete - processed {len(analyzed_jobs)} jobs")

    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return

    # Step 3: Save enhanced results to logs
    print("\n💾 [3/3] Saving enhanced results to logs...")
    try:
        # Create logs directory if not exists
        logs_dir = Path(__file__).parent.parent / "logs"
        logs_dir.mkdir(exist_ok=True)

        # Generate timestamped filename
        from datetime import datetime

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = logs_dir / f"pipeline_results_{timestamp}.json"

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(analyzed_jobs, f, indent=2, ensure_ascii=False)

        print(f"💾 Pipeline complete! Saved {len(analyzed_jobs)} enhanced jobs to:")
        print(f"   {output_file}")

    except Exception as e:
        print(f"❌ Failed to save results: {e}")
        return


if __name__ == "__main__":

    main()
