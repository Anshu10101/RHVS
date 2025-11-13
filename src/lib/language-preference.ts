import { executeQuery } from '@/lib/database';

type LanguageCode = 'hi' | 'en';

interface LanguagePreferenceOptions {
  stateId?: number | null;
  stateName?: string | null;
}

/**
 * Resolves the preferred language for a given state. Falls back to Hindi.
 */
export async function getStateLanguagePreference(
  options: LanguagePreferenceOptions
): Promise<LanguageCode> {
  const { stateId, stateName } = options;

  if (typeof stateId === 'number' && !Number.isNaN(stateId)) {
    const rows = await executeQuery(
      'SELECT language_pref FROM states WHERE id = ? LIMIT 1',
      [stateId]
    ) as Array<{ language_pref: number | null }>;

    const pref = rows[0]?.language_pref;
    if (pref === 0) return 'en';
    if (pref === 1) return 'hi';
  }

  if (stateName) {
    const trimmedName = stateName.trim();
    if (trimmedName.length > 0) {
      const rows = await executeQuery(
        'SELECT language_pref FROM states WHERE state_name_english = ? LIMIT 1',
        [trimmedName]
      ) as Array<{ language_pref: number | null }>;

      const pref = rows[0]?.language_pref;
      if (pref === 0) return 'en';
      if (pref === 1) return 'hi';
    }
  }

  return 'hi';
}


