/**
 * Jest Unit Tests for Job Analysis AI Module
 * Using ESM-compatible approach
 *
 * Note: Console suppression and env defaults are in /tests/setup.js
 */

import { jest } from "@jest/globals";

// Mock the generateContent function
const mockGenerateContent = jest.fn();

// Mock the @google/genai module using unstable_mockModule for ESM
jest.unstable_mockModule("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

// Mock dotenv
jest.unstable_mockModule("dotenv", () => ({
  default: { config: jest.fn() },
  config: jest.fn(),
}));

// Import AFTER setting up mocks (required for ESM)
const { analyzeJob } = await import("../src/job_analysis.js");

const { mockJobDescriptions, expectedResults } = await import("./fixtures.js");

// Helper to mock Gemini API responses
function mockGeminiResponse(response) {
  mockGenerateContent.mockResolvedValue({
    text: response,
  });
}

// Helper to reset mocks between tests
function resetMocks() {
  mockGenerateContent.mockClear();
}

describe("Job Analysis Module", () => {
  beforeEach(() => {
    resetMocks();
    // Set up environment variables
    process.env.GEMINI_API_KEY = "test-api-key";
    process.env.GEMINI_MODEL_NAME = "test-model";
  });

  describe("analyzeJob function", () => {
    test("should throw error for invalid JSON", async () => {
      await expect(analyzeJob("invalid json")).rejects.toThrow(
        "Invalid JSON for batch analysis",
      );
    });

    test("should throw error for non-array input", async () => {
      await expect(analyzeJob(JSON.stringify({}))).rejects.toThrow(
        "jobs.map is not a function",
      );
    });

    test("should process empty array", async () => {
      const result = await analyzeJob(JSON.stringify([]));

      expect(result).toEqual([]);
    });

    test("should process batch of jobs with unified analysis", async () => {
      const mockResponse = JSON.stringify([
        {
          id: 0,
          job_type: "full-time",
          language: { required: ["English"], advantage: [] },
          experience_level: "junior",
          education_level: "bachelor",
          skill_type: {
            technical: ["JavaScript"],
            domain_specific: [],
            certifications: [],
            soft_skills: [],
            other: [],
          },
          responsibilities: ["Design software", "Write code"],
        },
      ]);
      mockGeminiResponse(mockResponse);

      const jobs = [
        {
          title: "Test Job",
          company: "Test Company",
          description: mockJobDescriptions.softwareEngineer,
        },
      ];

      const result = await analyzeJob(JSON.stringify(jobs));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty("job_type", "full-time");
      expect(result[0]).toHaveProperty("language");
      expect(result[0]).toHaveProperty("experience_level", "junior");
      expect(result[0]).toHaveProperty("education_level", "bachelor");
      expect(result[0]).toHaveProperty("skill_type");
      expect(result[0]).toHaveProperty("responsibilities");
    });

    test("should handle API errors gracefully", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      const jobs = [
        {
          title: "Test Job",
          company: "Test Company",
          description: mockJobDescriptions.softwareEngineer,
        },
      ];

      const result = await analyzeJob(JSON.stringify(jobs));

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("_error", "API Error");
    });

    test("should handle invalid JSON response", async () => {
      mockGeminiResponse("Invalid JSON response");

      const jobs = [
        {
          title: "Test Job",
          company: "Test Company",
          description: mockJobDescriptions.softwareEngineer,
        },
      ];

      const result = await analyzeJob(JSON.stringify(jobs));

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("_error");
    });
  });

  describe("Integration tests", () => {
    test("should analyze complete job description with unified batch", async () => {
      // Mock unified batch response
      const mockResponse = JSON.stringify([
        {
          id: 0,
          job_type: "full-time",
          language: { required: ["English"], advantage: [] },
          experience_level: "junior",
          education_level: "bachelor",
          skill_type: {
            technical: ["JavaScript"],
            domain_specific: [],
            certifications: [],
            soft_skills: [],
            other: [],
          },
          responsibilities: ["Design software", "Write code"],
        },
      ]);

      mockGeminiResponse(mockResponse);

      const job = {
        title: "Software Engineer",
        company: "Tech Corp",
        description: mockJobDescriptions.softwareEngineer,
      };

      const result = await analyzeJob(JSON.stringify([job]));

      expect(result[0]).toHaveProperty("job_type", "full-time");
      expect(result[0]).toHaveProperty("language");
      expect(result[0]).toHaveProperty("experience_level", "junior");
      expect(result[0]).toHaveProperty("education_level", "bachelor");
      expect(result[0]).toHaveProperty("skill_type");
      expect(result[0]).toHaveProperty("responsibilities");
    });
  });
});
