import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml," "application/xml;q=0.9,image/webp,*/*;q=0.8"
    ),
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


class JoblyScraper:

    def scrape_job(self, job_url):
        if not job_url or job_url is None:
            return "N/A"

        def make_request(job_url):
            try:
                response = requests.get(job_url, headers=HEADERS, timeout=10)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                print(f"Error fetching the job URL: {e}")
                return "N/A"

        try:
            response = make_request(job_url)

            soup = BeautifulSoup(response.text, "html.parser")

            job_selectors = [
                # Jobly.fi specific selectors (highest priority)
                'div.field__item[property="content:encoded"]',
                "div.field--name-body div.field__item",
                # Common job selectors
                "div.job-description",
                "section.job-description",
                "div.description",
                "section.description",
                'div[class*="job-content"]',
                'section[class*="job-content"]',
                "div.content",
                "main.content",
                'div[class*="job-description"]',
                ".job-description",
                ".description",
                "article",
                "main",
            ]

            job_description = ""

            for selector in job_selectors:
                desc_elem = soup.select(selector)
                if desc_elem:
                    for elem in desc_elem:
                        text = elem.get_text(separator=" ", strip=True)
                        if len(text.split()) > 50:
                            job_description = text
                            break
                    if job_description:
                        break
            job_description = "".join(job_description.split())

            print(
                f"Extracted job description length: {
                    len(job_description)
                    } characters from {job_url}"
            )
            return job_description

        except requests.RequestException as e:
            print(f"Error fetching the job URL: {e}")
            return "N/A"

    def scrape_jobs_list(self, job_url):
        if not job_url or job_url is None:
            raise ValueError("Job URL must be provided")

        try:
            # TODO: do I need this timeout?
            response = requests.get(job_url, headers=HEADERS, timeout=10)
            response.raise_for_status()

            # Handle Brotli decompression automatically
            html_content = response.text

            soup = BeautifulSoup(html_content, "html.parser")

            # Use article elements as job containers
            job_cards = soup.find_all("article")
            # print(f"Found {len(job_cards)} article elements (potential job cards)")

            return job_cards

        except requests.RequestException as e:
            print(f"Error fetching the job URL: {e}")
            return []
