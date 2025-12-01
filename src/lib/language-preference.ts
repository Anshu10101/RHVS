import { executeQuery } from '@/lib/database';

type LanguageCode = 'hi' | 'en';

interface LanguagePreferenceOptions {
  stateId?: number | null;
  stateName?: string | null;
}

/**
 * Resolves the preferred language for a given state.
 * Returns 'en' if language_pref is 0, 'hi' if 1, otherwise defaults to 'hi'.
 * IMPORTANT: If stateId or stateName is provided, we MUST check the database.
 * Only default to 'hi' if the state is not found in the database.
 */
export async function getStateLanguagePreference(
  options: LanguagePreferenceOptions
): Promise<LanguageCode> {
  const { stateId, stateName } = options;

  // Convert stateId to number if it's a string (common from JSON)
  let numericStateId: number | null = null;
  if (stateId !== null && stateId !== undefined) {
    if (typeof stateId === 'number') {
      numericStateId = stateId;
    } else if (typeof stateId === 'string') {
      const parsed = parseInt(stateId, 10);
      if (!Number.isNaN(parsed)) {
        numericStateId = parsed;
      }
    }
  }

  console.log(`[Language Preference] Resolving language for stateId: ${stateId} (numeric: ${numericStateId}), stateName: ${stateName}`);

  // Try stateId first (more reliable)
  if (numericStateId !== null && !Number.isNaN(numericStateId)) {
    try {
      const rows = await executeQuery(
        'SELECT language_pref FROM states WHERE id = ? LIMIT 1',
        [numericStateId]
      ) as Array<{ language_pref: number | null }>;

      if (rows.length > 0) {
        const pref = rows[0]?.language_pref;
        // language_pref: 0 = English, 1 = Hindi, NULL = default to Hindi
        if (pref === 0) {
          console.log(`[Language Preference] ✅ State ID ${numericStateId} -> English (pref=0)`);
          return 'en';
        }
        if (pref === 1) {
          console.log(`[Language Preference] ✅ State ID ${numericStateId} -> Hindi (pref=1)`);
          return 'hi';
        }
        // If pref is NULL, default to Hindi
        console.log(`[Language Preference] ⚠️ State ID ${numericStateId} -> Hindi (pref=NULL, default)`);
        return 'hi';
      } else {
        console.log(`[Language Preference] ⚠️ State ID ${numericStateId} not found in database`);
      }
    } catch (error) {
      console.error('[Language Preference] ❌ Error querying by stateId:', error);
    }
  } else {
    console.log(`[Language Preference] ⚠️ Invalid stateId: ${stateId} (could not convert to number)`);
  }

  // Try stateName as fallback
  if (stateName) {
    const trimmedName = stateName.trim();
    if (trimmedName.length > 0) {
      try {
        const rows = await executeQuery(
          'SELECT language_pref FROM states WHERE state_name_english = ? LIMIT 1',
          [trimmedName]
        ) as Array<{ language_pref: number | null }>;

        if (rows.length > 0) {
          const pref = rows[0]?.language_pref;
          // language_pref: 0 = English, 1 = Hindi, NULL = default to Hindi
          if (pref === 0) {
            console.log(`[Language Preference] State "${trimmedName}" -> English (pref=0)`);
            return 'en';
          }
          if (pref === 1) {
            console.log(`[Language Preference] State "${trimmedName}" -> Hindi (pref=1)`);
            return 'hi';
          }
          // If pref is NULL, default to Hindi
          console.log(`[Language Preference] State "${trimmedName}" -> Hindi (pref=NULL, default)`);
          return 'hi';
        }
      } catch (error) {
        console.error('[Language Preference] Error querying by stateName:', error);
      }
    }
  }

  // Only default to Hindi if state was not found in database
  console.warn(`[Language Preference] State not found (stateId: ${stateId}, stateName: ${stateName}), defaulting to Hindi`);
  return 'hi';
}


