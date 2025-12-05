import random
import time


class BaseScraperCLI:
    """
    Generic CLI class for web scrapers that takes scraper/extractor classes as
    parameters. Eliminates code duplication between different scraper implementations.
    """

    def __init__(
        self,
        scraper_class,
        extractor_class,
        base_url,
        output_file=None,
        max_pages=1,
        delay=None,
    ):
        """
        Initialize the CLI with scraper/extractor classes and configuration.

        Args:
            scraper_class: The scraper class (e.g., DuunitoriScraper)
            extractor_class: The extractor class (e.g., DuunitoriExtractor)
            base_url: Base URL for scraping (e.g., "https://duunitori.fi/tyopaikat")
            output_file: Output filename (optional, will generate timestamped name
            if None)
            max_pages: Maximum number of pages to scrape (default: 1)
            delay: Delay between requests in seconds (optional, random 1-5s if None)
        """
        self.scraper_class = scraper_class
        self.extractor_class = extractor_class
        self.base_url = base_url
        self.output_file = output_file
        self.max_pages = max_pages
        self.delay = delay

    def run(self):
        """Run the scraping process with pagination and error handling."""
        # Initialize scraper and extractor
        scraper = self.scraper_class()
        extractor = self.extractor_class(scraper)

        # Handle infinite pages (None = unlimited)
        if self.max_pages is None:
            max_pages = float("inf")
        else:
            max_pages = self.max_pages

        # Set delay (random if not specified)
        delay = random.uniform(1, 5) if self.delay is None else self.delay

        page_num = 0
        while page_num < max_pages:
            # Construct page URL
            if page_num == 0:
                job_url = self.base_url
            else:
                job_url = f"{self.base_url}?page={page_num}"

            print(f"Scraping page {page_num + 1}...")

            try:
                # Scrape job listings from current page
                job_cards = scraper.scrape_jobs_list(job_url)

                # Stop if no more jobs found (but allow first page to be empty)
                if not job_cards and page_num > 0:
                    print("No more job postings found. Exiting.")
                    break

                print(f"Found {len(job_cards)} job postings on this page.")

                # Process each job card
                for job_card in job_cards:
                    job_data = extractor.extract_job_data(job_card)

                    # Only add valid jobs
                    if (
                        job_data
                        and job_data.get("title")
                        and job_data["title"] != "N/A"
                    ):
                        extractor.jobs.append(job_data)

                print(f"Total jobs collected so far: {len(extractor.jobs)}")
                page_num += 1

                # Add delay between requests
                if delay > 0:
                    time.sleep(delay)

            except Exception as e:
                print(f"Error occurred while scraping: {e}")
                break

        # Save results
        extractor.save_jobs(self.output_file)
