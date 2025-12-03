"""Job scraping and analysis pipeline: jobly scraper → hybrid analyzer → logs"""

import json
import random  # For delay calculations
import subprocess
import sys
import tempfile
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

# Import duunitori components
from duunitori.duunitori_extractor import DuunitoriExtractor  # noqa: E402
from duunitori.duunitori_scraper import DuunitoriScraper  # noqa: E402

from job_analyzer.hybrid_job_analyzer import HybridJobAnalyzer  # noqa: E402


def main():
    """Full pipeline: scrape jobs → pre-translate → analyze → save to logs"""
    print("\n" + "=" * 70)
    print("🚀 JOB SCRAPER & ANALYZER PIPELINE")
    print(
        "  →  🕷️ Step 1: Scrape jobs"
        "  →  🌐 Step 2: Pre-translate to English"
        "  →  🔬 Step 3: Analyze jobs"
        "  →  💾 Step 4: Save results"
    )
    print("=" * 70)

    # Step 1a: Scrape jobs from jobly.fi
    print("\n🕷️ [1a/4] Scraping jobs from jobly.fi...")
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

        jobly_jobs = deduped_jobs
        print(f"✅ Scraped {len(scraped_jobs)} jobs from jobly.fi")

    except Exception as e:
        print(f"❌ Jobly scraping failed: {e}")
        return

    # Step 1b: Scrape jobs from duunitori.fi
    print("\n🕷️ [1b/4] Scraping jobs from duunitori.fi...")
    try:
        # Create DuunitoriExtractor
        duunitori_scraper = DuunitoriScraper()
        duunitori_extractor = DuunitoriExtractor(duunitori_scraper)

        # Reset extractor's job list
        duunitori_extractor.jobs = []

        # Duunitori scraping parameters
        DUUNITORI_BASE_URL = "https://duunitori.fi/tyopaikat"
        DUUNITORI_MAX_PAGES = 1  # Quick test mode
        DUUNITORI_DELAY = random.uniform(1, 3) if hasattr(random, "uniform") else 1.5

        # Scrape duunitori jobs
        duunitori_max_pages = (
            DUUNITORI_MAX_PAGES if DUUNITORI_MAX_PAGES is not None else float("inf")
        )
        duunitori_page_num = 0

        while duunitori_page_num < duunitori_max_pages:
            duunitori_job_url = (
                DUUNITORI_BASE_URL
                if duunitori_page_num == 0
                else f"{DUUNITORI_BASE_URL}?page={duunitori_page_num}"
            )
            print(f"Scraping duunitori page {duunitori_page_num + 1}...")

            try:
                duunitori_job_cards = duunitori_scraper.scrape_jobs_list(
                    duunitori_job_url
                )
                if not duunitori_job_cards and duunitori_page_num > 0:
                    print("No more duunitori job postings found.")
                    break

                print(f"Found {len(duunitori_job_cards)} duunitori job postings.")
                for job_card in duunitori_job_cards:
                    job_data = duunitori_extractor.extract_job_data(job_card)
                    if (
                        job_data
                        and job_data.get("title")
                        and job_data["title"] != "N/A"
                    ):
                        duunitori_extractor.jobs.append(job_data)

                duunitori_page_num += 1
                if DUUNITORI_DELAY > 0:
                    time.sleep(DUUNITORI_DELAY)

            except Exception as e:
                print(f"Error during duunitori scraping: {e}")
                break

        duunitori_jobs = duunitori_extractor.jobs.copy()
        print(f"✅ Scraped {len(duunitori_jobs)} jobs from duunitori.fi")

    except Exception as e:
        print(f"❌ Duunitori scraping failed: {e}")
        return

    # Step 1c: Combine and deduplicate across both sources
    print("\n🔄 [1c/4] Combining and deduplicating jobs...")
    try:
        all_scraped_jobs = jobly_jobs + duunitori_jobs

        # Deduplicate by URL across both sources
        seen_urls = set()
        deduped_jobs = []
        for job in all_scraped_jobs:
            if job.get("url") and job["url"] not in seen_urls:
                seen_urls.add(job["url"])
                deduped_jobs.append(job)

        scraped_jobs = deduped_jobs
        print(
            f"✅ Combined: {len(jobly_jobs)} jobly + {len(duunitori_jobs)} duunitori = {len(scraped_jobs)} unique jobs"
        )

    except Exception as e:
        print(f"❌ Deduplication failed: {e}")
        return

    # Step 2: Pre-translate jobs to English
    print("\n🌐 [2/4] Pre-translating jobs to English...")
    try:
        # Resolve path to Node.js pretranslation script
        pretranslate_script = (
            project_root.parent.parent.parent
            / "packages"
            / "ai"
            / "src"
            / "job_pretranslator.js"
        )
        pretranslate_script = Path(pretranslate_script).resolve()

        # Check script availability
        if not pretranslate_script.exists():
            print(f"❌ Pretranslation script not found at {pretranslate_script}")
            return

        # Create temporary files for input and output
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as input_file:
            json.dump(scraped_jobs, input_file, ensure_ascii=False, indent=2)
            input_file_path = input_file.name

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as output_file:
            output_file_path = output_file.name

        # Run Node.js script with input and output file paths
        node_cmd = ["node", str(pretranslate_script), input_file_path, output_file_path]

        result = subprocess.run(
            node_cmd,
            text=True,
            timeout=600,  # 10 minute timeout (should be plenty with concurrent processing)
            cwd=pretranslate_script.parent,
        )

        if result.returncode != 0:
            print(f"❌ Pretranslation failed: {result.stderr}")
            return

        # Read the translated jobs from output file
        with open(output_file_path, "r", encoding="utf-8") as f:
            translated_jobs = json.load(f)

        print(f"✅ Pretranslation complete - processed {len(translated_jobs)} jobs")

        # Clean up temp files
        try:
            Path(input_file_path).unlink()
            Path(output_file_path).unlink()
        except Exception as e:
            print(f"⚠️ Warning: Failed to clean up temp files: {e}")

    except Exception as e:
        print(f"❌ Pretranslation failed: {e}")
        return

    # Step 3: Analyze jobs with hybrid analyzer
    print("\n🔬 [3/4] Analyzing jobs with hybrid engine...")
    try:
        analyzer = HybridJobAnalyzer()
        analyzed_jobs = analyzer.analyze_batch(translated_jobs)

        # Validate the analyzed jobs
        if not analyzed_jobs or len(analyzed_jobs) == 0:
            print("❌ Analysis failed: Empty results from hybrid analyzer")
            return

        # Check if any jobs have analysis errors
        jobs_with_errors = [job for job in analyzed_jobs if job.get("_error")]
        if jobs_with_errors:
            print(f"⚠️ Warning: {len(jobs_with_errors)} jobs had analysis errors")

        print(f"✅ Analysis complete - processed {len(analyzed_jobs)} jobs")

    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return

    # Step 4: Save enhanced results to logs
    print("\n💾 [4/4] Saving enhanced results to logs...")
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
