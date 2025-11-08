import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
import os
import random

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "max-age=0",
}

BASE_URL = "https://www.jobly.fi/en/jobs"
OUTPUT_FILE = None
MAX_PAGES = 10 # current test value
DELAY = None

class JoblyScraper:
    def __init__(self):
        self.max_pages = MAX_PAGES
        self.delay = DELAY
        self.jobs = []
        self.base_url = BASE_URL

    def scrape_jobs(self, job_url):
        if not job_url or job_url == None:
            raise ValueError("Job URL must be provided")

        try:
            response =  requests.get (job_url, headers=HEADERS, timeout=10)
            response.raise_for_status()

            # Handle Brotli decompression automatically
            html_content = response.text

            soup = BeautifulSoup(html_content, "html.parser")

            # Use article elements as job containers
            job_cards = soup.find_all('article')
            # print(f"Found {len(job_cards)} article elements (potential job cards)")

            return job_cards

        except requests.RequestException as e:
            print(f"Error fetching the job URL: {e}")
            return []

    def extract_job_data(self, job_card):
        job = {}

        # Extract Job Title and URL
        try:
            title_elem = job_card.find('h2', class_='node__title')
            if title_elem:
                a_elem = title_elem.find('a')
                if a_elem:
                    job['title'] = a_elem.get_text(strip=True)
                    href = a_elem.get('href')
                    if href:
                        job["url"] = (
                            f"https://www.jobly.fi" + href if href.startswith("/") else href
                        )
                    else:
                        job['url'] = 'N/A'
                else:
                    job['title'] = title_elem.get_text(strip=True)
                    job['url'] = 'N/A'
            else:
                job['title'] = 'N/A'
                job['url'] = 'N/A'

            return job

        except Exception as e:
            print(f"Error extracting job title: {e}")

        # TODO:Extract Company Name, Location, Posted Date, Job Description, etc.
    def save_jobs(self, output_file):
        # get path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, '..'))
        logs_dir = os.path.join(project_root, "logs")  # apps/scraper-py/logs/

        # Ensure logs directory exists
        os.makedirs(logs_dir, exist_ok=True)

        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"jobs_{timestamp}.json"

        output_file = os.path.join(logs_dir, output_file)

        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.jobs, f, ensure_ascii=False, indent=4)
            print(f"Jobs saved to {output_file}")
        except Exception as e:
            print(f"Error saving jobs: {e}")
    def run(self):
        if self.max_pages is None:
            self.max_pages = float("inf")

        self.delay = random.uniform(1, 5) if self.delay is None else self.delay

        page_num = 0
        while page_num < self.max_pages:
            if page_num == 0:
                job_url = self.base_url
            else:
                job_url = f"{self.base_url}?page={page_num}"
            print(f"Scraping page {page_num + 1}/{self.max_pages}...")

            try:
                job_cards = self.scrape_jobs(job_url)
                if not job_cards and page_num > 0:
                    print("No more job postings found. Exiting.")
                    break

                print(f"Found {len(job_cards)} job postings on this page.")
                jobs_on_page = 0

                for job_card in job_cards:
                    job_data = self.extract_job_data(job_card)

                    if job_data and job_data.get('title') and job_data['title'] != 'N/A':
                        self.jobs.append(job_data)
                        jobs_on_page += 1

                print(f"Total jobs collected so far: {len(self.jobs)}")
                page_num += 1
                if self.delay:
                    time.sleep(self.delay)

            except Exception as e:
                print(f"Error occurred while scraping: {e}")
                break

        return self.jobs

if __name__ == "__main__":
    scraper = JoblyScraper()
    scraper.run()
    scraper.save_jobs(OUTPUT_FILE)
