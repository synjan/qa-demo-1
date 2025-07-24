import { faker } from '@faker-js/faker';
import { TestCase, TestPlan, TestStep, Priority } from '@/lib/types';

// Set seed for consistent test data if needed
export function setSeed(seed: number) {
  faker.seed(seed);
}

/**
 * Random data generators for various data types
 */
export class RandomGenerator {
  static string(options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  }): string {
    const { minLength = 1, maxLength = 100 } = options || {};
    return faker.string.alphanumeric({ 
      length: { min: minLength, max: maxLength } 
    });
  }

  static email(): string {
    return faker.internet.email();
  }

  static url(): string {
    return faker.internet.url();
  }

  static boolean(): boolean {
    return faker.datatype.boolean();
  }

  static number(min = 0, max = 1000): number {
    return faker.number.int({ min, max });
  }

  static date(options?: {
    from?: Date;
    to?: Date;
    past?: boolean;
    future?: boolean;
  }): Date {
    const { from, to, past, future } = options || {};
    
    if (past) return faker.date.past();
    if (future) return faker.date.future();
    if (from && to) return faker.date.between({ from, to });
    
    return faker.date.recent();
  }

  static priority(): Priority {
    return faker.helpers.arrayElement(['low', 'medium', 'high']);
  }

  static tags(count = 3): string[] {
    const availableTags = [
      'smoke', 'regression', 'critical', 'edge-case', 'integration',
      'ui', 'api', 'performance', 'security', 'accessibility',
      'mobile', 'desktop', 'chrome', 'firefox', 'safari'
    ];
    
    return faker.helpers.arrayElements(availableTags, { min: 1, max: count });
  }

  static gitHubUsername(): string {
    return faker.internet.username();
  }

  static gitHubRepoName(): string {
    return faker.helpers.slugify(
      faker.word.words({ count: { min: 1, max: 3 } })
    ).toLowerCase();
  }

  static issueTitle(): string {
    const templates = [
      () => `Fix ${faker.word.noun()} in ${faker.word.noun()} component`,
      () => `Add ${faker.word.adjective()} ${faker.word.noun()} feature`,
      () => `Update ${faker.word.noun()} to support ${faker.word.noun()}`,
      () => `${faker.word.verb()} ${faker.word.noun()} when ${faker.word.verb()}ing`,
      () => `[BUG] ${faker.word.noun()} not working properly`,
      () => `[FEATURE] Implement ${faker.word.adjective()} ${faker.word.noun()}`,
    ];
    
    return faker.helpers.arrayElement(templates)();
  }

  static testStepAction(): string {
    const templates = [
      () => `Click on ${faker.word.noun()} button`,
      () => `Navigate to ${faker.word.noun()} page`,
      () => `Enter "${faker.word.words()}" in ${faker.word.noun()} field`,
      () => `Select ${faker.word.adjective()} option from dropdown`,
      () => `Verify ${faker.word.noun()} is ${faker.word.adjective()}`,
      () => `Wait for ${faker.word.noun()} to load`,
      () => `Scroll to ${faker.word.noun()} section`,
    ];
    
    return faker.helpers.arrayElement(templates)();
  }

  static testStepExpectedResult(): string {
    const templates = [
      () => `${faker.word.noun()} should be ${faker.word.adjective()}`,
      () => `Page displays ${faker.word.noun()} correctly`,
      () => `System shows ${faker.word.adjective()} message`,
      () => `${faker.word.noun()} is ${faker.word.verb()}ed successfully`,
      () => `User is redirected to ${faker.word.noun()} page`,
      () => `Error message "${faker.word.words()}" is not displayed`,
    ];
    
    return faker.helpers.arrayElement(templates)();
  }

  static markdown(): string {
    const sections = [
      `# ${faker.word.words({ count: 3 })}\n\n`,
      `${faker.lorem.paragraph()}\n\n`,
      `## ${faker.word.words({ count: 2 })}\n\n`,
      `- ${faker.lorem.sentence()}\n`,
      `- ${faker.lorem.sentence()}\n`,
      `- ${faker.lorem.sentence()}\n\n`,
      `> ${faker.lorem.sentence()}\n\n`,
      `\`\`\`javascript\n${faker.lorem.lines(3)}\n\`\`\`\n\n`,
      `**${faker.word.words()}**: ${faker.lorem.sentence()}\n\n`,
    ];
    
    return faker.helpers.arrayElements(sections, { min: 3, max: 6 }).join('');
  }

  static filename(extension = 'md'): string {
    return `${faker.helpers.slugify(faker.word.words({ count: 3 }))}.${extension}`;
  }

  static httpStatusCode(options?: {
    success?: boolean;
    error?: boolean;
  }): number {
    const { success, error } = options || {};
    
    if (success) {
      return faker.helpers.arrayElement([200, 201, 204]);
    }
    
    if (error) {
      return faker.helpers.arrayElement([400, 401, 403, 404, 422, 500, 503]);
    }
    
    return faker.helpers.arrayElement([200, 201, 204, 400, 401, 403, 404, 500]);
  }

  static errorMessage(): string {
    const templates = [
      () => `Failed to ${faker.word.verb()} ${faker.word.noun()}`,
      () => `${faker.word.noun()} is required`,
      () => `Invalid ${faker.word.noun()} format`,
      () => `${faker.word.noun()} not found`,
      () => `Unauthorized access to ${faker.word.noun()}`,
      () => `${faker.word.noun()} already exists`,
      () => `Cannot ${faker.word.verb()} ${faker.word.noun()} at this time`,
    ];
    
    return faker.helpers.arrayElement(templates)();
  }

  static json(depth = 2): any {
    if (depth <= 0) {
      return faker.helpers.arrayElement([
        faker.string.alphanumeric(),
        faker.number.int(),
        faker.datatype.boolean(),
        null
      ]);
    }
    
    const obj: any = {};
    const keyCount = faker.number.int({ min: 1, max: 5 });
    
    for (let i = 0; i < keyCount; i++) {
      const key = faker.word.noun();
      const valueType = faker.number.int({ min: 0, max: 5 });
      
      switch (valueType) {
        case 0:
          obj[key] = faker.string.alphanumeric();
          break;
        case 1:
          obj[key] = faker.number.int();
          break;
        case 2:
          obj[key] = faker.datatype.boolean();
          break;
        case 3:
          obj[key] = null;
          break;
        case 4:
          obj[key] = faker.helpers.multiple(
            () => this.json(depth - 1),
            { count: { min: 1, max: 3 } }
          );
          break;
        case 5:
          obj[key] = this.json(depth - 1);
          break;
      }
    }
    
    return obj;
  }
}

