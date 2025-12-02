import json
import os
from datetime import datetime


class DuunitoriExtractor:
    def __init__(self, scraper):
        self.jobs = []
        self.scraper = scraper

    def extract_job_data(self, job_card):
        job = {}

        # Extract Job Title and URL
        try:
            # Duunitori.fi specific selectors for job title and link
            title_selectors = [
                'h2[class*="job-title"] a',
                'h3[class*="job-title"] a',
                'a[class*="job-title"]',
                "h2 a",
                "h3 a",
                'a[href*="/tyopaikat"]',
            ]

            title_elem = None
            for selector in title_selectors:
                title_elem = job_card.select_one(selector)
                if title_elem:
                    break

            if title_elem:
                job["title"] = title_elem.get_text(strip=True)
                href = title_elem.get("href")
                if href:
                    job["url"] = (
                        "https://duunitori.fi" + href if href.startswith("/") else href
                    )
                else:
                    job["url"] = "N/A"
            else:
                # Fallback to general title search
                title_elem = job_card.find(["h1", "h2", "h3", "h4"])
                if title_elem:
                    job["title"] = title_elem.get_text(strip=True)
                    # Try to find link in the card
                    link_elem = job_card.find("a")
                    if link_elem and link_elem.get("href"):
                        href = link_elem.get("href")
                        job["url"] = (
                            "https://duunitori.fi" + href
                            if href.startswith("/")
                            else href
                        )
                    else:
                        job["url"] = "N/A"
                else:
                    job["title"] = "N/A"
                    job["url"] = "N/A"

            # Extract Company Name
            company_selectors = [
                'span[class*="company"]',
                'div[class*="company"]',
                '[class*="employer"]',
                'span[class*="recruiter"]',
                'div[class*="recruiter"]',
            ]

            company_elem = None
            for selector in company_selectors:
                company_elem = job_card.select_one(selector)
                if company_elem:
                    break

            if company_elem:
                job["company"] = company_elem.get_text(strip=True)
            else:
                job["company"] = "N/A"

            # Extract Location
            location_selectors = [
                'span[class*="location"]',
                'div[class*="location"]',
                '[class*="place"]',
                'span[class*="city"]',
            ]

            location_elem = None
            for selector in location_selectors:
                location_elem = job_card.select_one(selector)
                if location_elem:
                    break

            if location_elem:
                job["location"] = location_elem.get_text(strip=True)
            else:
                job["location"] = "N/A"

            # Extract Posted Date
            date_selectors = [
                'span[class*="date"]',
                "time",
                '[class*="published"]',
                '[class*="posted"]',
            ]

            date_elem = None
            for selector in date_selectors:
                date_elem = job_card.select_one(selector)
                if date_elem:
                    break

            if date_elem:
                # Try different date formats
                date_text = date_elem.get_text(strip=True)
                if date_elem.get("datetime"):
                    date_text = date_elem.get("datetime")
                job["publish_date"] = date_text
            else:
                job["publish_date"] = "N/A"

            job["description"] = self.scraper.scrape_job(job["url"])

            job["source"] = "duunitori.fi"
            return job

        except Exception as e:
            print(f"Error extracting job data: {e}")
            return {
                "title": "N/A",
                "url": "N/A",
                "company": "N/A",
                "location": "N/A",
                "publish_date": "N/A",
                "description": "N/A",
                "source": "duunitori.fi",
            }

    def save_jobs(self, output_file):
        # get path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, "../.."))
        logs_dir = os.path.join(project_root, "logs")  # apps/scraper-py/logs/

        # Ensure logs directory exists
        os.makedirs(logs_dir, exist_ok=True)

        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"jobs_duunitori_{timestamp}.json"

        output_file = os.path.join(logs_dir, output_file)

        try:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(self.jobs, f, ensure_ascii=False, indent=4)
            print(f"Jobs saved to {output_file}")
        except Exception as e:
            print(f"Error saving jobs: {e}")
