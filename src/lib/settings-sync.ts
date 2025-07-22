import { UserPreferences, UserPreferencesManager } from './user-preferences'

// AI Generator Settings Interface (keeping compatibility)
export interface AIGeneratorSettings {
  interfaceLanguage: 'en' | 'no'
  generationLanguage: 'en' | 'no'
  autoDetectLanguage: boolean
  model: 'gpt-4' | 'gpt-3.5-turbo'
  temperature: number
  maxTokens: number
  testCount: number
  detailLevel: 'basic' | 'standard' | 'comprehensive' | 'expert'
  focusAreas: string[]
  selectedTemplate: string
  streamingMode: boolean
  requestTimeout: number
}

export class SettingsSync {
  private static readonly AI_GENERATOR_STORAGE_KEY = 'ai_generator_settings'
  private static readonly SYNC_EVENT = 'settings-sync'

  /**
   * Convert UserPreferences AI section to AIGeneratorSettings format
   */
  static userPreferencesToAIGenerator(preferences: UserPreferences): AIGeneratorSettings {
    return {
      interfaceLanguage: preferences.ai.interfaceLanguage,
      generationLanguage: preferences.ai.generationLanguage,
      autoDetectLanguage: preferences.ai.autoDetectLanguage,
      model: preferences.ai.defaultModel,
      temperature: preferences.ai.defaultParameters.temperature,
      maxTokens: preferences.ai.defaultParameters.maxTokens,
      testCount: preferences.ai.defaultParameters.testCount,
      detailLevel: preferences.ai.detailLevel,
      focusAreas: preferences.ai.focusAreas,
      selectedTemplate: preferences.ai.selectedTemplate,
      streamingMode: preferences.ai.streamingMode,
      requestTimeout: preferences.ai.requestTimeout
    }
  }

  /**
   * Convert AIGeneratorSettings to UserPreferences AI section
   */
  static aiGeneratorToUserPreferences(aiSettings: AIGeneratorSettings): Partial<UserPreferences> {
    return {
      ai: {
        defaultModel: aiSettings.model,
        apiKey: UserPreferencesManager.getUserPreferences().ai.apiKey, // Preserve API key
        defaultParameters: {
          temperature: aiSettings.temperature,
          maxTokens: aiSettings.maxTokens,
          testCount: aiSettings.testCount
        },
        interfaceLanguage: aiSettings.interfaceLanguage,
        generationLanguage: aiSettings.generationLanguage,
        autoDetectLanguage: aiSettings.autoDetectLanguage,
        detailLevel: aiSettings.detailLevel,
        focusAreas: aiSettings.focusAreas,
        selectedTemplate: aiSettings.selectedTemplate,
        streamingMode: aiSettings.streamingMode,
        requestTimeout: aiSettings.requestTimeout
      }
    }
  }

  /**
   * Get AI Generator settings, synced with UserPreferences
   */
  static getAIGeneratorSettings(): AIGeneratorSettings {
    if (typeof window === 'undefined') {
      // Return default settings for SSR
      const defaultPrefs = UserPreferencesManager.getUserPreferences()
      return this.userPreferencesToAIGenerator(defaultPrefs)
    }

    try {
      // Try to load from AI Generator storage first
      const aiSettings = localStorage.getItem(this.AI_GENERATOR_STORAGE_KEY)
      const userPreferences = UserPreferencesManager.getUserPreferences()

      if (aiSettings) {
        const parsed = JSON.parse(aiSettings) as AIGeneratorSettings
        // Sync any newer values from UserPreferences
        return {
          ...parsed,
          model: userPreferences.ai.defaultModel,
          temperature: userPreferences.ai.defaultParameters.temperature,
          maxTokens: userPreferences.ai.defaultParameters.maxTokens,
          testCount: userPreferences.ai.defaultParameters.testCount,
        }
      } else {
        // Create from UserPreferences
        return this.userPreferencesToAIGenerator(userPreferences)
      }
    } catch (error) {
      console.error('Failed to sync AI settings:', error)
      return this.userPreferencesToAIGenerator(UserPreferencesManager.getUserPreferences())
    }
  }

  /**
   * Save AI Generator settings and sync to UserPreferences
   */
  static saveAIGeneratorSettings(settings: AIGeneratorSettings): void {
    if (typeof window === 'undefined') return

    try {
      // Save to AI Generator storage
      localStorage.setItem(this.AI_GENERATOR_STORAGE_KEY, JSON.stringify(settings))
      
      // Sync to UserPreferences
      const userPreferencesUpdate = this.aiGeneratorToUserPreferences(settings)
      UserPreferencesManager.updatePreferences(userPreferencesUpdate)

      // Dispatch sync event for components to listen to
      window.dispatchEvent(new CustomEvent(this.SYNC_EVENT, { 
        detail: { source: 'ai-generator', settings } 
      }))

      console.log('AI Generator settings saved and synced to UserPreferences')
    } catch (error) {
      console.error('Failed to save and sync AI settings:', error)
    }
  }

  /**
   * Update UserPreferences and sync to AI Generator settings
   */
  static syncFromUserPreferences(preferences: UserPreferences): void {
    if (typeof window === 'undefined') return

    try {
      const aiSettings = this.userPreferencesToAIGenerator(preferences)
      localStorage.setItem(this.AI_GENERATOR_STORAGE_KEY, JSON.stringify(aiSettings))

      // Dispatch sync event
      window.dispatchEvent(new CustomEvent(this.SYNC_EVENT, { 
        detail: { source: 'user-preferences', preferences } 
      }))

      console.log('UserPreferences synced to AI Generator settings')
    } catch (error) {
      console.error('Failed to sync from UserPreferences:', error)
    }
  }

  /**
   * Subscribe to settings sync events
   */
  static onSync(callback: (event: CustomEvent) => void): () => void {
    if (typeof window === 'undefined') return () => {}

    window.addEventListener(this.SYNC_EVENT, callback as EventListener)
    
    return () => {
      window.removeEventListener(this.SYNC_EVENT, callback as EventListener)
    }
  }

  /**
   * Merge changes from one settings system to another
   */
  static mergeSettings<T extends Record<string, unknown>>(
    target: T, 
    source: Partial<T>
  ): T {
    const result = { ...target }
    
    for (const key in source) {
      const sourceValue = source[key]
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        result[key] = this.mergeSettings(
          (target[key] as Record<string, unknown>) || {}, 
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>]
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
    
    return result
  }
}