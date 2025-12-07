"""Job scraping and analysis pipeline:
→ jobly scraper
→ pre-translate
→ categorize
→ analyze
→ logs
"""

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

# Import deduplication utility
from job_deduplicator import deduplicate_jobs  # noqa: E402


def main():
    # Full pipeline
    print("\n" + "=" * 70)
    print("🚀 JOB SCRAPER & ANALYZER PIPELINE")
    print(
        "  →  🕷️ Step 1: Scrape jobs"
        "  →  🌐 Step 2: Pre-translate to English"
        "  →  🏷️ Step 3: Categorize by industry"
        "  →  🔬 Step 4: Analyze jobs"
        "  →  💾 Step 5: Save results"
        "  →  🗄️ Step 6: Insert original jobs to database"
        "  →  🌍 Step 7: Translate jobs to multiple languages"
        "  →  🗃️ Step 8: Insert translated jobs to database"
    )
    print("=" * 70)

    # Step 1a: Scrape jobs from jobly.fi
    print("\n🕷️ [1a/5] Scraping jobs from jobly.fi...")
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

        jobly_jobs = scraped_jobs.copy()  # Keep all for now, dedup later
        print(f"✅ Scraped {len(jobly_jobs)} jobs from jobly.fi")

    except Exception as e:
        print(f"❌ Jobly scraping failed: {e}")
        return

    # Step 1b: Scrape jobs from duunitori.fi
    print("\n🕷️ [1b/5] Scraping jobs from duunitori.fi...")
    try:
        # Create DuunitoriExtractor
        duunitori_scraper = DuunitoriScraper()
        duunitori_extractor = DuunitoriExtractor(duunitori_scraper)

        # Reset extractor's job list
        duunitori_extractor.jobs = []

        # Duunitori scraping parameters
        DUUNITORI_BASE_URL = "https://duunitori.fi/tyopaikat"
        DUUNITORI_MAX_PAGES = 1  # Quick test mode
        DUUNITORI_DELAY = random.uniform(1, 3)

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
    print("\n🔄 [1c/5] Combining and deduplicating jobs...")
    try:
        all_scraped_jobs = jobly_jobs + duunitori_jobs

        # Advanced content-based deduplication (company + title + location)
        scraped_jobs = deduplicate_jobs(all_scraped_jobs)

        print(f"✅ Combined: {len(scraped_jobs)} jobs")

    except Exception as e:
        print(f"❌ Deduplication failed: {e}")
        return

    # Step 2: Pre-translate jobs to English
    print("\n🌐 [2/5] Pre-translating jobs to English...")
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
            timeout=600,  # 10 minute timeout
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

    # Step 3: Categorize jobs by industry
    print("\n🏷️ [3/5] Categorizing jobs by industry...")
    try:
        # Resolve path to Node.js categorization script
        categorize_script = (
            project_root.parent.parent.parent
            / "packages"
            / "ai"
            / "src"
            / "job_categorization.js"
        )
        categorize_script = Path(categorize_script).resolve()

        # Check script availability
        if not categorize_script.exists():
            print(f"❌ Categorization script not found at {categorize_script}")
            return

        # Create temporary files for input and output
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as input_file:
            json.dump(translated_jobs, input_file, ensure_ascii=False, indent=2)
            cat_input_file_path = input_file.name

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as output_file:
            cat_output_file_path = output_file.name

        # Run Node.js script with input and output file paths
        node_cmd = [
            "node",
            str(categorize_script),
            cat_input_file_path,
            cat_output_file_path,
        ]

        result = subprocess.run(
            node_cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=300,  # 5 minute timeout
            cwd=categorize_script.parent,
        )

        if result.returncode != 0:
            print(f"❌ Categorization failed: {result.stderr}")
            return

        # Read the categorized jobs from output file
        with open(cat_output_file_path, "r", encoding="utf-8") as f:
            categorized_jobs = json.load(f)

        print(f"✅ Categorization complete - processed {len(categorized_jobs)} jobs")

        # Clean up temp files
        try:
            Path(cat_input_file_path).unlink()
            Path(cat_output_file_path).unlink()
        except Exception as e:
            print(f"⚠️ Warning: Failed to clean up temp files: {e}")

    except Exception as e:
        print(f"❌ Categorization failed: {e}")
        return

    # Step 4: Analyze jobs with hybrid analyzer
    print("\n🔬 [4/5] Analyzing jobs with hybrid engine...")
    try:
        analyzer = HybridJobAnalyzer()
        analyzed_jobs = analyzer.analyze_batch(categorized_jobs)

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

    # Step 5: Save enhanced results to packages/db/data
    print("\n💾 [5/5] Saving enhanced results to database data folder...")
    try:
        # Create data directory if not exists
        data_dir = (
            # Path(__file__).parent.parent.parent.parent / "packages" / "db" / "data"
            Path(__file__).parent.parent
            / "logs"
        )
        data_dir.mkdir(exist_ok=True)

        # Generate timestamped filename
        from datetime import datetime

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = data_dir / f"pipeline_results_{timestamp}.json"

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(analyzed_jobs, f, indent=2, ensure_ascii=False)

        print(f"💾 Pipeline complete! Saved {len(analyzed_jobs)} enhanced jobs to:")
        print(f"   {output_file}")

    except Exception as e:
        print(f"❌ Failed to save results: {e}")
        return

    # Step 6: Insert original jobs to database
    print("\n🗄️ [6/8] Inserting original jobs to database...")
    try:
        # Resolve path to Node.js insert original script
        insert_original_script = (
            project_root.parent.parent.parent
            / "packages"
            / "db"
            / "src"
            / "insert-original.js"
        )
        insert_original_script = Path(insert_original_script).resolve()

        # Check script availability
        if not insert_original_script.exists():
            print(f"❌ Insert original script not found at {insert_original_script}")
            print("   Continuing with pipeline...")
        else:
            # Run Node.js script
            node_cmd = ["node", str(insert_original_script)]

            result = subprocess.run(
                node_cmd,
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=1200,  # 20 minute timeout as requested
                cwd=insert_original_script.parent,
            )

            if result.returncode != 0:
                print(f"❌ Insert original jobs failed: {result.stderr}")
                print("   Continuing with pipeline...")
            else:
                print("✅ Original jobs insertion complete")

    except Exception as e:
        print(f"❌ Insert original jobs failed: {e}")
        print("   Continuing with pipeline...")

    # Step 7: Translate jobs to multiple languages
    print("\n🌍 [7/8] Translating jobs to multiple languages...")
    try:
        # Resolve path to Node.js translator script
        translator_script = (
            project_root.parent.parent.parent
            / "packages"
            / "ai"
            / "src"
            / "translator.js"
        )
        translator_script = Path(translator_script).resolve()

        # Check script availability
        if not translator_script.exists():
            print(f"❌ Translator script not found at {translator_script}")
            print("   Continuing with pipeline...")
        else:
            # Run Node.js script
            node_cmd = ["node", str(translator_script)]

            result = subprocess.run(
                node_cmd,
                capture_output=False,
                text=True,
                encoding="utf-8",
                timeout=600,  # 10 minute timeout for translation
                cwd=translator_script.parent,
            )

            if result.returncode != 0:
                print(f"❌ Translation failed: {result.stderr}")
                print("   Continuing with pipeline...")
            else:
                print("✅ Translation complete")

    except Exception as e:
        print(f"❌ Translation failed: {e}")
        print("   Continuing with pipeline...")

    # Step 8: Insert translated jobs to database
    print("\n🗃️ [8/8] Inserting translated jobs to database...")
    try:
        # Resolve path to Node.js insert translated script
        insert_translated_script = (
            project_root.parent.parent.parent
            / "packages"
            / "db"
            / "src"
            / "insert-translated.js"
        )
        insert_translated_script = Path(insert_translated_script).resolve()

        # Check script availability
        if not insert_translated_script.exists():
            print(
                f"❌ Insert translated script not found at {insert_translated_script}"
            )
            print("   Pipeline finished with warnings")
        else:
            # Run Node.js script
            node_cmd = ["node", str(insert_translated_script)]

            result = subprocess.run(
                node_cmd,
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=300,  # 5 minute timeout for insert translated
                cwd=insert_translated_script.parent,
            )

            if result.returncode != 0:
                print(f"❌ Insert translated jobs failed: {result.stderr}")
                print("   Pipeline finished with errors")
            else:
                print("✅ Translated jobs insertion complete")
                print("🎉 Full pipeline complete!")

    except Exception as e:
        print(f"❌ Insert translated jobs failed: {e}")
        print("   Pipeline finished with errors")


if __name__ == "__main__":

    main()
