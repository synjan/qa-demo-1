import { TestCase, TestPlan, TestRun, GitHubRepository, GitHubIssue } from '@/lib/types';
import { TestDataGenerator, RandomGenerator } from './random.generator';
import { ScenarioGenerator } from './scenario.generator';

/**
 * Generate large amounts of test data for performance and stress testing
 */
export class BulkGenerator {
  /**
   * Generate multiple test cases with various configurations
   */
  static testCases(count: number, options?: {
    tagDistribution?: Record<string, number>;
    priorityDistribution?: Record<string, number>;
    withGitHubLinks?: boolean;
  }): TestCase[] {
    const {
      tagDistribution = { smoke: 0.1, regression: 0.6, edge: 0.3 },
      priorityDistribution = { high: 0.2, medium: 0.5, low: 0.3 },
      withGitHubLinks = false
    } = options || {};

    const testCases: TestCase[] = [];

    for (let i = 0; i < count; i++) {
      // Determine tags based on distribution
      const tags: string[] = [];
      Object.entries(tagDistribution).forEach(([tag, probability]) => {
        if (Math.random() < probability) {
          tags.push(tag);
        }
      });
      if (tags.length === 0) tags.push('general'); // Ensure at least one tag

      // Determine priority based on distribution
      let priority: 'low' | 'medium' | 'high' = 'medium';
      const priorityRoll = Math.random();
      let cumulative = 0;
      for (const [p, prob] of Object.entries(priorityDistribution)) {
        cumulative += prob;
        if (priorityRoll < cumulative) {
          priority = p as any;
          break;
        }
      }

      const testCase = TestDataGenerator.testCase({
        tags,
        priority,
        githubIssueNumber: withGitHubLinks ? RandomGenerator.number(1, 1000) : undefined,
        githubRepository: withGitHubLinks ? 
          `${RandomGenerator.gitHubUsername()}/${RandomGenerator.gitHubRepoName()}` : undefined
      });

      testCases.push(testCase);
    }

    return testCases;
  }

  /**
   * Generate test plans with realistic test case distributions
   */
  static testPlans(count: number, testCasePool: TestCase[]): TestPlan[] {
    const plans: TestPlan[] = [];

    for (let i = 0; i < count; i++) {
      const planType = RandomGenerator.number(0, 3);
      let name: string;
      let testCaseIds: string[];
      let tags: string[];

      switch (planType) {
        case 0: // Smoke test plan
          name = `Smoke Test Plan ${i + 1}`;
          tags = ['smoke', 'quick'];
          // Select 5-10 high priority test cases
          testCaseIds = testCasePool
            .filter(tc => tc.priority === 'high')
            .slice(0, RandomGenerator.number(5, 10))
            .map(tc => tc.id);
          break;

        case 1: // Feature test plan
          const feature = RandomGenerator.gitHubRepoName();
          name = `${feature} Feature Test Plan`;
          tags = ['feature', feature];
          // Select 10-20 test cases
          testCaseIds = testCasePool
            .slice(i * 15, i * 15 + RandomGenerator.number(10, 20))
            .map(tc => tc.id);
          break;

        case 2: // Regression test plan
          name = `Regression Test Plan Week ${i + 1}`;
          tags = ['regression', 'weekly'];
          // Select 20-50 test cases
          testCaseIds = testCasePool
            .filter(tc => tc.tags.includes('regression'))
            .slice(0, RandomGenerator.number(20, 50))
            .map(tc => tc.id);
          break;

        default: // Release test plan
          const version = `${RandomGenerator.number(1, 5)}.${RandomGenerator.number(0, 9)}.${RandomGenerator.number(0, 20)}`;
          name = `Release ${version} Test Plan`;
          tags = ['release', version];
          // Select varied test cases
          testCaseIds = testCasePool
            .sort(() => Math.random() - 0.5)
            .slice(0, RandomGenerator.number(30, 60))
            .map(tc => tc.id);
      }

      if (testCaseIds.length === 0) {
        // Fallback if no test cases match criteria
        testCaseIds = testCasePool.slice(0, 5).map(tc => tc.id);
      }

      plans.push(TestDataGenerator.testPlan({
        name,
        tags,
        testCaseIds
      }));
    }

    return plans;
  }

