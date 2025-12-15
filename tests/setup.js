/**
 * Jest Global Setup for JobAio
 * This file runs before all test files
 *
 * Note: In ES module environment, we need to import Jest globals explicitly.
 */

import { jest, beforeAll, afterAll } from "@jest/globals";

// ============================================
// Console Suppression
// ============================================
// Suppress console.error and console.warn during tests
// These are expected in error handling tests
let consoleErrorSpy;
let consoleWarnSpy;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy?.mockRestore();
  consoleWarnSpy?.mockRestore();
});

// ============================================
// Environment Variables (Test Defaults)
// ============================================
// Set default test environment variables
// Individual tests can override these
process.env.NODE_ENV = "test";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-api-key";
process.env.GEMINI_MODEL_NAME =
  process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash";

// ============================================
// Global Test Timeout
// ============================================
// Increase timeout for API-related tests (10 seconds)
jest.setTimeout(10000);
