export type Language = 'en' | 'no'

export interface BilingualText {
  en: string
  no: string
}

export interface NorwegianTerminology {
  testing: {
    [key: string]: string
  }
  ui: {
    [key: string]: string
  }
  business: {
    [key: string]: string
  }
}

export interface NorwegianBusinessContext {
  workingHours: { start: string; end: string }
  dateFormat: string
  numberFormat: { decimal: string; thousands: string }
  currency: string
  phoneFormat: string
  postalCodeFormat: string
}

export class BilingualService {
  private static instance: BilingualService
  private currentLanguage: Language = 'en'
  
  // Norwegian terminology dictionary
  private terminology: NorwegianTerminology = {
    testing: {
      'test case': 'testtilfelle',
      'test cases': 'testtilfeller',
      'test plan': 'testplan',
      'test execution': 'testutførelse',
      'expected result': 'forventet resultat',
      'actual result': 'faktisk resultat',
      'pass': 'bestått',
      'fail': 'feilet',
      'blocked': 'blokkert',
      'skipped': 'hoppet over',
      'pending': 'venter',
      'precondition': 'forutsetning',
      'preconditions': 'forutsetninger',
      'step': 'trinn',
      'steps': 'trinn',
      'action': 'handling',
      'priority': 'prioritet',
      'critical': 'kritisk',
      'high': 'høy',
      'medium': 'middels',
      'low': 'lav',
      'tags': 'merkelapper',
      'description': 'beskrivelse',
      'title': 'tittel'
    },
    ui: {
      'login': 'innlogging',
      'logout': 'utlogging',
      'username': 'brukernavn',
      'password': 'passord',
      'email': 'e-post',
      'submit': 'send inn',
      'cancel': 'avbryt',
      'save': 'lagre',
      'delete': 'slett',
      'edit': 'rediger',
      'create': 'opprett',
      'update': 'oppdater',
      'search': 'søk',
      'filter': 'filtrer',
      'settings': 'innstillinger',
      'dashboard': 'dashbord',
      'navigation': 'navigasjon',
      'menu': 'meny',
      'profile': 'profil',
      'account': 'konto',
      'preferences': 'preferanser'
    },
    business: {
      'user': 'bruker',
      'customer': 'kunde',
      'admin': 'administrator',
      'manager': 'leder',
      'employee': 'ansatt',
      'organization': 'organisasjon',
      'company': 'selskap',
      'department': 'avdeling',
      'project': 'prosjekt',
      'task': 'oppgave',
      'report': 'rapport',
      'document': 'dokument',
      'file': 'fil',
      'folder': 'mappe',
      'data': 'data',
      'information': 'informasjon'
    }
  }

  private norwegianContext: NorwegianBusinessContext = {
    workingHours: { start: '08:00', end: '16:00' },
    dateFormat: 'DD.MM.YYYY',
    numberFormat: { decimal: ',', thousands: ' ' },
    currency: 'NOK',
    phoneFormat: '+47 XXX XX XXX',
    postalCodeFormat: 'XXXX'
  }

  // UI translations
  private uiTranslations: { [key: string]: BilingualText } = {
    // General
    'settings': { en: 'Settings', no: 'Innstillinger' },
    'language': { en: 'Language', no: 'Språk' },
    'save': { en: 'Save', no: 'Lagre' },
    'cancel': { en: 'Cancel', no: 'Avbryt' },
    'reset': { en: 'Reset', no: 'Tilbakestill' },
    'general': { en: 'General', no: 'Generelt' },
    'templates': { en: 'Templates', no: 'Maler' },
    'advanced': { en: 'Advanced', no: 'Avansert' },
    
    // AI Generator Settings
    'ai_generator_settings': { en: 'AI Generator Settings', no: 'AI Generator Innstillinger' },
    'interface_language': { en: 'Interface Language', no: 'Grensesnittspråk' },
    'generation_language': { en: 'Generation Language', no: 'Genereringsspråk' },
    'auto_detect': { en: 'Auto-detect input language', no: 'Automatisk gjenkjenn inngangsspråk' },
    'ai_model': { en: 'AI Model', no: 'AI Modell' },
    'temperature': { en: 'Temperature', no: 'Temperatur' },
    'test_count': { en: 'Test Count', no: 'Antall Tester' },
    'detail_level': { en: 'Detail Level', no: 'Detaljnivå' },
    'focus_areas': { en: 'Focus Areas', no: 'Fokusområder' },
    
    // Detail Levels
    'basic': { en: 'Basic', no: 'Grunnleggende' },
    'standard': { en: 'Standard', no: 'Standard' },
    'comprehensive': { en: 'Comprehensive', no: 'Omfattende' },
    'expert': { en: 'Expert', no: 'Ekspert' },
    
    // Focus Areas
    'happy_path': { en: 'Happy Path Scenarios', no: 'Hovedscenarier' },
    'edge_cases': { en: 'Edge Cases', no: 'Grensetilfeller' },
    'error_handling': { en: 'Error Handling', no: 'Feilhåndtering' },
    'security_testing': { en: 'Security Testing', no: 'Sikkerhetstesting' },
    'performance_testing': { en: 'Performance Testing', no: 'Ytelsestesting' },
    'accessibility': { en: 'Accessibility', no: 'Tilgjengelighet' },
    
    // Template Categories
    'web_application': { en: 'Web Application Testing', no: 'Nettapplikasjon Testing' },
    'mobile_testing': { en: 'Mobile Testing', no: 'Mobil Testing' },
    'api_testing': { en: 'API Testing', no: 'API Testing' },
    'security_testing': { en: 'Security Testing', no: 'Sikkerhetstesting' },
    'performance_testing': { en: 'Performance Testing', no: 'Ytelsestesting' }
  }

