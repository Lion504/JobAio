"""
Job Analyzer Package

Provides rule-based and AI-enhanced job description analysis.
"""

__version__ = "1.0.0"

from .ai_analyzer import HybridJobAnalyzer
from .base_analyzer import BaseJobAnalyzer

__all__ = ["BaseJobAnalyzer", "HybridJobAnalyzer"]
