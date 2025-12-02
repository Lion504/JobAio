import re

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
    MIN_JOB_DESCRIPTION_WORDS = 50

    def clean_personal_data(self, text):
        """Remove personal information like phone numbers, emails, and person names."""
        if not text:
            return text

        # More specific phone number patterns (avoid matching dates)
        phone_patterns = [
            r"\+\d{1,3}[\s\-]\d{1,2}[\s\-]\d{1,3}[\s\-]?\d{0,4}",  # +358 50 339 2228
            r"\d{2,3}[\s\-]\d{1,3}[\s\-]\d{1,4}[\s\-]?\d{0,4}",  # 050 339 2228
            r"\d{3}[\s\-]\d{3}[\s\-]\d{4}",  # 050-339-2228
        ]

        for pattern in phone_patterns:
            text = re.sub(pattern, "", text)

        # Remove email addresses
        text = re.sub(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+" r"\.[A-Za-z]{2,}\b", "", text
        )

        # Remove URLs in descriptions
        text = re.sub(r"https?://[^\s]+", "", text)

        # Remove person names in contact sections
        contact_keywords = [
            "yhteydenotto",
            "yhteystiedot",
            "contact",
            "lisätietoja",
            "additional information",
            "ota yhteyttä",
            "call",
            "email",
        ]
        for keyword in contact_keywords:
            if keyword in text.lower():
                pattern = (
                    r"\b" + re.escape(keyword) + r"\b.*?([A-Z][a-z]+\s[A-Z][a-z]+)"
                )
                text = re.sub(pattern, keyword, text, flags=re.IGNORECASE)

        # Clean up extra whitespace
        text = re.sub(r"\s+", " ", text).strip()

        return text

    def scrape_job(self, job_url):
        if not job_url or job_url == "N/A":
            return "N/A"

        def make_request(job_url):
            try:
                response = requests.get(job_url, headers=HEADERS, timeout=10)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                print(f"Error fetching the job URL: {e}")
                return "N/A"

        response = make_request(job_url)
        if response == "N/A":
            return "N/A"

        try:
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
                        if len(text.split()) > self.MIN_JOB_DESCRIPTION_WORDS:
                            job_description = text
                            break
                    if job_description:
                        break

            # Clean personal data from the description
            if job_description:
                job_description = self.clean_personal_data(job_description)

            # print(f"Job detail: {len(job_description)} chars from {job_url}")

            if not job_description:
                job_description = "N/A"

            return job_description

        except Exception as e:
            print(f"Error processing job page: {e}")
            return "N/A"

    def scrape_jobs_list(self, job_url):
        if not job_url:
            raise ValueError("Job URL must be provided")

        try:
            response = requests.get(job_url, headers=HEADERS, timeout=10)
            response.raise_for_status()

            # Handle Brotli decompression automatically
            html_content = response.text

            soup = BeautifulSoup(html_content, "html.parser")

            # Use article elements as job containers
            job_cards = soup.find_all("article")

            return job_cards

        except requests.RequestException as e:
            print(f"Error fetching the job URL: {e}")
            return []
