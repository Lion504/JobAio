#!/usr/bin/env python3
"""
Test Duunitori Scraper
Tests the complete scraping pipeline for duunitori.fi
"""

import json
import sys
import argparse
import random
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from duunitori.duunitori_extractor import DuunitoriExtractor
from duunitori.duunitori_scraper import DuunitoriScraper


def run_duunitori_test(max_pages: int, delay: float):
    """
    Run duunitori scraper test
    """
    print("\n" + "=" * 60)
    print("🕷️ DUUNITORI SCRAPER TEST")
    print("🎯 Target: https://duunitori.fi/tyopaikat")
    print("=" * 60)
    print(f"Pages:  {max_pages}")
    print(f"Delay:  {delay}s between pages")
    print("-" * 60)

    # 1. Initialize scraper and extractor
    scraper = DuunitoriScraper()
    extractor = DuunitoriExtractor(scraper)

    BASE_URL = "https://duunitori.fi/tyopaikat"

    print(f"\n🔄 Starting scrape of {max_pages} pages...")

    # 2. Scrape pages
    page_num = 0
    while page_num < max_pages:
        if page_num == 0:
            job_url = BASE_URL
        else:
            job_url = f"{BASE_URL}?page={page_num}"

        print(f"\n📄 Page {page_num + 1}/{max_pages}: {job_url}")

        try:
            # Get job cards from page
            job_cards = scraper.scrape_jobs_list(job_url)

            if not job_cards:
                print("   ⚠️  No job cards found on this page")
                if page_num > 0:
                    print("   🛑 Stopping - no more pages")
                    break
                else:
                    print("   🔄 Trying again...")
                    continue

            print(f"   📋 Found {len(job_cards)} job cards")

            # Extract data from each job card
            jobs_from_page = 0
            for card_idx, job_card in enumerate(job_cards, 1):
                print(f"   [{card_idx}/{len(job_cards)}] Processing job card...")

                job_data = extractor.extract_job_data(job_card)

                if job_data and job_data.get("title") and job_data["title"] != "N/A":
                    extractor.jobs.append(job_data)
                    jobs_from_page += 1
                    print(f"      ✅ Added: {job_data['title'][:50]}...")
                else:
                    print("      ⚠️  Skipped: Invalid or missing job data")

            print(
                f"   📊 Page {page_num + 1} complete: {jobs_from_page} jobs extracted"
            )
            print(f"   📈 Total jobs so far: {len(extractor.jobs)}")

            page_num += 1

            # Delay between pages
            if delay > 0 and page_num < max_pages:
                print(f"   ⏳ Waiting {delay}s...")
                import time

                time.sleep(delay)

        except Exception as e:
            print(f"   ❌ Error on page {page_num + 1}: {e}")
            import traceback

            traceback.print_exc()
            break

    # 3. Save results
    print("\n" + "-" * 60)
    print("💾 SAVING RESULTS")

    if not extractor.jobs:
        print("❌ No jobs were extracted!")
        return

    # Generate timestamped filename
    from datetime import datetime

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"duunitori_test_{timestamp}.json"

    # Save to logs directory
    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    output_filepath = logs_dir / output_filename

    try:
        with open(output_filepath, "w", encoding="utf-8") as f:
            json.dump(extractor.jobs, f, indent=2, ensure_ascii=False)

        print(f"✅ Saved {len(extractor.jobs)} jobs to:")
        print(f"   {output_filepath}")

        # Show summary
        print("\n📊 EXTRACTION SUMMARY:")
        print(f"   • Total pages processed: {page_num}")
        print(f"   • Total jobs extracted: {len(extractor.jobs)}")
        print(
            f"   • Average jobs per page: {len(extractor.jobs) / max(1, page_num):.1f}"
        )

        # Sample some jobs
        if extractor.jobs:
            print("\n🎯 SAMPLE JOBS:")
            for i, job in enumerate(extractor.jobs[:3], 1):
                print(f"   {i}. {job.get('title', 'N/A')[:40]}...")
                print(f"      Company: {job.get('company', 'N/A')}")
                print(f"      Location: {job.get('location', 'N/A')}")
                print(f"      URL: {job.get('url', 'N/A')[:50]}...")

    except Exception as e:
        print(f"❌ Error saving results: {e}")

    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Test Duunitori Scraper")

    parser.add_argument(
        "--pages", type=int, default=1, help="Number of pages to scrape (default: 1)"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=2.0,
        help="Delay between pages in seconds (default: 2.0)",
    )

    args = parser.parse_args()

    run_duunitori_test(args.pages, args.delay)


if __name__ == "__main__":
    main()
