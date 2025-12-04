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
const {
  analyzeJob,
  analyzeJobType,
  analyzeLanguage,
  analyzeExperienceLevel,
  analyzeEducationLevel,
  analyzeSkills,
  analyzeResponsibilities,
} = await import("../src/job_analysis.js");

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

  describe("analyzeJobType", () => {
    test("should identify full-time job", async () => {
      mockGeminiResponse("full-time");

      const result = await analyzeJobType(mockJobDescriptions.softwareEngineer);

      expect(result).toHaveProperty("job_type");
      expect(result.job_type).toBe("full-time");
      expect(result).not.toHaveProperty("error");
    });

    test("should identify internship", async () => {
      mockGeminiResponse("internship");

      const result = await analyzeJobType(mockJobDescriptions.internship);

      expect(result.job_type).toBe("internship");
    });

    test("should identify part-time job", async () => {
      mockGeminiResponse("part-time");

      const result = await analyzeJobType(mockJobDescriptions.partTimeSupport);

      expect(result.job_type).toBe("part-time");
    });

    test("should return unknown for invalid response", async () => {
      mockGeminiResponse("invalid-type");

      const result = await analyzeJobType(mockJobDescriptions.softwareEngineer);

      expect(result.job_type).toBe("unknown");
    });

    test("should handle API errors", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      const result = await analyzeJobType(mockJobDescriptions.softwareEngineer);

      expect(result.job_type).toBe("unknown");
      expect(result).toHaveProperty("error");
    });
  });

  describe("analyzeLanguage", () => {
    test("should extract required and advantage languages", async () => {
      mockGeminiResponse(
        '{"required": ["English", "Finnish"], "advantage": ["Swedish"]}',
      );

      const result = await analyzeLanguage(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result).toHaveProperty("languages");
      expect(result.languages).toHaveProperty("required");
      expect(result.languages).toHaveProperty("advantage");
      expect(Array.isArray(result.languages.required)).toBe(true);
      expect(Array.isArray(result.languages.advantage)).toBe(true);
    });

    test("should handle JSON parsing errors", async () => {
      mockGeminiResponse("Invalid JSON response");

      const result = await analyzeLanguage(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result.languages.required).toEqual([]);
      expect(result.languages.advantage).toEqual([]);
    });

    test("should handle API errors", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      const result = await analyzeLanguage(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result.languages.required).toEqual([]);
      expect(result.languages.advantage).toEqual([]);
    });
  });

  describe("analyzeExperienceLevel", () => {
    test("should identify junior level", async () => {
      mockGeminiResponse("junior");

      const result = await analyzeExperienceLevel(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result).toHaveProperty("level");
      expect(result.level).toBe("junior");
    });

    test("should identify student level", async () => {
      mockGeminiResponse("student");

      const result = await analyzeExperienceLevel(
        mockJobDescriptions.juniorDeveloper,
      );

      expect(result.level).toBe("student");
    });

    test("should identify senior level", async () => {
      mockGeminiResponse("senior");

      const result = await analyzeExperienceLevel(
        mockJobDescriptions.seniorDataScientist,
      );

      expect(result.level).toBe("senior");
    });

    test("should return unknown for invalid response", async () => {
      mockGeminiResponse("invalid-level");

      const result = await analyzeExperienceLevel(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result.level).toBe("unknown");
    });
  });

  describe("analyzeEducationLevel", () => {
    test("should identify bachelor level", async () => {
      mockGeminiResponse("bachelor");

      const result = await analyzeEducationLevel(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result).toHaveProperty("education_level");
      expect(result.education_level).toBe("bachelor");
    });

    test("should identify master level", async () => {
      mockGeminiResponse("master");

      const result = await analyzeEducationLevel(
        mockJobDescriptions.seniorDataScientist,
      );

      expect(result.education_level).toBe("master");
    });

    test("should identify vocational level", async () => {
      mockGeminiResponse("vocational");

      const result = await analyzeEducationLevel(
        mockJobDescriptions.partTimeSupport,
      );

      expect(result.education_level).toBe("vocational");
    });

    test("should return unknown for invalid response", async () => {
      mockGeminiResponse("invalid-education");

      const result = await analyzeEducationLevel(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result.education_level).toBe("unknown");
    });
  });

  describe("analyzeSkills", () => {
    test("should extract skills in correct categories", async () => {
      const mockSkillsResponse = JSON.stringify({
        technical: ["JavaScript", "Node.js"],
        domain_specific: ["Agile"],
        certifications: ["AWS Certified"],
        soft_skills: ["Communication"],
        other: ["Docker"],
      });
      mockGeminiResponse(mockSkillsResponse);

      const result = await analyzeSkills(mockJobDescriptions.softwareEngineer);

      expect(result).toHaveProperty("skills");
      expect(result.skills).toHaveProperty("technical");
      expect(result.skills).toHaveProperty("domain_specific");
      expect(result.skills).toHaveProperty("certifications");
      expect(result.skills).toHaveProperty("soft_skills");
      expect(result.skills).toHaveProperty("other");
      expect(Array.isArray(result.skills.technical)).toBe(true);
    });

    test("should handle invalid JSON response", async () => {
      mockGeminiResponse("Invalid JSON skills response");

      const result = await analyzeSkills(mockJobDescriptions.softwareEngineer);

      expect(result).toHaveProperty("skills");
      expect(result).toHaveProperty("raw_response");
      expect(result.skills.technical).toEqual([]);
    });

    test("should handle API errors", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      const result = await analyzeSkills(mockJobDescriptions.softwareEngineer);

      expect(result).toHaveProperty("skills");
      expect(result).toHaveProperty("error");
      expect(result.skills.technical).toEqual([]);
    });
  });

  describe("analyzeResponsibilities", () => {
    test("should extract responsibilities as array", async () => {
      const mockRespResponse = JSON.stringify([
        "Design software solutions",
        "Collaborate with teams",
        "Write clean code",
      ]);
      mockGeminiResponse(mockRespResponse);

      const result = await analyzeResponsibilities(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result).toHaveProperty("responsibilities");
      expect(Array.isArray(result.responsibilities)).toBe(true);
      expect(result.responsibilities.length).toBeGreaterThan(0);
    });

    test("should handle text response fallback", async () => {
      mockGeminiResponse(
        "1. Design software\n2. Test code\n3. Deploy application",
      );

      const result = await analyzeResponsibilities(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result).toHaveProperty("responsibilities");
      expect(Array.isArray(result.responsibilities)).toBe(true);
    });

    test("should limit to 10 responsibilities", async () => {
      const manyResponsibilities = Array.from(
        { length: 15 },
        (_, i) => `Responsibility ${i + 1}`,
      );
      mockGeminiResponse(JSON.stringify(manyResponsibilities));

      const result = await analyzeResponsibilities(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result.responsibilities.length).toBeLessThanOrEqual(10);
    });

    test("should handle API errors", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      const result = await analyzeResponsibilities(
        mockJobDescriptions.softwareEngineer,
      );

      expect(result.responsibilities).toEqual([]);
      expect(result).toHaveProperty("error");
    });
  });

  describe("analyzeJob (batch function)", () => {
    test("should throw error for non-batch function names", async () => {
      await expect(analyzeJob("job_type", "test description")).rejects.toThrow(
        "Only batch analysis is supported",
      );
    });

    test("should throw error for invalid JSON", async () => {
      await expect(analyzeJob("batch", "invalid json")).rejects.toThrow(
        "Invalid JSON for batch analysis",
      );
    });

    test("should throw error for non-array input", async () => {
      await expect(analyzeJob("batch", JSON.stringify({}))).rejects.toThrow(
        "Batch analysis requires array of jobs",
      );
    });

    test("should process empty array", async () => {
      const result = await analyzeJob("batch", JSON.stringify([]));

      expect(result).toEqual([]);
    });

    test("should process batch of jobs", async () => {
      // Mock all the batch functions
      mockGeminiResponse("full-time");

      const jobs = [
        {
          title: "Test Job",
          company: "Test Company",
          description: mockJobDescriptions.softwareEngineer,
        },
      ];

      const result = await analyzeJob("batch", JSON.stringify(jobs));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty("job_type");
    });
  });

  describe("Integration tests", () => {
    test("should analyze complete job description", async () => {
      // Mock all responses for a complete analysis
      const mockResponses = [
        "full-time",
        '{"required": ["English"], "advantage": []}',
        "junior",
        "bachelor",
        JSON.stringify({
          technical: ["JavaScript"],
          domain_specific: [],
          certifications: [],
          soft_skills: [],
          other: [],
        }),
        JSON.stringify(["Design software", "Write code"]),
      ];

      let responseIndex = 0;
      mockGenerateContent.mockImplementation(() =>
        Promise.resolve({ text: mockResponses[responseIndex++] }),
      );

      const job = {
        title: "Software Engineer",
        company: "Tech Corp",
        description: mockJobDescriptions.softwareEngineer,
      };

      const result = await analyzeJob("batch", JSON.stringify([job]));

      expect(result[0]).toHaveProperty("job_type");
      expect(result[0]).toHaveProperty("language");
      expect(result[0]).toHaveProperty("experience_level");
      expect(result[0]).toHaveProperty("education_level");
      expect(result[0]).toHaveProperty("skill_type");
      expect(result[0]).toHaveProperty("responsibilities");
    });
  });
});
