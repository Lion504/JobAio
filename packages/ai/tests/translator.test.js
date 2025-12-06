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

jest.unstable_mockModule("fs/promises", () => ({
  default: {
    readdir: mockReaddir,
    readFile: mockReadFile,
  },
  readdir: mockReaddir,
  readFile: mockReadFile,
}));

// Mock OriginalJob model
jest.unstable_mockModule("../../db/src/models/OriginalJob.js", () => ({
  default: {
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

// Mock dotenv
jest.unstable_mockModule("dotenv", () => ({
  default: { config: jest.fn() },
  config: jest.fn(),
}));

// Import AFTER setting up mocks
const {
  TARGET_LANGUAGES,
  translateJob,
  translateJobToLanguage,
  connectDB,
  disconnectDB,
} = await import("../src/translator.js");

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

  describe("translateJobToLanguage", () => {
    it("should translate job title to target language", async () => {
      mockTranslationResponse("Ingeniero de Software");

      const result = await translateJobToLanguage(sampleJob, "es");

      expect(result.lang).toBe("es");
      expect(result.title).toBe("Ingeniero de Software");
    });

    it("should include all required fields in translation", async () => {
      mockTranslationResponse("Translated text");

      const result = await translateJobToLanguage(sampleJob, "fr");

      expect(result).toHaveProperty("lang");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("industry_category");
      expect(result).toHaveProperty("job_type");
      expect(result).toHaveProperty("language");
      expect(result).toHaveProperty("skill_type");
      expect(result).toHaveProperty("translated_at");
    });

    it("should NOT include description fields (lean translation)", async () => {
      mockTranslationResponse("Translated");

      const result = await translateJobToLanguage(sampleJob, "de");

      expect(result).not.toHaveProperty("description");
      expect(result).not.toHaveProperty("url");
      expect(result).not.toHaveProperty("company");
    });

    it("should set translated_at timestamp", async () => {
      mockTranslationResponse("Translated");

      const before = new Date();
      const result = await translateJobToLanguage(sampleJob, "ta");

      expect(result.translated_at).toBeInstanceOf(Date);
      expect(result.translated_at.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe("translateJob", () => {
    it("should translate job to all target languages", async () => {
      mockTranslationResponse("Translated");

      const translations = await translateJob(sampleJob);

      expect(translations.length).toBe(TARGET_LANGUAGES.length);
    });

    it("should include all target languages", async () => {
      mockTranslationResponse("Translated");

      const translations = await translateJob(sampleJob);
      const langs = translations.map((t) => t.lang);

      for (const targetLang of TARGET_LANGUAGES) {
        expect(langs).toContain(targetLang);
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle empty arrays gracefully", async () => {
      mockTranslationResponse("Translated");

      const jobWithEmptyArrays = {
        ...sampleJob,
        job_type: [],
        responsibilities: [],
      };

      const result = await translateJobToLanguage(jobWithEmptyArrays, "es");

      expect(result.job_type).toEqual([]);
    });

    it("should handle null fields gracefully", async () => {
      mockTranslationResponse("Translated");

      const jobWithNulls = {
        ...sampleJob,
        industry_category: null,
      };

      const result = await translateJobToLanguage(jobWithNulls, "fr");

      expect(result.industry_category).toBeNull();
    });
  });

  describe("Response cleaning", () => {
    it("should clean markdown code blocks from response", async () => {
      mockGenerateContent.mockResolvedValue({
        text: "```json\nTranslated text\n```",
      });

      const result = await translateJobToLanguage(sampleJob, "es");

      expect(result.title).not.toContain("```");
    });
  });
});
