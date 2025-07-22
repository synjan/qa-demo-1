export interface UserPreferences {
  profile: {
    displayName: string
    email: string
    avatar?: string
    timezone: string
  }
  dashboard: {
    layout: 'default' | 'compact' | 'detailed'
    widgets: string[]
    theme: 'light' | 'dark' | 'auto'
    language: 'en' | 'no'
    showWelcome: boolean
  }
  github: {
    defaultRepository?: string
    accessToken?: string
    preferredIntegration: 'oauth' | 'pat'
    webhookUrl?: string
    autoSync: boolean
    favoriteRepositories: string[]
  }
  notifications: {
    browser: boolean
    testCompletion: boolean
    testFailure: boolean
    weeklyReports: boolean
    criticalOnly: boolean
  }
  ai: {
    defaultModel: 'gpt-4' | 'gpt-3.5-turbo'
    apiKey?: string
    defaultParameters: {
      temperature: number
      maxTokens: number
      testCount: number
    }
    // Extended features from AI Generator
    interfaceLanguage: 'en' | 'no'
    generationLanguage: 'en' | 'no'
    autoDetectLanguage: boolean
    detailLevel: 'basic' | 'standard' | 'comprehensive' | 'expert'
    focusAreas: string[]
    selectedTemplate: string
    streamingMode: boolean
    requestTimeout: number
  }
  testExecution: {
    defaultTimeout: number
    autoSave: boolean
  }
}

export const defaultPreferences: UserPreferences = {
  profile: {
    displayName: '',
    email: '',
    timezone: 'UTC'
  },
  dashboard: {
    layout: 'default',
    widgets: ['stats', 'quick-actions', 'recent-activity'],
    theme: 'auto',
    language: 'en',
    showWelcome: true
  },
  github: {
    preferredIntegration: 'oauth',
    autoSync: true,
    favoriteRepositories: []
  },
  notifications: {
    browser: true,
    testCompletion: true,
    testFailure: true,
    weeklyReports: false,
    criticalOnly: false
  },
  ai: {
    defaultModel: 'gpt-4',
    defaultParameters: {
      temperature: 0.7,
      maxTokens: 2000,
      testCount: 5
    },
    // Extended features from AI Generator
    interfaceLanguage: 'en',
    generationLanguage: 'en',
    autoDetectLanguage: true,
    detailLevel: 'standard',
    focusAreas: ['happy_path', 'edge_cases', 'error_handling'],
    selectedTemplate: 'default',
    streamingMode: false,
    requestTimeout: 120
  },
  testExecution: {
    defaultTimeout: 30000, // 30 seconds
    autoSave: true
  }
}

export class UserPreferencesManager {
  private static readonly STORAGE_KEY = 'user_preferences'

  static getUserPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      return defaultPreferences
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle new properties
        return this.mergeWithDefaults(parsed)
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error)
    }

    return defaultPreferences
  }

  static saveUserPreferences(preferences: UserPreferences): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error('Failed to save user preferences:', error)
    }
  }

  static updatePreferences(updates: Partial<UserPreferences>): UserPreferences {
    const current = this.getUserPreferences()
    const updated = this.deepMerge(current, updates)
    this.saveUserPreferences(updated)
    return updated
  }

  static resetToDefaults(): UserPreferences {
    this.saveUserPreferences(defaultPreferences)
    return defaultPreferences
  }

  private static mergeWithDefaults(stored: Record<string, unknown>): UserPreferences {
    return this.deepMerge(defaultPreferences, stored)
  }

  static deepMerge<T extends Record<string, unknown>>(
    target: T, 
    source: Record<string, unknown>
  ): T {
    const result = { ...target }
    
    for (const key in source) {
      const sourceValue = source[key]
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        result[key] = this.deepMerge(
          (target[key] as Record<string, unknown>) || {}, 
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>]
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
    
    return result
  }

  private static deepMergePrivate<T extends Record<string, unknown>>(
    target: T, 
    source: Record<string, unknown>
  ): T {
    return this.deepMerge(target, source)
  }

  // Validation methods
  static validateGitHubToken(token: string): boolean {
    return token.startsWith('ghp_') && token.length >= 36
  }

  static validateOpenAIKey(key: string): boolean {
    return key.startsWith('sk-') && key.length >= 48
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}