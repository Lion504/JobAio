"""
Job Deduplication Utility

Provides content-based deduplication for job listings from multiple sources.
Uses company + title + location fingerprints to identify duplicates across platforms.
"""

import hashlib
import re
from typing import List, Dict, Any


def normalize_text(text: str) -> str:
    """Normalize text for comparison: lowercase, remove extra spaces, punctuation"""
    if not text:
        return ""
    # Lowercase and strip
    text = text.lower().strip()
    # Remove common suffixes like Oy, Ltd, Inc
    text = re.sub(r"\b(oy|oyj|ab|ltd|inc|gmbh)\b", "", text)
    # Remove punctuation and extra spaces
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def generate_job_fingerprint(job: Dict[str, Any]) -> str:
    """Generate unique fingerprint from company + title + location"""
    company = normalize_text(job.get("company", ""))
    title = normalize_text(job.get("title", ""))
    location = normalize_text(job.get("location", ""))

    # Create fingerprint string
    fingerprint_str = f"{company}|{title}|{location}"

    # Return hash
    return hashlib.md5(fingerprint_str.encode()).hexdigest()


def deduplicate_jobs(jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Deduplicate jobs by fingerprint, keeping first occurrence

    Uses two-level deduplication:
    1. Fast URL-based deduplication (if URLs available)
    2. Content-based deduplication using company+title+location fingerprint

    This catches duplicate jobs posted on different platforms with different URLs.
    """
    seen_fingerprints = set()
    seen_urls = set()
    deduped = []

    for job in jobs:
        # Skip if URL already seen (fast check)
        url = job.get("url", "")
        if url and url in seen_urls:
            continue

        # Generate fingerprint for content-based dedup
        fingerprint = generate_job_fingerprint(job)

        if fingerprint not in seen_fingerprints:
            seen_fingerprints.add(fingerprint)
            if url:
                seen_urls.add(url)
            deduped.append(job)

    return deduped


# Example usage and testing
if __name__ == "__main__":
    # Sample jobs for testing
    sample_jobs = [
        {
            "company": "ABC Oy",
            "title": "Software Developer",
            "location": "Helsinki",
            "url": "https://jobly.fi/job1",
        },
        {
            "company": "ABC Ltd",  # Same company, different suffix
            "title": "Software Developer",
            "location": "Helsinki",
            "url": "https://duunitori.fi/job1",
        },
        {
            "company": "XYZ Inc",
            "title": "Data Analyst",
            "location": "Tampere",
            "url": "https://jobly.fi/job2",
        },
    ]

    print(f"Original jobs: {len(sample_jobs)}")
    deduped = deduplicate_jobs(sample_jobs)
    print(f"Deduplicated jobs: {len(deduped)}")

    for job in deduped:
        fingerprint = generate_job_fingerprint(job)
        print(f"  {job['company']} - {job['title']} ({fingerprint[:8]}...)")
