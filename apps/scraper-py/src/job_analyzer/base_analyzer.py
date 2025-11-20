"""Rule-based job description analyzer"""

from typing import Any, Dict, List

from .constants import (  # RESPONSIBILITIES_PATTERN,
    EDUCATION_PATTERNS,
    EXPERIENCE_PATTERNS,
    JOB_TYPE_PATTERNS,
    LANGUAGE_PATTERNS,
    SKILL_PATTERNS,
    YEARS_PATTERN,
)


class BaseJobAnalyzer:
    """Rule-based job description analysis"""

    def __init__(self):
        # Language patterns (English/Finnish)
        self.language_patterns = LANGUAGE_PATTERNS

        # Experience patterns
        self.experience_patterns = EXPERIENCE_PATTERNS

        # Education patterns
        self.education_patterns = EDUCATION_PATTERNS

        # Skill patterns
        self.skill_patterns = SKILL_PATTERNS

        # Years pattern
        self.years_pattern = YEARS_PATTERN

        # Responsibilities pattern
        # self.responsibilities_pattern = RESPONSIBILITIES_PATTERN

        # Job type patterns
        self.job_type_patterns = JOB_TYPE_PATTERNS

    def analyze_job(self, description: str) -> Dict[str, Any]:
        """Extract all structured information from job description"""
        if not description or description == "N/A":
            return self._empty_analysis()

        return {
            "language": self.extract_languages(description),
            "experience_level": self.extract_experience_level(description),
            "education_level": self.extract_education(description),
            "skill_type": self.extract_skills(description),
            "responsibilities": self.extract_responsibilities(description),
            "job_type": self.extract_job_type(description),
        }

    def extract_job_type(self, text: str) -> List[str]:
        """Extract job type (full_time, part_time, internship)"""
        job_types = []

        for type_name, pattern in self.job_type_patterns.items():
            if pattern.search(text):
                job_types.append(type_name)

        return list(set(job_types))

    LANGUAGE_MAPPING = {
        "suomi": "finnish",
        "suomen": "finnish",
        "äidinkieli": "finnish",
        "englanti": "english",
        "englannin": "english",
        "ruotsi": "swedish",
        "ruotsin": "swedish",
    }

    def extract_languages(self, text: str) -> Dict[str, List[str]]:
        """Extract language requirements"""
        required = []
        advantage = []

        for match in self.language_patterns["required"].findall(text):
            if isinstance(match, tuple):
                lang_text = next((m for m in match if m), "")
            else:
                lang_text = match

            if lang_text:
                # Normalize language
                raw_lang = lang_text.lower().split()[0]
                normalized_lang = self.LANGUAGE_MAPPING.get(raw_lang, raw_lang)

                if normalized_lang not in required:
                    required.append(normalized_lang)

        for match in self.language_patterns["advantage"].findall(text):
            if isinstance(match, tuple):
                lang_text = next((m for m in match if m), "")
            else:
                lang_text = match

            if lang_text:
                # Normalize language
                raw_lang = lang_text.lower().split()[0]
                normalized_lang = self.LANGUAGE_MAPPING.get(raw_lang, raw_lang)

                if normalized_lang not in required and normalized_lang not in advantage:
                    advantage.append(normalized_lang)

        return {"required": required, "advantage": advantage}

    def extract_experience_level(self, text: str) -> str:
        """Extract experience level (student/entry/specialist/senior/unknown)"""
        # Check specific keywords (Senior > Specialist > Entry > Student)
        for experience_name, experience_pattern in self.experience_patterns.items():
            if experience_pattern.search(text):
                return experience_name

        # Fallback: Check for year ranges
        years_matches = self.years_pattern.findall(text)

        max_years = -1
        for match in years_matches:
            try:
                years = int(match.split()[0])
                max_years = max(max_years, years)
            except (ValueError, IndexError):
                continue

        if max_years >= 5:
            return "senior"
        elif max_years >= 2:
            return "specialist"
        elif max_years >= 0:
            return "entry"

        return "unknown"

    def extract_education(self, text: str) -> List[str]:
        """Extract education requirements"""
        education = []

        for level, pattern in self.education_patterns.items():
            if pattern.search(text):
                education.append(level)

        return list(set(education))

    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        """Extract technical and soft skills"""
        skills = {
            "programming": [],
            "soft_skills": [],
            "domain_specific": [],
            "certificate": [],
            "other": [],
        }

        prog_matches = self.skill_patterns["programming"].findall(text)
        skills["programming"] = list(set(prog_matches))

        soft_matches = self.skill_patterns["soft_skills"].findall(text)
        skills["soft_skills"] = list(set(soft_matches))

        domain_matches = self.skill_patterns["domain_specific"].findall(text)
        skills["domain_specific"] = list(set(domain_matches))

        certificate_matches = self.skill_patterns["certificate"].findall(text)
        skills["certificate"] = list(set(certificate_matches))

        skills["other"] = []

        return skills

    def extract_responsibilities(self, text: str) -> List[str]:
        return []

    def _empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure"""
        return {
            "job_type": [],
            "language": {"required": [], "advantage": []},
            "experience_level": "unknown",
            "education_level": [],
            "skill_type": {
                "programming": [],
                "soft_skills": [],
                "domain_specific": [],
                "certificate": [],
                "other": [],
            },
            "responsibilities": [],
        }
