export class LicenseManager {
  static validateLicense(key?: string) {
    return {
      isValid: true,
      error: null,
      daysRemaining: 30,
      license: { type: 'premium' }
    };
  }

  static validateLicenseKey(key: string) {
    return {
      isValid: true,
      error: null
    };
  }

  static activateLicense(key: string, userData?: { name: string; email: string }) {
    return {
      success: true,
      error: null
    };
  }

  static getCurrentLicense(key?: string) {
    return {
      isValid: true,
      daysRemaining: 30,
      license: { type: 'premium' },
      error: null,
      success: true
    };
  }

  static hasFeature(feature: string): boolean {
    return true;
  }

  static async getLicenseData() { 
    return { isValid: true, type: 'trial' }; 
  }

  static async checkLicenseExpiry() { 
    return false; 
  }
}