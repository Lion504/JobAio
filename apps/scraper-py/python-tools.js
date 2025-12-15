#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

const isWindows =
  process.platform === "win32" || process.env.OS === "Windows_NT";
const pythonCmd = isWindows ? "python.exe" : "python3";
const venvDir = "venv";
const scriptsDir = isWindows ? "Scripts" : "bin";
const pythonPath = path.join(venvDir, scriptsDir, pythonCmd);

const command = process.argv[2];

function runCommand(cmd, description) {
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`${description} complete!`);
  } catch (error) {
    console.error(`Error during ${description}:`, error.message);
    process.exit(1);
  }
}

switch (command) {
  case "setup":
    console.log("Setting up Python virtual environment...");
    runCommand(
      `${pythonCmd} -m venv ${venvDir}`,
      "Virtual environment creation"
    );
    runCommand(`"${pythonPath}" -m pip install --upgrade pip`, "Pip upgrade");
    runCommand(
      `"${pythonPath}" -m pip install --only-binary=all -r requirements.txt`,
      "Package installation"
    );
    break;

  case "lint":
    console.log("Running Python linting...");
    runCommand(`"${pythonPath}" -m flake8 src/`, "Flake8 linting");
    runCommand(
      `"${pythonPath}" -m black --check src/`,
      "Black format checking"
    );
    runCommand(
      `"${pythonPath}" -m isort --check-only src/`,
      "Isort import checking"
    );
    break;

  case "lint:fix":
    console.log("Running Python lint fixing...");
    runCommand(`"${pythonPath}" -m black src/`, "Black formatting");
    runCommand(`"${pythonPath}" -m isort src/`, "Isort import fixing");
    break;

  case "format":
    console.log("Running Python formatting...");
    runCommand(`"${pythonPath}" -m black src/`, "Black formatting");
    break;

  case "format:check":
    console.log("Running Python format checking...");
    runCommand(
      `"${pythonPath}" -m black --check src/`,
      "Black format checking"
    );
    break;

  default:
    console.log("Usage: node python-tools.js <command>");
    console.log("Commands: setup, lint, lint:fix, format, format:check");
    process.exit(1);
}
