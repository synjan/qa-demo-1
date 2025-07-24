import fs from 'fs/promises';
import path from 'path';
import { 
  saveTestCase, 
  loadTestCase, 
  loadAllTestCases,
  deleteTestCase,
  saveTestPlan,
  loadTestPlan,
  loadAllTestPlans,
  deleteTestPlan,
  saveTestRun,
  loadTestRun,
  loadAllTestRuns,
  deleteTestRun,
  exportTestResults,
  calculateTestRunStats
} from '../file-utils';
import { TestCase, TestPlan, TestRun, TestResult } from '../types';

// Mock fs module
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn()
}));

describe('file-utils', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TestCase operations', () => {
    const mockTestCase: TestCase = {
      id: 'tc-123',
      title: 'Test Case',
      description: 'Test description',
      preconditions: 'None',
      steps: [{
        id: 'step-1',
        stepNumber: 1,
        action: 'Click button',
        expectedResult: 'Page loads'
      }],
      expectedResult: 'Success',
      priority: 'high',
      tags: ['ui', 'regression'],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      createdBy: 'testuser'
    };

    describe('saveTestCase', () => {
      it('should save a test case as markdown', async () => {
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);

        await saveTestCase(mockTestCase);

        expect(mockFs.mkdir).toHaveBeenCalledWith(
          expect.stringContaining('testcases'),
          { recursive: true }
        );

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining('tc-123.md'),
          expect.stringContaining('title: Test Case'),
          'utf-8'
        );
      });

      it('should handle errors when saving', async () => {
        mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

        await expect(saveTestCase(mockTestCase)).rejects.toThrow('Permission denied');
      });
    });

    describe('loadTestCase', () => {
      it('should load a test case from markdown', async () => {
        const markdownContent = `---
title: Test Case
description: Test description
priority: high
tags:
  - ui
  - regression
id: tc-123
createdAt: '2023-01-01T00:00:00Z'
updatedAt: '2023-01-01T00:00:00Z'
createdBy: testuser
---

## Preconditions
None

## Steps
1. **Click button**
   - Expected: Page loads

## Expected Result
Success`;

        mockFs.readFile.mockResolvedValue(markdownContent);

        const testCase = await loadTestCase('tc-123');

        expect(testCase).toMatchObject({
          id: 'tc-123',
          title: 'Test Case',
          description: 'Test description',
          priority: 'high',
          tags: ['ui', 'regression']
        });
      });

      it('should return null if file not found', async () => {
        mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });

        const testCase = await loadTestCase('non-existent');

        expect(testCase).toBeNull();
      });
    });

    describe('loadAllTestCases', () => {
      it('should load all test cases', async () => {
        mockFs.readdir.mockResolvedValue(['tc-1.md', 'tc-2.md', 'not-md.txt'] as any);
        mockFs.readFile.mockResolvedValue(`---
title: Test
---
Content`);

        const testCases = await loadAllTestCases();

        expect(testCases).toHaveLength(2);
        expect(mockFs.readFile).toHaveBeenCalledTimes(2);
      });

      it('should handle errors and continue loading', async () => {
        mockFs.readdir.mockResolvedValue(['tc-1.md', 'tc-2.md'] as any);
        mockFs.readFile
          .mockRejectedValueOnce(new Error('Read error'))
          .mockResolvedValueOnce(`---
title: Test 2
---
Content`);

        const testCases = await loadAllTestCases();

        expect(testCases).toHaveLength(1);
      });
    });

    describe('deleteTestCase', () => {
      it('should delete a test case file', async () => {
        mockFs.unlink.mockResolvedValue(undefined);

        await deleteTestCase('tc-123');

        expect(mockFs.unlink).toHaveBeenCalledWith(
          expect.stringContaining('tc-123.md')
        );
      });

      it('should handle file not found', async () => {
        mockFs.unlink.mockRejectedValue({ code: 'ENOENT' });

        // Should not throw for ENOENT
        await expect(deleteTestCase('non-existent')).resolves.not.toThrow();
      });
    });
  });

  describe('TestPlan operations', () => {
    const mockTestPlan: TestPlan = {
      id: 'tp-123',
      name: 'Test Plan',
      description: 'Plan description',
      testCaseIds: ['tc-1', 'tc-2'],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      createdBy: 'testuser'
    };

    describe('saveTestPlan', () => {
      it('should save a test plan as JSON', async () => {
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);

        await saveTestPlan(mockTestPlan);

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining('tp-123.json'),
          JSON.stringify(mockTestPlan, null, 2),
          'utf-8'
        );
      });
    });

    describe('loadTestPlan', () => {
      it('should load a test plan from JSON', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(mockTestPlan));

        const testPlan = await loadTestPlan('tp-123');

        expect(testPlan).toEqual(mockTestPlan);
      });

      it('should return null if file not found', async () => {
        mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });

        const testPlan = await loadTestPlan('non-existent');

        expect(testPlan).toBeNull();
      });
    });
  });

  describe('TestRun operations', () => {
    const mockTestRun: TestRun = {
      id: 'tr-123',
      testPlanId: 'tp-123',
      status: 'in_progress',
      results: [],
      startedAt: '2023-01-01T00:00:00Z',
      completedAt: null,
      executedBy: 'testuser'
    };

    describe('saveTestRun', () => {
      it('should save a test run as JSON', async () => {
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);

        await saveTestRun(mockTestRun);

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          expect.stringContaining('tr-123.json'),
          JSON.stringify(mockTestRun, null, 2),
          'utf-8'
        );
      });
    });
  });

  describe('calculateTestRunStats', () => {
    it('should calculate stats correctly', () => {
      const results: TestResult[] = [
        { testCaseId: 'tc-1', status: 'passed', executedAt: '', executedBy: '' },
        { testCaseId: 'tc-2', status: 'failed', executedAt: '', executedBy: '' },
        { testCaseId: 'tc-3', status: 'passed', executedAt: '', executedBy: '' },
        { testCaseId: 'tc-4', status: 'skipped', executedAt: '', executedBy: '' },
        { testCaseId: 'tc-5', status: 'blocked', executedAt: '', executedBy: '' }
      ];

      const stats = calculateTestRunStats(results);

      expect(stats).toEqual({
        total: 5,
        passed: 2,
        failed: 1,
        skipped: 1,
        blocked: 1,
        passRate: 40
      });
    });

    it('should handle empty results', () => {
      const stats = calculateTestRunStats([]);

      expect(stats).toEqual({
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        blocked: 0,
        passRate: 0
      });
    });
  });

  describe('exportTestResults', () => {
    it('should export results with test case details', async () => {
      const mockTestRun: TestRun = {
        id: 'tr-123',
        testPlanId: 'tp-123',
        status: 'completed',
        results: [
          { testCaseId: 'tc-1', status: 'passed', executedAt: '2023-01-01', executedBy: 'user' }
        ],
        startedAt: '2023-01-01T00:00:00Z',
        completedAt: '2023-01-01T01:00:00Z',
        executedBy: 'testuser'
      };

      const mockTestCase = {
        id: 'tc-1',
        title: 'Test 1',
        priority: 'high' as const
      };

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify({
        name: 'Test Plan'
      }));
      
      jest.spyOn(require('../file-utils'), 'loadTestCase').mockResolvedValue(mockTestCase as any);

      const result = await exportTestResults(mockTestRun);

      expect(result).toContain('Test Plan');
      expect(result).toContain('Test 1');
      expect(result).toContain('Passed');
    });
  });
});