// Specific generators for test entities
export class TestDataGenerator {
  static testStep(overrides?: Partial<TestStep>): TestStep {
    return {
      id: faker.string.uuid(),
      stepNumber: faker.number.int({ min: 1, max: 10 }),
      action: RandomGenerator.testStepAction(),
      expectedResult: RandomGenerator.testStepExpectedResult(),
      ...overrides,
    };
  }

  static testCase(overrides?: Partial<TestCase>): TestCase {
    const stepCount = faker.number.int({ min: 3, max: 8 });
    const steps = Array.from({ length: stepCount }, (_, i) => 
      this.testStep({ stepNumber: i + 1 })
    );
    
    return {
      id: faker.string.uuid(),
      title: RandomGenerator.issueTitle(),
      description: faker.lorem.paragraph(),
      preconditions: faker.lorem.sentence(),
      steps,
      expectedResult: faker.lorem.sentence(),
      priority: RandomGenerator.priority(),
      tags: RandomGenerator.tags(),
      estimatedTime: faker.number.int({ min: 60, max: 1800 }),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      createdBy: RandomGenerator.gitHubUsername(),
      lastUpdatedBy: RandomGenerator.gitHubUsername(),
      githubIssueNumber: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 1000 }) : undefined,
      githubRepository: faker.datatype.boolean() ? 
        `${RandomGenerator.gitHubUsername()}/${RandomGenerator.gitHubRepoName()}` : undefined,
      ...overrides,
    };
  }

  static testPlan(overrides?: Partial<TestPlan>): TestPlan {
    const testCaseCount = faker.number.int({ min: 5, max: 20 });
    const testCaseIds = Array.from({ length: testCaseCount }, () => faker.string.uuid());
    
    return {
      id: faker.string.uuid(),
      name: `${faker.word.adjective()} ${faker.word.noun()} Test Plan`,
      description: faker.lorem.paragraph(),
      testCaseIds,
      tags: RandomGenerator.tags(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      createdBy: RandomGenerator.gitHubUsername(),
      lastUpdatedBy: RandomGenerator.gitHubUsername(),
      ...overrides,
    };
  }
}