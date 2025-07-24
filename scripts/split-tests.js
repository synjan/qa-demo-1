#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Split tests into groups for parallel execution
 * This helps distribute tests evenly across CI runners
 */

// Configuration
const config = {
  testDirs: ['src', 'e2e-tests'],
  testPatterns: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
  outputDir: '.test-splits',
  defaultGroups: 4,
};

// Get number of groups from environment or use default
const totalGroups = parseInt(process.env.TOTAL_GROUPS || config.defaultGroups);

// Initialize groups
const groups = Array(totalGroups).fill(null).map(() => ({
  tests: [],
  estimatedDuration: 0,
}));

// Test metadata (this could be loaded from previous runs)
const testMetadata = loadTestMetadata();

// Find all test files
const testFiles = findTestFiles();

console.log(`Found ${testFiles.length} test files`);
console.log(`Splitting into ${totalGroups} groups...`);

// Sort tests by estimated duration (longest first)
testFiles.sort((a, b) => {
  const durationA = testMetadata[a]?.averageDuration || 1000;
  const durationB = testMetadata[b]?.averageDuration || 1000;
  return durationB - durationA;
});

// Distribute tests using bin packing algorithm
testFiles.forEach(testFile => {
  const duration = testMetadata[testFile]?.averageDuration || 1000;
  
  // Find group with least total duration
  let minGroup = groups[0];
  let minDuration = groups[0].estimatedDuration;
  
  for (let i = 1; i < groups.length; i++) {
    if (groups[i].estimatedDuration < minDuration) {
      minGroup = groups[i];
      minDuration = groups[i].estimatedDuration;
    }
  }
  
  // Add test to group
  minGroup.tests.push(testFile);
  minGroup.estimatedDuration += duration;
});

// Create output directory
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Write group files
groups.forEach((group, index) => {
  const groupFile = path.join(config.outputDir, `group-${index + 1}.json`);
  const groupData = {
    groupId: index + 1,
    totalGroups,
    tests: group.tests,
    estimatedDuration: group.estimatedDuration,
    testCount: group.tests.length,
  };
  
  fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
  
  console.log(`Group ${index + 1}: ${group.tests.length} tests, ~${Math.round(group.estimatedDuration / 1000)}s`);
});

// Generate GitHub Actions matrix
if (process.env.GITHUB_OUTPUT) {
  const matrix = {
    group: Array(totalGroups).fill(null).map((_, i) => i + 1),
  };
  
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `matrix=${JSON.stringify(matrix)}\n`
  );
}

// Helper functions

function findTestFiles() {
  const files = [];
  
  config.testDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      findTestFilesRecursive(dir, files);
    }
  });
  
  return files;
}

function findTestFilesRecursive(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findTestFilesRecursive(fullPath, files);
    } else if (entry.isFile()) {
      const isTestFile = config.testPatterns.some(pattern => {
        const regex = new RegExp(pattern.replace('**/', '.*').replace('*', '[^/]*'));
        return regex.test(fullPath);
      });
      
      if (isTestFile) {
        files.push(fullPath);
      }
    }
  });
}

function loadTestMetadata() {
  const metadataFile = path.join(config.outputDir, 'test-metadata.json');
  
  if (fs.existsSync(metadataFile)) {
    try {
      return JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
    } catch (error) {
      console.warn('Failed to load test metadata:', error);
    }
  }
  
  // Return default metadata
  return {
    // Estimate based on file patterns
    '**/smoke.spec.ts': { averageDuration: 5000 },
    '**/critical-*.spec.ts': { averageDuration: 8000 },
    '**/*.test.ts': { averageDuration: 1000 },
    '**/*.spec.ts': { averageDuration: 3000 },
    '**/slow-*.spec.ts': { averageDuration: 15000 },
    '**/performance-*.spec.ts': { averageDuration: 20000 },
  };
}

// Export for use in other scripts
module.exports = {
  findTestFiles,
  loadTestMetadata,
};