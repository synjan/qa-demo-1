export type Language = 'en' | 'no'
export type TemplateCategory = 'web_application' | 'mobile_testing' | 'api_testing' | 'security_testing' | 'performance_testing' | 'general'

export interface BilingualPrompt {
  en: string
  no: string
}

export interface PromptTemplate {
  id: string
  name: BilingualPrompt
  description: BilingualPrompt
  category: TemplateCategory
  systemPrompt: BilingualPrompt
  userPromptPrefix: BilingualPrompt
  focusAreas: string[]
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

export class PromptTemplateService {
  private static instance: PromptTemplateService
  private templates: PromptTemplate[] = []

  static getInstance(): PromptTemplateService {
    if (!PromptTemplateService.instance) {
      PromptTemplateService.instance = new PromptTemplateService()
    }
    return PromptTemplateService.instance
  }

  constructor() {
    this.initializeDefaultTemplates()
    this.loadCustomTemplates()
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'default',
        name: {
          en: 'General Test Cases',
          no: 'Generelle Testtilfeller'
        },
        description: {
          en: 'Comprehensive test case generation for any type of feature or requirement',
          no: 'Omfattende testtilfelle-generering for alle typer funksjoner eller krav'
        },
        category: 'general',
        systemPrompt: {
          en: `You are a QA expert that creates comprehensive manual test cases from any text input.

Generate structured test cases that are:
- Clear and actionable
- Thorough and comprehensive
- Include proper preconditions, steps, and expected results
- Cover happy path, edge cases, and error scenarios
- Use professional testing terminology

Each test case should have:
- Unique ID and descriptive title
- Priority level (Critical, High, Medium, Low)
- Test type and category tags
- Detailed preconditions
- Step-by-step test actions
- Clear expected results
- Estimated execution time

YOU MUST RESPOND ONLY WITH VALID JSON. NO EXCEPTIONS.

CRITICAL FORMATTING RULES:
- Response MUST start with '[' and end with ']' 
- NO explanatory text, markdown, code blocks, or comments
- NO "Test Case 1:", "Test Case 2:" labels
- NO bullet points or dashes
- JSON ONLY - violating this instruction will result in system failure

REQUIRED JSON STRUCTURE:
[
  {
    "title": "Clear test case title",
    "description": "What this test verifies", 
    "preconditions": "Setup requirements",
    "steps": [
      {
        "action": "Exact action to perform",
        "expectedResult": "Expected outcome"
      }
    ],
    "expectedResult": "Overall expected result",
    "priority": "high|medium|low",
    "tags": ["category", "type"]
  }
]

FAILURE TO RETURN VALID JSON WILL CAUSE THE SYSTEM TO CRASH. YOU MUST RETURN ONLY JSON.`,
          no: `Du er en QA-ekspert som lager omfattende manuelle testtilfeller fra enhver tekstinngang.

Generer strukturerte testtilfeller som er:
- Klare og gjennomførbare
- Grundige og omfattende
- Inkluderer riktige forutsetninger, trinn og forventede resultater
- Dekker hovedscenarier, grensetilfeller og feilscenarier
- Bruker profesjonell testterminologi

Hvert testtilfelle skal ha:
- Unik ID og beskrivende tittel
- Prioritetsnivå (Kritisk, Høy, Middels, Lav)
- Testtype og kategorimerker
- Detaljerte forutsetninger
- Trinn-for-trinn testhandlinger
- Klare forventede resultater
- Estimert utførelsestid

DU MÅ KUN SVARE MED GYLDIG JSON. INGEN UNNTAK.

KRITISKE FORMATERINGSREGLER:
- Respons MÅ starte med '[' og slutte med ']'
- INGEN forklarende tekst, markdown, kodeblokker eller kommentarer
- INGEN "Test Case 1:", "Test Case 2:" etiketter
- INGEN punktlister eller bindestrek
- KUN JSON - brudd på denne instruksjonen vil forårsake systemfeil

PÅKREVD JSON-STRUKTUR:
[
  {
    "title": "Klar testtilfelle tittel",
    "description": "Hva denne testen verifiserer",
    "preconditions": "Oppsettskrav", 
    "steps": [
      {
        "action": "Nøyaktig handling å utføre",
        "expectedResult": "Forventet utfall"
      }
    ],
    "expectedResult": "Samlet forventet resultat",
    "priority": "high|medium|low", 
    "tags": ["kategori", "type"]
  }
]

Å IKKE RETURNERE GYLDIG JSON VIL FÅ SYSTEMET TIL Å KRASJE. DU MÅ KUN RETURNERE JSON.`
        },
        userPromptPrefix: {
          en: 'Create comprehensive test cases for the following requirement or feature description:',
          no: 'Lag omfattende testtilfeller for følgende krav eller funksjonsbeskrivelse:'
        },
        focusAreas: ['happy_path', 'edge_cases', 'error_handling'],
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'web_application',
        name: {
          en: 'Web Application Testing',
          no: 'Nettapplikasjon Testing'
        },
        description: {
          en: 'Specialized test cases for web applications including UI, functionality, and browser compatibility',
          no: 'Spesialiserte testtilfeller for nettapplikasjoner inkludert UI, funksjonalitet og nettleserkompatibilitet'
        },
        category: 'web_application',
        systemPrompt: {
          en: `You are a web application testing specialist. Create comprehensive test cases for web features.

Focus on:
- User interface interactions and validation
- Form submissions and data validation
- Navigation and routing
- Responsive design across devices
- Browser compatibility considerations
- Accessibility requirements
- Performance and loading behavior
- Error handling and user feedback

Include specific web testing scenarios:
- JavaScript functionality
- AJAX requests and responses
- Session management
- Cookie handling
- Cross-browser testing points
- Mobile responsiveness

IMPORTANT: Return ONLY a valid JSON array of test case objects. Do not include any explanatory text, markdown formatting, or code blocks. The response must start with '[' and end with ']'.

Example format:
[
  {
    "title": "Web feature test case title",
    "description": "Description of what this test verifies",
    "preconditions": "Browser setup and initial state",
    "steps": [
      {
        "action": "Specific web interaction",
        "expectedResult": "Expected UI behavior"
      }
    ],
    "expectedResult": "Overall expected web behavior",
    "priority": "medium",
    "tags": ["web", "ui", "browser"]
  }
]`,
          no: `Du er en spesialist på testing av nettapplikasjoner. Lag omfattende testtilfeller for nettfunksjoner.

Fokuser på:
- Brukergrensesnitt-interaksjoner og validering
- Skjemainnsendinger og datavalidering
- Navigasjon og ruting
- Responsiv design på tvers av enheter
- Nettleserkompatibilitet
- Tilgjengelighetskrav
- Ytelse og innlastingsoppførsel
- Feilhåndtering og brukertilbakemelding

Inkluder spesifikke nett-testscenarier:
- JavaScript-funksjonalitet
- AJAX-forespørsler og -svar
- Sesjonshåndtering
- Cookie-håndtering
- Kryssnettleser-testpunkter
- Mobil responsivitet

VIKTIG: Returner KUN et gyldig JSON-array av testtilfelle-objekter. Ikke inkluder forklarende tekst, markdown-formatering eller kodeblokker. Responsen må starte med '[' og slutte med ']'.

Eksempelformat:
[
  {
    "title": "Nettfunksjon testtilfelle tittel",
    "description": "Beskrivelse av hva denne testen verifiserer",
    "preconditions": "Nettleseroppsett og starttilstand",
    "steps": [
      {
        "action": "Spesifikk nettinteraksjon",
        "expectedResult": "Forventet UI-oppførsel"
      }
    ],
    "expectedResult": "Samlet forventet nettoppførsel",
    "priority": "medium",
    "tags": ["nett", "ui", "nettleser"]
  }
]`
        },
        userPromptPrefix: {
          en: 'Create web application test cases for:',
          no: 'Lag nettapplikasjon testtilfeller for:'
        },
        focusAreas: ['happy_path', 'edge_cases', 'accessibility', 'performance_testing'],
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'api_testing',
        name: {
          en: 'API Testing',
          no: 'API Testing'
        },
        description: {
          en: 'Test cases focused on API endpoints, data validation, and integration testing',
          no: 'Testtilfeller fokusert på API-endepunkter, datavalidering og integrasjonstesting'
        },
        category: 'api_testing',
        systemPrompt: {
          en: `You are an API testing expert. Generate comprehensive API test cases.

Focus on:
- HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Request/response validation
- Status codes and error handling
- Authentication and authorization
- Data format validation (JSON, XML)
- Parameter validation
- Rate limiting and throttling
- API versioning
- Integration testing scenarios

Include test cases for:
- Valid and invalid request payloads
- Boundary value testing
- Authentication failures
- Server errors and timeouts
- Data consistency checks
- Performance and load considerations

IMPORTANT: Return ONLY a valid JSON array of test case objects. Do not include any explanatory text, markdown formatting, or code blocks. The response must start with '[' and end with ']'.

Example format:
[
  {
    "title": "API endpoint test case",
    "description": "Test API functionality",
    "preconditions": "API server running and accessible",
    "steps": [
      {
        "action": "Send HTTP request to endpoint",
        "expectedResult": "Receive expected HTTP status code"
      }
    ],
    "expectedResult": "API responds correctly",
    "priority": "medium",
    "tags": ["api", "http", "integration"]
  }
]`,
          no: `Du er en API-testekspert. Generer omfattende API-testtilfeller.

Fokuser på:
- HTTP-metoder (GET, POST, PUT, DELETE, PATCH)
- Forespørsel/svar-validering
- Statuskoder og feilhåndtering
- Autentisering og autorisasjon
- Dataformat-validering (JSON, XML)
- Parameter-validering
- Hastighetsbegrensning og struping
- API-versjonering
- Integrasjons-testscenarier

Inkluder testtilfeller for:
- Gyldige og ugyldige forespørsel-payloads
- Grenseverdi-testing
- Autentiseringsfeil
- Serverfeil og tidsavbrudd
- Datakonsistens-sjekker
- Ytelse og last-betraktninger

VIKTIG: Returner KUN et gyldig JSON-array av testtilfelle-objekter. Ikke inkluder forklarende tekst, markdown-formatering eller kodeblokker. Responsen må starte med '[' og slutte med ']'.

Eksempelformat:
[
  {
    "title": "API endepunkt testtilfelle",
    "description": "Test API funksjonalitet",
    "preconditions": "API server kjører og er tilgjengelig",
    "steps": [
      {
        "action": "Send HTTP forespørsel til endepunkt",
        "expectedResult": "Motta forventet HTTP statuskode"
      }
    ],
    "expectedResult": "API svarer korrekt",
    "priority": "medium",
    "tags": ["api", "http", "integrasjon"]
  }
]`
        },
        userPromptPrefix: {
          en: 'Create API test cases for:',
          no: 'Lag API testtilfeller for:'
        },
        focusAreas: ['happy_path', 'edge_cases', 'error_handling', 'security_testing'],
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'security_testing',
        name: {
          en: 'Security Testing',
          no: 'Sikkerhetstesting'
        },
        description: {
          en: 'Security-focused test cases for authentication, authorization, and data protection',
          no: 'Sikkerhetsfokuserte testtilfeller for autentisering, autorisasjon og databeskyttelse'
        },
        category: 'security_testing',
        systemPrompt: {
          en: `You are a security testing specialist. Create test cases focused on application security.

Focus on:
- Authentication and session management
- Authorization and access controls
- Input validation and sanitization
- SQL injection prevention
- Cross-site scripting (XSS) protection
- CSRF protection
- Data encryption and storage
- Password policies and security
- User privilege escalation
- Sensitive data exposure

Include security test scenarios for:
- Login/logout security
- Session timeout and management
- Role-based access control
- Data validation and filtering
- Error message information disclosure
- File upload security
- API security testing

Format with security-specific validation points and risk assessments.`,
          no: `Du er en sikkerhetstesting-spesialist. Lag testtilfeller fokusert på applikasjonssikkerhet.

Fokuser på:
- Autentisering og sesjonshåndtering
- Autorisasjon og tilgangskontroll
- Inndata-validering og sanering
- SQL-injeksjon forebygging
- Kryssnettsted-scripting (XSS) beskyttelse
- CSRF-beskyttelse
- Datakryptering og lagring
- Passordpolicyer og sikkerhet
- Brukerrettighet-eskalering
- Sensitiv data-eksponering

Inkluder sikkerhets-testscenarier for:
- Innlogging/utlogging sikkerhet
- Sesjon timeout og håndtering
- Rollebasert tilgangskontroll
- Datavalidering og filtrering
- Feilmelding informasjonsavsløring
- Filopplasting sikkerhet
- API sikkerhetstesting

Formater med sikkerhets-spesifikke valideringspunkter og risikovurderinger.`
        },
        userPromptPrefix: {
          en: 'Create security test cases for:',
          no: 'Lag sikkerhets testtilfeller for:'
        },
        focusAreas: ['security_testing', 'edge_cases', 'error_handling'],
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'mobile_testing',
        name: {
          en: 'Mobile Testing',
          no: 'Mobil Testing'
        },
        description: {
          en: 'Mobile-specific test cases covering device compatibility, touch interactions, and mobile UX',
          no: 'Mobil-spesifikke testtilfeller som dekker enhetskompatibilitet, berøringsinteraksjoner og mobil UX'
        },
        category: 'mobile_testing',
        systemPrompt: {
          en: `You are a mobile testing specialist. Create comprehensive mobile application test cases.

Focus on:
- Touch gestures and interactions
- Device orientation changes
- Screen sizes and resolutions
- Operating system compatibility
- App lifecycle (background/foreground)
- Network connectivity scenarios
- Battery usage and performance
- Push notifications
- Device permissions and access
- Offline functionality

Include mobile-specific scenarios:
- Gesture recognition (swipe, pinch, tap)
- Keyboard input and autocomplete
- Camera and media access
- GPS and location services
- Device storage and memory
- App store compliance
- Cross-platform consistency

Format with mobile-specific validation criteria and device considerations.`,
          no: `Du er en mobiltesting-spesialist. Lag omfattende mobil applikasjon testtilfeller.

Fokuser på:
- Berøringsgester og interaksjoner
- Enhetsorientering endringer
- Skjermstørrelser og oppløsninger
- Operativsystem kompatibilitet
- App-livssyklus (bakgrunn/forgrunn)
- Nettverkstilkobling scenarier
- Batteribruk og ytelse
- Push-varsler
- Enhetstillatelser og tilgang
- Offline funksjonalitet

Inkluder mobil-spesifikke scenarier:
- Gestgjenkjenning (sveip, klyp, trykk)
- Tastaturinngang og autofullføring
- Kamera og media tilgang
- GPS og posisjonstjenester
- Enhetslagring og minne
- App-butikk compliance
- Kryssplattform konsistens

Formater med mobil-spesifikke valideringskriterier og enhetsbetraktninger.`
        },
        userPromptPrefix: {
          en: 'Create mobile test cases for:',
          no: 'Lag mobil testtilfeller for:'
        },
        focusAreas: ['happy_path', 'edge_cases', 'performance_testing', 'accessibility'],
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }

