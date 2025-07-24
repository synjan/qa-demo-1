import OpenAI from 'openai'
import { OpenAIService } from '../openai'

// Mock OpenAI
jest.mock('openai')
// Mock prompt templates
jest.mock('../prompt-templates', () => ({
  PromptTemplateService: {
    getInstance: jest.fn().mockReturnValue({
      // Add any methods that need to be mocked
    })
  },
  Language: {
    ENGLISH: 'en',
    SPANISH: 'es',
    FRENCH: 'fr'
  }
}))

describe('OpenAIService', () => {
  let service: OpenAIService
  let mockOpenAI: jest.Mocked<OpenAI>
  let mockChat: any
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set mock environment variable
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-api-key' }
    
    // Create mock chat completions
    mockChat = {
      create: jest.fn(),
    }

    // Create mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: mockChat,
      },
    } as any

    // Mock constructor
    ;(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI)
    
    service = new OpenAIService()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('generateTestCase', () => {
    const mockIssue = {
      number: 1,
      title: 'User Login Feature',
      body: 'As a user, I want to log in to the application',
      labels: [{ name: 'feature' }, { name: 'auth' }],
      html_url: 'https://github.com/owner/repo/issues/1',
    }

    it('should generate a test case successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Test User Login',
              description: 'Verify user can log in successfully',
              preconditions: 'User has valid credentials',
              steps: [
                { stepNumber: 1, action: 'Navigate to login page', expectedResult: 'Login page displays' },
                { stepNumber: 2, action: 'Enter credentials', expectedResult: 'Credentials accepted' },
                { stepNumber: 3, action: 'Click login', expectedResult: 'User logged in' },
              ],
              expectedResult: 'User redirected to dashboard',
              priority: 'high',
              category: 'Authentication',
            }),
          },
        }],
      }

      mockChat.create.mockResolvedValue(mockResponse)

      const testCase = await service.generateTestCase(mockIssue, 'owner/repo', 'testuser')

      expect(testCase).toMatchObject({
        id: expect.any(String),
        title: 'Test User Login',
        description: 'Verify user can log in successfully',
        preconditions: 'User has valid credentials',
        steps: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            stepNumber: expect.any(Number),
            action: expect.any(String),
            expectedResult: expect.any(String),
          }),
        ]),
        expectedResult: 'User redirected to dashboard',
        priority: 'high',
        tags: expect.any(Array),
        githubIssue: {
          number: 1,
          url: mockIssue.html_url,
          repository: 'owner/repo'
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        createdBy: 'testuser'
      })

      expect(mockChat.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('professional QA engineer'),
          },
          {
            role: 'user',
            content: expect.stringContaining('User Login Feature'),
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    })

    it('should handle OpenAI API errors', async () => {
      mockChat.create.mockRejectedValue(new Error('API Error'))

      await expect(service.generateTestCase(mockIssue, 'repo', 'testuser')).rejects.toThrow('Failed to generate test case with AI')
    })

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON',
          },
        }],
      }

      mockChat.create.mockResolvedValue(mockResponse)

      await expect(service.generateTestCase(mockIssue, 'repo')).rejects.toThrow()
    })

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [],
      }

      mockChat.create.mockResolvedValue(mockResponse)

      await expect(service.generateTestCase(mockIssue, 'repo')).rejects.toThrow()
    })

    it('should include issue labels in the prompt', async () => {
      mockChat.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Test',
              description: 'Test',
              steps: [],
            }),
          },
        }],
      })

      await service.generateTestCase(mockIssue, 'repo', 'testuser')

      expect(mockChat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('feature, auth'),
            }),
          ]),
        })
      )
    })
  })

  // Note: The OpenAIService doesn't have a generateTestCases method
  // It only has generateTestCase for single issues

  describe('constructor', () => {
    it('should create OpenAI instance with environment API key', () => {
      process.env.OPENAI_API_KEY = 'sk-test123'
      new OpenAIService()

      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-test123',
      })
    })
  })

  describe('error scenarios', () => {
    it('should handle rate limit errors', async () => {
      mockChat.create.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
      })

      await expect(service.generateTestCase({
        number: 1,
        title: 'Test',
        body: 'Test',
        labels: [],
      }, 'repo')).rejects.toMatchObject({
        status: 429,
      })
    })

    it('should handle authentication errors', async () => {
      mockChat.create.mockRejectedValue({
        status: 401,
        message: 'Invalid API key',
      })

      await expect(service.generateTestCase({
        number: 1,
        title: 'Test',
        body: 'Test',
        labels: [],
      }, 'repo')).rejects.toMatchObject({
        status: 401,
      })
    })
  })
})