  /**
   * Generate test runs with realistic result distributions
   */
  static testRuns(count: number, testPlans: TestPlan[], testCases: TestCase[]): TestRun[] {
    const runs: TestRun[] = [];
    const testCaseMap = new Map(testCases.map(tc => [tc.id, tc]));

    for (let i = 0; i < count; i++) {
      const plan = testPlans[RandomGenerator.number(0, testPlans.length - 1)];
      const environment = RandomGenerator.boolean() ? 'staging' : 'production';
      
      // Determine test run outcome
      const outcomeRoll = Math.random();
      let passRate: number;
      
      if (outcomeRoll < 0.6) {
        // Successful run
        passRate = RandomGenerator.number(90, 100) / 100;
      } else if (outcomeRoll < 0.9) {
        // Partially successful
        passRate = RandomGenerator.number(70, 89) / 100;
      } else {
        // Failed run
        passRate = RandomGenerator.number(0, 69) / 100;
      }

      // Generate results for test cases in the plan
      const results = plan.testCaseIds
        .filter(id => testCaseMap.has(id))
        .map(testCaseId => {
          const roll = Math.random();
          let status: 'passed' | 'failed' | 'skipped';
          
          if (roll < passRate) {
            status = 'passed';
          } else if (roll < passRate + 0.1) {
            status = 'skipped';
          } else {
            status = 'failed';
          }

          return {
            testCaseId,
            status,
            actualResult: status === 'passed' 
              ? 'Test executed successfully'
              : status === 'skipped'
              ? 'Test skipped due to environment issues'
              : RandomGenerator.errorMessage(),
            executionTime: status === 'skipped' ? 0 : RandomGenerator.number(30, 600),
            executedBy: RandomGenerator.gitHubUsername(),
            executedAt: new Date(Date.now() - RandomGenerator.number(0, 7 * 24 * 60 * 60 * 1000)).toISOString()
          };
        });

      const isCompleted = Math.random() > 0.1; // 90% completed

      runs.push({
        id: `tr-bulk-${i}`,
        testPlanId: plan.id,
        name: `${plan.name} - Run ${i + 1}`,
        status: isCompleted ? 'completed' : 'in_progress',
        results: isCompleted ? results : results.slice(0, Math.floor(results.length * 0.7)),
        environment,
        startedAt: new Date(Date.now() - RandomGenerator.number(1, 48) * 60 * 60 * 1000).toISOString(),
        completedAt: isCompleted ? new Date().toISOString() : null,
        executedBy: RandomGenerator.gitHubUsername(),
        tags: [...plan.tags, environment],
        notes: passRate < 0.7 ? 'Multiple test failures detected' : ''
      });
    }

    return runs;
  }

  /**
   * Generate GitHub repositories
   */
  static gitHubRepositories(count: number): GitHubRepository[] {
    const repos: GitHubRepository[] = [];
    const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'Ruby'];
    const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause'];

