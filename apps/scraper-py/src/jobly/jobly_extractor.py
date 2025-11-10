import json
import os
from datetime import datetime


class JoblyExtractor:
    def __init__(self, scraper):
        self.jobs = []
        self.scraper = scraper

    def extract_job_data(self, job_card):
        job = {}

        # Extract Job Title and URL
        try:
            title_elem = job_card.find("h2", class_="node__title")
            if title_elem:
                a_elem = title_elem.find("a")
                if a_elem:
                    job["title"] = a_elem.get_text(strip=True)
                    href = a_elem.get("href")
                    if href:
                        job["url"] = (
                            "https://www.jobly.fi" + href
                            if href.startswith("/")
                            else href
                        )
                    else:
                        job["url"] = "N/A"
                else:
                    job["title"] = title_elem.get_text(strip=True)
                    job["url"] = "N/A"
            else:
                job["title"] = "N/A"
                job["url"] = "N/A"

            # Extract Company Name
            company_elem = job_card.find(
                "span", class_="recruiter-company-profile-job-organization"
            )
            if company_elem:
                job["company"] = company_elem.get_text(strip=True)
            else:
                job["company"] = "N/A"

            # Extract Location
            location_elem = job_card.find("div", class_="location")
            if location_elem:
                job["location"] = location_elem.get_text(strip=True)
            else:
                job["location"] = "N/A"

            # Extract Posted Date
            date_elem = job_card.find("span", class_="date")
            if date_elem:
                job["date"] = date_elem.get_text(strip=True)
            else:
                job["date"] = "N/A"

            job["description"] = self.scraper.scrape_job(job["url"])

            return job

        except Exception as e:
            print(f"Error extracting job data: {e}")
            return job

    def save_jobs(self, output_file):
        # get path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(script_dir, ".."))
        logs_dir = os.path.join(project_root, "logs")  # apps/scraper-py/logs/

        # Ensure logs directory exists
        os.makedirs(logs_dir, exist_ok=True)

        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"jobs_{timestamp}.json"

        output_file = os.path.join(logs_dir, output_file)

        try:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(self.jobs, f, ensure_ascii=False, indent=4)
            print(f"Jobs saved to {output_file}")
        except Exception as e:
            print(f"Error saving jobs: {e}")
