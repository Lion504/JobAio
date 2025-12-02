from datetime import datetime

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base_cli import BaseScraperCLI
from duunitori_extractor import DuunitoriExtractor
from duunitori_scraper import DuunitoriScraper


if __name__ == "__main__":
    cli = BaseScraperCLI(
        scraper_class=DuunitoriScraper,
        extractor_class=DuunitoriExtractor,
        base_url="https://duunitori.fi/tyopaikat",
        output_file=f"duunitori_jobs_{datetime.now().strftime('%Y%m%d')}.json",
        max_pages=1,  # current test value
        delay=None,  # random delay
    )
    cli.run()
