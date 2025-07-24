module.exports = {
  // Consumer configuration
  consumer: {
    name: 'QA Test Manager Frontend',
  },
  
  // Provider configurations
  providers: [
    {
      name: 'QA Test Manager API',
      baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    },
    {
      name: 'GitHub API',
      baseUrl: 'https://api.github.com',
    },
  ],
  
  // Pact broker configuration (optional)
  broker: {
    url: process.env.PACT_BROKER_URL,
    username: process.env.PACT_BROKER_USERNAME,
    password: process.env.PACT_BROKER_PASSWORD,
    publishVerificationResult: process.env.CI === 'true',
  },
  
  // Log configuration
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: './logs',
  },
  
  // Contract directory
  contractsDir: './pacts',
  
  // Specification version
  spec: 2,
  
  // Tags for versioning
  tags: process.env.GIT_BRANCH ? [process.env.GIT_BRANCH] : ['main'],
  
  // Consumer version
  consumerVersion: process.env.GIT_COMMIT || '1.0.0',
};