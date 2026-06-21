/**
 * Alert Validator Utility
 * Validates alert severity mapping and normalizes external alert data
 */

interface AlertValidationResult {
  isValid: boolean;
  normalizedSeverity: 'critical' | 'high' | 'medium' | 'low';
  warnings: string[];
}

export class AlertValidator {
  /**
   * Valid severity levels
   */
  private static readonly VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'];

  /**
   * Severity mapping from external sources
   */
  private static readonly SEVERITY_MAPPINGS: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    // PAGASA severities
    'extreme': 'critical',
    'severe': 'high',
    'moderate': 'medium',
    'light': 'low',
    'danger': 'critical',
    'warning': 'high',
    'watch': 'medium',
    'advisory': 'low',
    
    // PhilVolcs alert levels
    'alert_level_4': 'critical',
    'alert_level_3': 'high',
    'alert_level_2': 'medium',
    'alert_level_1': 'low',
    'alert_level_0': 'low',
    
    // NDRRMC severities
    'critical_incident': 'critical',
    'major_incident': 'high',
    'moderate_incident': 'medium',
    'minor_incident': 'low',
  };

  /**
   * Validate alert severity and normalize it
   */
  static validateAndNormalizeSeverity(
    rawSeverity: any
  ): AlertValidationResult {
    const warnings: string[] = [];
    let normalizedSeverity: 'critical' | 'high' | 'medium' | 'low' = 'medium';

    if (!rawSeverity) {
      warnings.push('No severity level provided, defaulting to "medium"');
      return { isValid: true, normalizedSeverity, warnings };
    }

    const rawLower = String(rawSeverity).toLowerCase().trim();

    // Direct match in valid severities
    if (this.VALID_SEVERITIES.includes(rawLower)) {
      normalizedSeverity = rawLower as any;
      return { isValid: true, normalizedSeverity, warnings };
    }

    // Check mapping table
    if (this.SEVERITY_MAPPINGS[rawLower]) {
      normalizedSeverity = this.SEVERITY_MAPPINGS[rawLower];
      warnings.push(`Mapped external severity "${rawSeverity}" to "${normalizedSeverity}"`);
      return { isValid: true, normalizedSeverity, warnings };
    }

    // Fuzzy match based on keywords
    if (
      rawLower.includes('critical') ||
      rawLower.includes('extreme') ||
      rawLower.includes('danger') ||
      rawLower.includes('emergency') ||
      rawLower.includes('level 4') ||
      rawLower.includes('level4')
    ) {
      normalizedSeverity = 'critical';
      warnings.push(`Fuzzy matched external severity "${rawSeverity}" to "critical"`);
      return { isValid: true, normalizedSeverity, warnings };
    }

    if (
      rawLower.includes('high') ||
      rawLower.includes('severe') ||
      rawLower.includes('warning') ||
      rawLower.includes('major') ||
      rawLower.includes('level 3') ||
      rawLower.includes('level3')
    ) {
      normalizedSeverity = 'high';
      warnings.push(`Fuzzy matched external severity "${rawSeverity}" to "high"`);
      return { isValid: true, normalizedSeverity, warnings };
    }

    if (
      rawLower.includes('medium') ||
      rawLower.includes('moderate') ||
      rawLower.includes('watch') ||
      rawLower.includes('caution') ||
      rawLower.includes('level 2') ||
      rawLower.includes('level2')
    ) {
      normalizedSeverity = 'medium';
      warnings.push(`Fuzzy matched external severity "${rawSeverity}" to "medium"`);
      return { isValid: true, normalizedSeverity, warnings };
    }

    if (
      rawLower.includes('low') ||
      rawLower.includes('light') ||
      rawLower.includes('advisory') ||
      rawLower.includes('minor') ||
      rawLower.includes('level 1') ||
      rawLower.includes('level1') ||
      rawLower.includes('level 0') ||
      rawLower.includes('level0')
    ) {
      normalizedSeverity = 'low';
      warnings.push(`Fuzzy matched external severity "${rawSeverity}" to "low"`);
      return { isValid: true, normalizedSeverity, warnings };
    }

    // Default fallback
    warnings.push(`Unknown severity "${rawSeverity}", defaulting to "medium"`);
    return { isValid: true, normalizedSeverity: 'medium', warnings };
  }

  /**
   * Validate numeric severity level (0-4) - PhilVolcs format
   */
  static validateNumericSeverity(level: number): 'critical' | 'high' | 'medium' | 'low' {
    if (level >= 4) return 'critical';
    if (level === 3) return 'high';
    if (level === 2) return 'medium';
    return 'low';
  }

  /**
   * Validate alert title for uniqueness and normalization
   */
  static normalizeAlertTitle(title: string): string {
    if (!title) return 'Untitled Alert';

    // Remove extra whitespace
    let normalized = title.trim().replace(/\s+/g, ' ');

    // Capitalize first letter of each word (title case)
    normalized = normalized.replace(/\b\w/g, (char) => char.toUpperCase());

    // Remove trailing punctuation
    normalized = normalized.replace(/[.,;:!?]+$/, '');

    return normalized;
  }

  /**
   * Check if alert is currently active based on dates
   */
  static isAlertActive(startDate?: string | Date, endDate?: string | Date): boolean {
    const now = new Date();

    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return false;
      }
      if (start > now) {
        return false;
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return true;
      }
      if (end < now) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate alert age in minutes
   */
  static getAlertAgeMinutes(createdAt: string | Date): number {
    const created = new Date(createdAt);
    if (isNaN(created.getTime())) return -1;

    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
  }

  /**
   * Detect if two alerts are duplicates based on normalized title similarity
   */
  static areDuplicateAlerts(title1: string, title2: string, similarity: number = 0.8): boolean {
    const normalized1 = this.normalizeAlertTitle(title1).toLowerCase();
    const normalized2 = this.normalizeAlertTitle(title2).toLowerCase();

    // Exact match
    if (normalized1 === normalized2) return true;

    // Substring match (one contains other)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      const shorter = Math.min(normalized1.length, normalized2.length);
      const longer = Math.max(normalized1.length, normalized2.length);
      if (longer > 0 && shorter / longer >= similarity) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate alert severity mapping for external source
   */
  static validateSeverityMapping(
    sourceValue: any,
    source: 'pagasa' | 'philvolcs' | 'ndrrmc'
  ): AlertValidationResult {
    switch (source) {
      case 'philvolcs':
        // PhilVolcs uses numeric levels 0-4
        if (typeof sourceValue === 'number' && sourceValue >= 0 && sourceValue <= 4) {
          return {
            isValid: true,
            normalizedSeverity: this.validateNumericSeverity(sourceValue),
            warnings: [],
          };
        }
        break;

      case 'pagasa':
      case 'ndrrmc':
        // Use standard severity validation
        return this.validateAndNormalizeSeverity(sourceValue);
    }

    // Fallback
    return this.validateAndNormalizeSeverity(sourceValue);
  }
}
