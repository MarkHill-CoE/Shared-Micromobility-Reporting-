import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { PiiScrubMetadata } from '../types/report.ts';

export interface ScrubResult {
  scrubbedText: string;
  metadata: PiiScrubMetadata;
}

const CATEGORY_MAP: Record<string, string> = {
  '[REDACTED_EMAIL]': 'Email Address',
  '[REDACTED_PHONE]': 'Phone Number',
  '[REDACTED_ADDRESS]': 'Street Address',
  '[REDACTED_NAME]': 'Contact Name',
  '[REDACTED_PLATE]': 'Licence Plate',
  '[REDACTED_PII]': 'Personal Information',
};

/**
 * Deterministic defense-in-depth regex scrubber for emails, phone numbers,
 * street addresses, postal codes, licence plates, and contextual contact names.
 */
function applyRegexScrubbing(input: string): {
  text: string;
  categories: Set<string>;
} {
  let text = input;
  const categories = new Set<string>();

  // 1. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  if (emailRegex.test(text)) {
    categories.add('Email Address');
    text = text.replace(emailRegex, '[REDACTED_EMAIL]');
  }

  // 2. Phone numbers (North American & international formats; avoids ISO dates like 2026-11-12)
  const phoneRegex =
    /(?:(?:\+?\d{1,3}[-.\s]?)?\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}|(?:\+?1[-.\s]?)?\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\b\d{10}\b|\b\d{3}[-.]\d{4}\b)(?:\s*(?:ext\.?|x|#)\s*\d{1,5})?/gi;
  if (phoneRegex.test(text)) {
    categories.add('Phone Number');
    text = text.replace(phoneRegex, '[REDACTED_PHONE]');
  }

  // 3. Canadian Postal Codes (e.g., T5J 0N3, T5J0N3)
  const postalCodeRegex =
    /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][-\s]?\d[ABCEGHJ-NPRSTV-Z]\d\b/gi;
  if (postalCodeRegex.test(text)) {
    categories.add('Street Address');
    text = text.replace(postalCodeRegex, '[REDACTED_ADDRESS]');
  }

  // 4. Street addresses (house/building numbers + street name + suffix, or Edmonton numbered avenues/streets)
  const unitStreetRegex =
    /(?:(?:apt|apartment|unit|suite|ste|#)\s*[A-Za-z0-9-]+[,\s]+)?\b\d{1,6}(?:[-\s]\d{1,4})?\s+(?:[NSEW]{1,2}\s+)?(?:[A-Za-z0-9'.-]+\s+){1,4}(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Crescent|Cres\.?|Way|Lane|Ln\.?|Court|Ct\.?|Place|Pl\.?|Trail|Trl\.?|Parkway|Pkwy\.?|Terrace|Terr\.?|Close|Cl\.?|Gate|Grove|Point|Pt\.?|Circle|Cir\.?|Alley|Walk|Row|Mews)\b(?:\s+(?:NW|NE|SW|SE|N|S|E|W))?(?:\s*,?\s*(?:Edmonton|AB|Alberta))?/gi;
  if (unitStreetRegex.test(text)) {
    categories.add('Street Address');
    text = text.replace(unitStreetRegex, '[REDACTED_ADDRESS]');
  }

  const edmontonNumberedAddressRegex =
    /\b\d{1,5}\s+\d{2,3}(?:st|nd|rd|th)?\s+(?:Street|St\.?|Avenue|Ave\.?)\b(?:\s+(?:NW|NE|SW|SE))?/gi;
  if (edmontonNumberedAddressRegex.test(text)) {
    categories.add('Street Address');
    text = text.replace(edmontonNumberedAddressRegex, '[REDACTED_ADDRESS]');
  }

  // 5. Licence plate numbers (explicit plate references and Alberta 3-letter + 3/4-digit patterns)
  const explicitPlateRegex =
    /\b(?:licen[cs]e\s*plate(?:\s*(?:no\.?|number|#))?|plate\s*(?:no\.?|number|#)?)\s*(?:is|was|:|#|-)?\s*([A-Z0-9]{2,4}[-\s]?[A-Z0-9]{2,4})\b/gi;
  if (explicitPlateRegex.test(text)) {
    categories.add('Licence Plate');
    text = text.replace(explicitPlateRegex, (match, plateCode) =>
      match.replace(plateCode, '[REDACTED_PLATE]')
    );
  }

  const standalonePlateRegex =
    /\b(?!(?:LM|BRD|EDM|RPT)\b)[A-Z]{3}[-\s]?\d{3,4}\b/g;
  if (standalonePlateRegex.test(text)) {
    categories.add('Licence Plate');
    text = text.replace(standalonePlateRegex, '[REDACTED_PLATE]');
  }

  // 6. Contextual contact names and honorifics (trigger phrase case-insensitive, name words require Capitalized initials)
  const contextualNameRegex =
    /\b(my name is|name is|i am|i'm|this is|reported by|contact(?:\s+person)?(?:\s+is)?|call(?:\s+me)?|ask for|signed|sincerely|regards|thanks,?|thank you,?)\s+([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){0,2})\b/g;
  const contextualNameTriggerRegex =
    /\b([Mm]y name is|[Nn]ame is|[Ii] am|[Ii]'m|[Tt]his is|[Rr]eported by|[Cc]ontact(?:\s+person)?(?:\s+is)?|[Cc]all(?:\s+me)?|[Aa]sk for|[Ss]igned|[Ss]incerely|[Rr]egards|[Tt]hanks,?|[Tt]hank you,?)\s+([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){0,2})\b/g;
  if (contextualNameTriggerRegex.test(text)) {
    categories.add('Contact Name');
    text = text.replace(contextualNameTriggerRegex, '$1 [REDACTED_NAME]');
  } else if (contextualNameRegex.test(text)) {
    categories.add('Contact Name');
    text = text.replace(contextualNameRegex, '$1 [REDACTED_NAME]');
  }

  const honorificNameRegex =
    /\b(?:Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?)\s+[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?\b/g;
  if (honorificNameRegex.test(text)) {
    categories.add('Contact Name');
    text = text.replace(honorificNameRegex, '[REDACTED_NAME]');
  }

  return { text, categories };
}

/**
 * Counts redaction tokens present in scrubbed text and derives category names.
 */
function collectRedactionStats(
  scrubbedText: string,
  extraCategories: Iterable<string> = []
): { count: number; categories: string[] } {
  const categories = new Set<string>(extraCategories);
  let count = 0;

  const tokenMatches = scrubbedText.match(/\[REDACTED_[A-Z_]+\]/g) || [];
  for (const token of tokenMatches) {
    count += 1;
    categories.add(CATEGORY_MAP[token] || 'Personal Information');
  }

  return {
    count,
    categories: Array.from(categories),
  };
}

/**
 * Scrubs personally identifiable information (email addresses, phone numbers,
 * street addresses, contact names, licence plate numbers) from issue description text.
 * Uses Gemini 4 Hydrogen on the server when GEMINI_API_KEY is available, followed by
 * a deterministic regex pass for defense-in-depth.
 */
export async function scrubPiiText(rawText: string): Promise<ScrubResult> {
  const trimmed = (rawText || '').trim();
  const scrubbedAt = new Date().toISOString();

  if (!trimmed) {
    return {
      scrubbedText: '',
      metadata: {
        scrubbed: false,
        redactedCount: 0,
        redactedCategories: [],
        method: 'regex',
        scrubbedAt,
      },
    };
  }

  let workingText = trimmed;
  let usedGemini = false;
  const detectedFromAi: string[] = [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Scrub all personally identifiable information (PII) from the following e-scooter / e-bike issue description:\n\n"""\n${trimmed}\n"""`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a strict municipal privacy redaction filter. Rewrite the input text keeping every non-PII factual detail about the e-scooter or e-bike issue intact, while replacing ALL personally identifiable information with exact placeholder tags:\n' +
            '- Email addresses -> [REDACTED_EMAIL]\n' +
            '- Phone numbers -> [REDACTED_PHONE]\n' +
            '- Street addresses, house/building numbers with street names, unit/apartment numbers, and postal codes -> [REDACTED_ADDRESS]\n' +
            '- Contact names or any person names -> [REDACTED_NAME]\n' +
            '- Vehicle licence plate numbers -> [REDACTED_PLATE]\n' +
            '- Any other PII -> [REDACTED_PII]\n' +
            'Do NOT redact rental scooter/e-bike vehicle IDs (such as LM-94821 or BRD-44109). Do NOT add commentary or extra sentences. Return JSON strictly matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scrubbedText: {
                type: Type.STRING,
                description: 'The input description with all PII replaced by [REDACTED_*] tags.',
              },
              detectedCategories: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'List of redacted PII categories from: Email Address, Phone Number, Street Address, Contact Name, Licence Plate.',
              },
            },
            required: ['scrubbedText', 'detectedCategories'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      if (typeof parsed.scrubbedText === 'string' && parsed.scrubbedText.trim().length > 0) {
        workingText = parsed.scrubbedText.trim();
        usedGemini = true;
        if (Array.isArray(parsed.detectedCategories)) {
          for (const cat of parsed.detectedCategories) {
            if (typeof cat === 'string' && cat.trim()) {
              detectedFromAi.push(cat.trim());
            }
          }
        }
      }
    } catch (err) {
      console.warn(
        '[PII Scrubber] Gemini redaction unavailable or failed; falling back to deterministic regex scrubber:',
        err instanceof Error ? err.message : err
      );
    }
  }

  // Always apply deterministic regex scrubbing as a defense-in-depth pass
  const regexResult = applyRegexScrubbing(workingText);
  const finalStats = collectRedactionStats(regexResult.text, [
    ...regexResult.categories,
    ...(regexResult.text !== trimmed ? detectedFromAi : []),
  ]);

  return {
    scrubbedText: regexResult.text,
    metadata: {
      scrubbed: regexResult.text !== trimmed || finalStats.count > 0,
      redactedCount: finalStats.count,
      redactedCategories: finalStats.categories,
      method: usedGemini ? 'gemini-and-regex' : 'regex',
      scrubbedAt,
    },
  };
}
