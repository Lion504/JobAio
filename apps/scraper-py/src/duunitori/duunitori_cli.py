import random
import time

from duunitori_extractor import DuunitoriExtractor
from duunitori_scraper import DuunitoriScraper

BASE_URL = "https://duunitori.fi/tyopaikat"
OUTPUT_FILE = None
MAX_PAGES = 1  # current test value
DELAY = None


def main():
    scraper = DuunitoriScraper()
    extractor = DuunitoriExtractor(scraper)

    if MAX_PAGES is None:
        max_pages = float("inf")
    else:
        max_pages = MAX_PAGES

    delay = random.uniform(1, 5) if DELAY is None else DELAY

    page_num = 0
    while page_num < max_pages:
        if page_num == 0:
            job_url = BASE_URL
        else:
            job_url = f"{BASE_URL}?page={page_num}"
        print(f"Scraping page {page_num + 1}/{max_pages}...")

        try:
            job_cards = scraper.scrape_jobs_list(job_url)
            if not job_cards and page_num > 0:
                print("No more job postings found. Exiting.")
                break

            print(f"Found {len(job_cards)} job postings on this page.")

            for job_card in job_cards:
                job_data = extractor.extract_job_data(job_card)

                if job_data and job_data.get("title") and job_data["title"] != "N/A":
                    extractor.jobs.append(job_data)

            print(f"Total jobs collected so far: {len(extractor.jobs)}")
            page_num += 1
            if delay > 0:
                time.sleep(delay)

        except Exception as e:
            print(f"Error occurred while scraping: {e}")
            break

    extractor.save_jobs(OUTPUT_FILE)


if __name__ == "__main__":
    main()
