import { rmSync, readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

function deleteIfExists(path) {
  try {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      rmSync(path, { recursive: true, force: true });
    } else {
      unlinkSync(path);
    }
  } catch (err) {
    // Ignore if not exists
  }
}

function deleteGlob(baseDir, pattern) {
  try {
    const items = readdirSync(baseDir);
    for (const item of items) {
      const fullPath = join(baseDir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          const targetPath = join(fullPath, pattern);
          deleteIfExists(targetPath);
        }
      } catch (err) {
        // Ignore individual item errors
      }
    }
  } catch (err) {
    // Ignore if baseDir not exists
  }
}

function deleteMatchingFiles(dir, prefix, suffix) {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      if (item.startsWith(prefix) && item.endsWith(suffix)) {
        unlinkSync(join(dir, item));
      }
    }
  } catch (err) {
    // Ignore
  }
}

function deleteDirContents(dir) {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      deleteIfExists(join(dir, item));
    }
  } catch (err) {
    // Ignore
  }
}

// Delete apps/*/node_modules
deleteGlob("apps", "node_modules");

// Delete packages/*/node_modules
deleteGlob("packages", "node_modules");

// Delete root directories
deleteIfExists("node_modules");
deleteIfExists("dist");
deleteIfExists(".next");
deleteIfExists(".turbo");

// Delete bun-debug.log* files
deleteMatchingFiles(".", "bun-debug", ".log");

// Delete contents of apps/scraper-py/logs/
deleteDirContents("apps/scraper-py/logs");

// Delete contents of packages/db/data/translated/
deleteDirContents("packages/db/data/translated");

console.log("Clean completed");