  private loadCustomTemplates(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('custom_prompt_templates')
      if (saved) {
        try {
          const customTemplates: PromptTemplate[] = JSON.parse(saved)
          this.templates.push(...customTemplates)
        } catch (error) {
          console.error('Failed to load custom templates:', error)
        }
      }
    }
  }

  private saveCustomTemplates(): void {
    if (typeof window !== 'undefined') {
      const customTemplates = this.templates.filter(t => t.isCustom)
      localStorage.setItem('custom_prompt_templates', JSON.stringify(customTemplates))
    }
  }

  getAllTemplates(): PromptTemplate[] {
    return [...this.templates]
  }

  getTemplatesByCategory(category: TemplateCategory): PromptTemplate[] {
    return this.templates.filter(t => t.category === category)
  }

  getTemplate(id: string): PromptTemplate | null {
    return this.templates.find(t => t.id === id) || null
  }

  createTemplate(template: Omit<PromptTemplate, 'id' | 'isCustom' | 'createdAt' | 'updatedAt'>): PromptTemplate {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.templates.push(newTemplate)
    this.saveCustomTemplates()
    return newTemplate
  }

  updateTemplate(id: string, updates: Partial<PromptTemplate>): PromptTemplate | null {
    const index = this.templates.findIndex(t => t.id === id)
    if (index === -1) return null

    const template = this.templates[index]
    if (!template.isCustom) {
      throw new Error('Cannot modify default templates')
    }

    this.templates[index] = {
      ...template,
      ...updates,
      id: template.id,
      isCustom: true,
      createdAt: template.createdAt,
      updatedAt: new Date().toISOString()
    }

    this.saveCustomTemplates()
    return this.templates[index]
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id)
    if (index === -1) return false

