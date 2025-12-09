/**
 * Jest Unit Tests for Translator Module
 * Tests translation pipeline, MongoDB operations, and field translation
 */

import { jest } from "@jest/globals";

// Mock mongoose
const mockFindOneAndUpdate = jest.fn();
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.unstable_mockModule("mongoose", () => ({
  default: {
    connect: mockConnect,
    disconnect: mockDisconnect,
    connection: { readyState: 0 },
    model: jest.fn(() => ({
      findOneAndUpdate: mockFindOneAndUpdate,
    })),
    Schema: jest.fn().mockImplementation(() => ({
      index: jest.fn(),
      plugin: jest.fn(),
      Types: {
        ObjectId: jest.fn(),
      },
    })),
  },
}));

// Mock the GoogleGenAI
const mockGenerateContent = jest.fn();

jest.unstable_mockModule("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

// Mock fs/promises for pipeline file reading
const mockReaddir = jest.fn();
const mockReadFile = jest.fn();
const mockMkdir = jest.fn();
const mockWriteFile = jest.fn();

jest.unstable_mockModule("fs/promises", () => ({
  default: {
    readdir: mockReaddir,
    readFile: mockReadFile,
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
  },
  readdir: mockReaddir,
  readFile: mockReadFile,
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
}));

// Mock OriginalJob model
const mockFind = jest.fn();
jest.unstable_mockModule("../../db/src/models/OriginalJob.js", () => ({
  default: {
    find: mockFind,
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

// Mock TranslatedJob model
const mockGetUntranslatedJobs = jest.fn();
jest.unstable_mockModule("../../db/src/models/TranslatedJob.js", () => ({
  default: {
    getUntranslatedJobs: mockGetUntranslatedJobs,
  },
}));

// Mock dotenv
jest.unstable_mockModule("dotenv", () => ({
  default: { config: jest.fn() },
  config: jest.fn(),
}));

// Import AFTER setting up mocks
const { TARGET_LANGUAGES, runTranslation } = await import(
  "../src/translator.js"
);

// Sample job data for testing
const sampleJob = {
  title: "Software Engineer",
  company: "Tech Corp",
  location: "Helsinki, Finland",
  industry_category: "Technology",
  job_type: ["Full-time", "Remote"],
  language: {
    required: ["English", "Finnish"],
    advantage: ["Swedish"],
  },
  experience_level: "Mid-level",
  education_level: ["Bachelor's degree"],
  skill_type: {
    technical: ["JavaScript", "Python"],
    domain_specific: ["Web Development"],
    certifications: ["AWS Certified"],
    soft_skills: ["Communication"],
    other: [],
  },
  responsibilities: ["Design systems", "Write code"],
};

// Helper to mock Gemini translation response
function mockTranslationResponse(translatedText) {
  mockGenerateContent.mockResolvedValue({
    text: translatedText,
  });
}

// Helper to reset mocks
function resetMocks() {
  mockGenerateContent.mockClear();
  mockFindOneAndUpdate.mockClear();
  mockConnect.mockClear();
}

describe("Translator Module", () => {
  beforeEach(() => {
    resetMocks();
    process.env.GEMINI_API_KEY = "test-api-key";
    process.env.GEMINI_MODEL_NAME = "gemini-2.0-flash";
  });

  describe("TARGET_LANGUAGES", () => {
    it("should not include English (source language)", () => {
      expect(TARGET_LANGUAGES).not.toContain("en");
    });

    it("should include expected languages", () => {
      expect(TARGET_LANGUAGES).toEqual(["es", "zh"]);
    });
  });

  describe("runTranslation", () => {
    it("should run the translation pipeline successfully", async () => {
      // Mock database connection
      mockConnect.mockResolvedValue();
      mockDisconnect.mockResolvedValue();

      // Mock finding jobs in database
      mockFind.mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          { ...sampleJob, _id: "job1" },
          { ...sampleJob, _id: "job2" },
        ]),
      });

      // Mock successful API response for batch translation
      const mockResponse = JSON.stringify([
        {
          id: 0,
          title: "Ingeniero de Software",
          industry: "Tecnología",
          type: "Tiempo completo",
          exp: "Junior",
          edu: "Licenciatura",
          resp: ["Diseñar sistemas"],
          skills: {
            technical: ["JavaScript"],
            domain_specific: [],
            certifications: [],
            soft_skills: [],
            other: [],
          },
        },
        {
          id: 1,
          title: "Ingeniero de Software 2",
          industry: "Tecnología",
          type: "Tiempo completo",
          exp: "Junior",
          edu: "Licenciatura",
          resp: ["Desarrollar aplicaciones"],
          skills: {
            technical: ["Python"],
            domain_specific: [],
            certifications: [],
            soft_skills: [],
            other: [],
          },
        },
      ]);
      mockTranslationResponse(mockResponse);

      // Mock file system operations
      mockReaddir.mockResolvedValue([]);
      mockMkdir.mockResolvedValue();
      mockWriteFile.mockResolvedValue();

      const result = await runTranslation();

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("outputFile");
      expect(mockConnect).toHaveBeenCalled();
    });

    it("should handle no jobs found", async () => {
      mockConnect.mockResolvedValue();
      mockDisconnect.mockResolvedValue();

      mockFind.mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      });

      const result = await runTranslation();

      expect(result.success).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should handle database connection errors", async () => {
      mockConnect.mockRejectedValue(new Error("DB Connection Failed"));

      await expect(runTranslation()).rejects.toThrow("DB Connection Failed");
    });
  });
});
