import { executeQuery } from './database';

/**
 * Get a system setting value
 */
export async function getSystemSetting(key: string): Promise<string | boolean | number | null> {
  try {
    const result = await executeQuery(
      'SELECT setting_value, setting_type FROM system_settings WHERE setting_key = ?',
      [key]
    ) as Array<{ setting_value: string | null; setting_type: string }>;

    if (result.length === 0) {
      return null;
    }

    const { setting_value, setting_type } = result[0];

    if (setting_value === null) {
      return null;
    }

    switch (setting_type) {
      case 'boolean':
        return setting_value === 'true';
      case 'number':
        return Number(setting_value) || 0;
      default:
        return setting_value;
    }
  } catch (error) {
    console.error(`Error getting system setting '${key}':`, error);
    return null;
  }
}

/**
 * Check if removal email notifications are enabled
 */
export async function isRemovalEmailEnabled(): Promise<boolean> {
  const value = await getSystemSetting('send_removal_email');
  // Default to true if setting doesn't exist
  return value === null ? true : value === true;
}

/**
 * Check if appointment email notifications are enabled
 */
export async function isAppointmentEmailEnabled(): Promise<boolean> {
  const value = await getSystemSetting('send_appointment_email');
  // Default to true if setting doesn't exist
  return value === null ? true : value === true;
}
