interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // AWS
  awsRegion: string;
  awsS3Bucket: string;
  awsCloudFrontUrl: string;
  
  // API
  apiBaseUrl: string;
  apiTimeout: number;
  
  // Application
  appName: string;
  appVersion: string;
  enableOffline: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // Security
  jwtExpiry: number;
  encryptionAlgorithm: string;
  
  // Features
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  enableMockData: boolean;
  
  // Integration
  maintenancePortalUrl: string;
  webhookUrl: string;
}

class Environment {
  private config: EnvConfig;
  
  constructor() {
    this.config = {
      // Supabase
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      
      // AWS
      awsRegion: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      awsS3Bucket: import.meta.env.VITE_AWS_S3_BUCKET || '',
      awsCloudFrontUrl: import.meta.env.VITE_AWS_CLOUDFRONT_URL || '',
      
      // API
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
      apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
      
      // Application
      appName: import.meta.env.VITE_APP_NAME || 'SMS Onboarding Portal',
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      enableOffline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
      maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760', 10), // 10MB default
      allowedFileTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf').split(','),
      
      // Security
      jwtExpiry: parseInt(import.meta.env.VITE_JWT_EXPIRY || '86400', 10), // 24 hours default
      encryptionAlgorithm: import.meta.env.VITE_ENCRYPTION_ALGORITHM || 'AES-256-GCM',
      
      // Features
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
      enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
      
      // Integration
      maintenancePortalUrl: import.meta.env.VITE_MAINTENANCE_PORTAL_URL || '',
      webhookUrl: import.meta.env.VITE_WEBHOOK_URL || '',
    };
    
    this.validateConfig();
  }
  
  private validateConfig(): void {
    const requiredFields: (keyof EnvConfig)[] = [
      'supabaseUrl',
      'supabaseAnonKey',
      'apiBaseUrl',
    ];
    
    const missingFields = requiredFields.filter(field => !this.config[field]);
    
    if (missingFields.length > 0) {
      console.warn(`Missing required environment variables: ${missingFields.join(', ')}`);
    }
  }
  
  get(key: keyof EnvConfig): any {
    return this.config[key];
  }
  
  getAll(): EnvConfig {
    return { ...this.config };
  }
  
  isDevelopment(): boolean {
    return import.meta.env.DEV;
  }
  
  isProduction(): boolean {
    return import.meta.env.PROD;
  }
  
  isOfflineEnabled(): boolean {
    return this.config.enableOffline;
  }
  
  isDebugEnabled(): boolean {
    return this.config.enableDebugMode || this.isDevelopment();
  }
}

export const env = new Environment();

// Type-safe environment variable access
export const getEnv = <K extends keyof EnvConfig>(key: K): EnvConfig[K] => {
  return env.get(key);
};