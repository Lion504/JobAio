import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from jobly_extractor import JoblyExtractor  # noqa: E402
from jobly_scraper import JoblyScraper  # noqa: E402

from base_cli import BaseScraperCLI  # noqa: E402

if __name__ == "__main__":
    cli = BaseScraperCLI(
        scraper_class=JoblyScraper,
        extractor_class=JoblyExtractor,
        base_url="https://www.jobly.fi/en/jobs",
        output_file=None,  # Will generate timestamped filename
        max_pages=1,  # current test value
        delay=None,  # random delay
    )
    cli.run()