  static getInstance(): BilingualService {
    if (!BilingualService.instance) {
      BilingualService.instance = new BilingualService()
    }
    return BilingualService.instance
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ai_generator_language', language)
      } catch (error) {
        console.error('Failed to save language to localStorage:', error)
      }
    }
  }

  // Get UI translation
  t(key: string): string {
    const translation = this.uiTranslations[key]
    if (translation) {
      return translation[this.currentLanguage]
    }
    return key // Fallback to key if translation not found
  }

  // Get bilingual text object
  getBilingualText(key: string): BilingualText | null {
    return this.uiTranslations[key] || null
  }

  // Get Norwegian terminology
  getLocalizedTerm(englishTerm: string, targetLanguage: Language = this.currentLanguage): string {
    if (targetLanguage === 'en') {
      return englishTerm
    }

    // Check in all terminology categories
    for (const category of Object.values(this.terminology)) {
      if (category[englishTerm.toLowerCase()]) {
        return category[englishTerm.toLowerCase()]
      }
    }

    return englishTerm // Fallback to English if not found
  }

  // Detect input language (simple detection)
  async detectInputLanguage(text: string): Promise<Language> {
    // Simple Norwegian detection based on common Norwegian words
    const norwegianIndicators = [
      'og', 'eller', 'med', 'for', 'til', 'av', 'på', 'i', 'som', 'det', 'er', 'skal', 'kan', 'må',
      'bruker', 'brukere', 'system', 'applikasjon', 'funksjon', 'knapp', 'side', 'skjema'
    ]
    
    const words = text.toLowerCase().split(/\s+/)
    const norwegianWordCount = words.filter(word => 
      norwegianIndicators.includes(word) || 
      word.includes('ø') || 
      word.includes('å') || 
      word.includes('æ')
    ).length

    // If more than 20% of words are Norwegian indicators, assume Norwegian
    const threshold = Math.max(1, Math.floor(words.length * 0.2))
    return norwegianWordCount >= threshold ? 'no' : 'en'
  }

  // Format date according to Norwegian format
  formatDate(date: Date, language: Language = this.currentLanguage): string {
    if (language === 'no') {
      return date.toLocaleDateString('no-NO', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      })
    }
    return date.toLocaleDateString('en-US')
  }

  // Format currency
  formatCurrency(amount: number, language: Language = this.currentLanguage): string {
    if (language === 'no') {
      return new Intl.NumberFormat('no-NO', {
        style: 'currency',
        currency: 'NOK'
      }).format(amount)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Get Norwegian business context
  getNorwegianContext(): NorwegianBusinessContext {
    return this.norwegianContext
  }

  // Initialize language from localStorage
  initializeLanguage(): void {
    if (typeof window !== 'undefined') {
      try {
        const savedLanguage = localStorage.getItem('ai_generator_language') as Language
        if (savedLanguage && ['en', 'no'].includes(savedLanguage)) {
          this.currentLanguage = savedLanguage
        }
      } catch (error) {
        console.error('Failed to initialize language from localStorage:', error)
        // Continue with default language (en)
      }
    }
  }

  // Add custom terminology
  addCustomTerminology(category: keyof NorwegianTerminology, terms: { [key: string]: string }): void {
    this.terminology[category] = { ...this.terminology[category], ...terms }
  }

  // Get all terminology for a category
  getTerminologyCategory(category: keyof NorwegianTerminology): { [key: string]: string } {
    return this.terminology[category]
  }
}