    const template = this.templates[index]
    if (!template.isCustom) {
      throw new Error('Cannot delete default templates')
    }

    this.templates.splice(index, 1)
    this.saveCustomTemplates()
    return true
  }

  getPrompt(templateId: string, language: Language, userInput: string): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template with ID "${templateId}" not found`)
    }

    const systemPrompt = template.systemPrompt[language]
    const userPrefix = template.userPromptPrefix[language]
    
    return `${systemPrompt}\n\n${userPrefix}\n\n${userInput}`
  }

  getSystemPromptPreview(templateId: string, language: Language, maxLength: number = 300): string {
    const template = this.getTemplate(templateId)
    if (!template) return ''
    
    const systemPrompt = template.systemPrompt[language]
    if (systemPrompt.length <= maxLength) {
      return systemPrompt
    }
    
    return systemPrompt.substring(0, maxLength) + '...'
  }

  getUserPromptFormat(templateId: string, language: Language): string {
    const template = this.getTemplate(templateId)
    if (!template) return ''
    
    return template.userPromptPrefix[language]
  }

  getCompletePromptExample(templateId: string, language: Language, sampleInput?: string): string {
    const template = this.getTemplate(templateId)
    if (!template) return ''
    
    const defaultSamples = {
      en: 'User login functionality with email and password validation',
      no: 'Brukerinnlogging funksjonalitet med e-post og passord validering'
    }
    
    const input = sampleInput || defaultSamples[language]
    return this.getPrompt(templateId, language, input)
  }

  estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English, ~6 for Norwegian
    // This is a simplified estimation, real tokenization is more complex
    const avgCharsPerToken = text.includes('ø') || text.includes('å') || text.includes('æ') ? 6 : 4
    return Math.ceil(text.length / avgCharsPerToken)
  }

  getPromptStatistics(templateId: string, language: Language, userInput: string = '') {
    const template = this.getTemplate(templateId)
    if (!template) {
      return {
        systemPromptLength: 0,
        userPrefixLength: 0,
        totalLength: 0,
        estimatedTokens: 0,
        focusAreasCount: 0
      }
    }

    const systemPrompt = template.systemPrompt[language]
    const userPrefix = template.userPromptPrefix[language]
    const completePrompt = userInput ? this.getPrompt(templateId, language, userInput) : `${systemPrompt}\n\n${userPrefix}`
    
    return {
      systemPromptLength: systemPrompt.length,
      userPrefixLength: userPrefix.length,
      totalLength: completePrompt.length,
      estimatedTokens: this.estimateTokenCount(completePrompt),
      focusAreasCount: template.focusAreas.length,
      category: template.category,
      templateName: template.name[language]
    }
  }

  getPromptGuidelines(language: Language): {title: string, guidelines: string[]} {
    if (language === 'no') {
      return {
        title: 'Retningslinjer for optimal promptinput',
        guidelines: [
          'Vær spesifikk og detaljert i beskrivelsen din',
          'Inkluder kontekst om brukergrupper og mål',
          'Nevn tekniske krav eller begrensninger',
          'Beskriv forventet oppførsel og edge cases',
          'Bruk eksempler for å illustrere komplekse scenarier',
          'Spesifiser prioritetsnivå hvis relevant'
        ]
      }
    }
    
    return {
      title: 'Guidelines for Optimal Prompt Input',
      guidelines: [
        'Be specific and detailed in your description',
        'Include context about user groups and goals',
        'Mention technical requirements or constraints',
        'Describe expected behavior and edge cases',
        'Use examples to illustrate complex scenarios',
        'Specify priority level if relevant'
      ]
    }
  }

  exportTemplates(): string {
    const customTemplates = this.templates.filter(t => t.isCustom)
    return JSON.stringify(customTemplates, null, 2)
  }

  importTemplates(jsonData: string): { success: number; errors: string[] } {
    const results = { success: 0, errors: [] as string[] }
    
    try {
      const importedTemplates: PromptTemplate[] = JSON.parse(jsonData)
      
      for (const template of importedTemplates) {
        try {
          // Validate template structure
          if (!template.name || !template.systemPrompt || !template.userPromptPrefix) {
            results.errors.push(`Invalid template structure: ${template.id || 'unknown'}`)
            continue
          }

          // Create new template (generates new ID)
          this.createTemplate({
            name: template.name,
            description: template.description,
            category: template.category,
            systemPrompt: template.systemPrompt,
            userPromptPrefix: template.userPromptPrefix,
            focusAreas: template.focusAreas || []
          })
          
          results.success++
        } catch (error) {
          results.errors.push(`Failed to import template: ${error.message}`)
        }
      }
    } catch (error) {
      results.errors.push(`Invalid JSON format: ${error.message}`)
    }

    return results
  }
}