    for (let i = 0; i < count; i++) {
      const owner = RandomGenerator.gitHubUsername();
      const name = RandomGenerator.gitHubRepoName();
      
      repos.push({
        id: RandomGenerator.number(1000000, 9999999),
        name,
        full_name: `${owner}/${name}`,
        private: Math.random() < 0.3,
        owner: {
          login: owner,
          avatar_url: `https://avatars.githubusercontent.com/u/${RandomGenerator.number(1, 1000000)}`
        },
        description: RandomGenerator.boolean() ? RandomGenerator.markdown().split('\n')[0] : null,
        html_url: `https://github.com/${owner}/${name}`,
        created_at: new Date(Date.now() - RandomGenerator.number(30, 365) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - RandomGenerator.number(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
        pushed_at: new Date(Date.now() - RandomGenerator.number(0, 7) * 24 * 60 * 60 * 1000).toISOString(),
        size: RandomGenerator.number(100, 100000),
        stargazers_count: Math.floor(Math.exp(RandomGenerator.number(0, 8))),
        watchers_count: Math.floor(Math.exp(RandomGenerator.number(0, 6))),
        forks_count: Math.floor(Math.exp(RandomGenerator.number(0, 5))),
        open_issues_count: RandomGenerator.number(0, 100),
        default_branch: Math.random() < 0.9 ? 'main' : 'master',
        has_issues: true,
        has_projects: RandomGenerator.boolean(),
        has_wiki: RandomGenerator.boolean(),
        has_pages: RandomGenerator.boolean(),
        has_downloads: true,
        language: RandomGenerator.boolean() ? languages[RandomGenerator.number(0, languages.length - 1)] : null,
        license: RandomGenerator.boolean() ? {
          key: licenses[RandomGenerator.number(0, licenses.length - 1)],
          name: licenses[RandomGenerator.number(0, licenses.length - 1)],
          spdx_id: licenses[RandomGenerator.number(0, licenses.length - 1)]
        } : null
      });
    }

    return repos;
  }

  /**
   * Generate GitHub issues
   */
  static gitHubIssues(count: number, repository: string): GitHubIssue[] {
    const issues: GitHubIssue[] = [];
    const labels = [
      { name: 'bug', color: 'd73a4a', description: 'Something isn\'t working' },
      { name: 'enhancement', color: 'a2eeef', description: 'New feature or request' },
      { name: 'documentation', color: '0075ca', description: 'Improvements or additions to documentation' },
      { name: 'good first issue', color: '7057ff', description: 'Good for newcomers' },
      { name: 'help wanted', color: '008672', description: 'Extra attention is needed' },
      { name: 'wontfix', color: 'ffffff', description: 'This will not be worked on' }
    ];

    for (let i = 0; i < count; i++) {
      const state = Math.random() < 0.7 ? 'open' : 'closed';
      const hasAssignee = Math.random() < 0.3;
      const labelCount = RandomGenerator.number(0, 3);
      
      issues.push({
        id: RandomGenerator.number(10000000, 99999999),
        number: i + 1,
        title: RandomGenerator.issueTitle(),
        body: RandomGenerator.markdown(),
        state,
        labels: RandomGenerator.boolean() ? 
          labels.sort(() => Math.random() - 0.5).slice(0, labelCount) : [],
        user: {
          login: RandomGenerator.gitHubUsername(),
          avatar_url: `https://avatars.githubusercontent.com/u/${RandomGenerator.number(1, 1000000)}`
        },
        assignee: hasAssignee ? {
          login: RandomGenerator.gitHubUsername(),
          avatar_url: `https://avatars.githubusercontent.com/u/${RandomGenerator.number(1, 1000000)}`
        } : null,
        assignees: hasAssignee ? [{
          login: RandomGenerator.gitHubUsername(),
          avatar_url: `https://avatars.githubusercontent.com/u/${RandomGenerator.number(1, 1000000)}`
        }] : [],
        milestone: null,
        comments: RandomGenerator.number(0, 20),
        created_at: new Date(Date.now() - RandomGenerator.number(1, 90) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - RandomGenerator.number(0, 7) * 24 * 60 * 60 * 1000).toISOString(),
        closed_at: state === 'closed' ? 
          new Date(Date.now() - RandomGenerator.number(1, 30) * 24 * 60 * 60 * 1000).toISOString() : null,
        html_url: `https://github.com/${repository}/issues/${i + 1}`,
        repository_url: `https://api.github.com/repos/${repository}`
      });
    }

    return issues;
  }

  /**
   * Generate a complete test dataset
   */
  static completeDataset(options?: {
    testCaseCount?: number;
    testPlanCount?: number;
    testRunCount?: number;
    repositoryCount?: number;
    issuesPerRepo?: number;
  }) {
    const {
      testCaseCount = 100,
      testPlanCount = 20,
      testRunCount = 50,
      repositoryCount = 10,
      issuesPerRepo = 20
    } = options || {};

    // Generate test cases
    const testCases = this.testCases(testCaseCount, {
      withGitHubLinks: true
    });

    // Generate test plans
    const testPlans = this.testPlans(testPlanCount, testCases);

    // Generate test runs
    const testRuns = this.testRuns(testRunCount, testPlans, testCases);

    // Generate GitHub data
    const repositories = this.gitHubRepositories(repositoryCount);
    const allIssues: GitHubIssue[] = [];
    
    repositories.forEach(repo => {
      const issues = this.gitHubIssues(issuesPerRepo, repo.full_name);
      allIssues.push(...issues);
    });

    return {
      testCases,
      testPlans,
      testRuns,
      repositories,
      issues: allIssues,
      summary: {
        totalTestCases: testCases.length,
        totalTestPlans: testPlans.length,
        totalTestRuns: testRuns.length,
        completedRuns: testRuns.filter(r => r.status === 'completed').length,
        totalRepositories: repositories.length,
        totalIssues: allIssues.length,
        openIssues: allIssues.filter(i => i.state === 'open').length
      }
    };
  }
}