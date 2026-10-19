/**
 * Ultra-resilient, intelligent speech-to-digits parser with phonetic near-miss matching
 * and expected-digit candidate scoring to eliminate false mistake detections.
 */

// Primary word to digit mapping
const WORD_TO_DIGIT: Record<string, string> = {
  // Indonesian 0
  nol: '0',
  kosong: '0',
  song: '0',
  gosong: '0',
  tol: '0',
  pol: '0',

  // Indonesian 1
  satu: '1',
  sa: '1',
  ji: '1',
  wahid: '1',
  satuan: '1',
  satunya: '1',
  suatu: '1',
  sabtu: '1',

  // Indonesian 2
  dua: '2',
  du: '2',
  ro: '2',
  do: '2',
  duanya: '2',
  jua: '2',
  tua: '2',
  doa: '2',

  // Indonesian 3
  tiga: '3',
  ga: '3',
  ti: '3',
  tiganya: '3',
  tiba: '3',
  jika: '3',

  // Indonesian 4
  empat: '4',
  pat: '4',
  mpat: '4',
  empatnya: '4',
  tempat: '4',
  tepat: '4',
  dapat: '4',
  hebat: '4',
  lompat: '4',

  // Indonesian 5
  lima: '5',
  ma: '5',
  lim: '5',
  limanya: '5',
  bima: '5',
  pima: '5',
  dima: '5',

  // Indonesian 6
  enam: '6',
  nam: '6',
  nem: '6',
  enamnya: '6',
  inam: '6',
  imam: '6',
  senam: '6',

  // Indonesian 7
  tujuh: '7',
  juh: '7',
  tu: '7',
  tuju: '7',
  tujuhnya: '7',
  tubuh: '7',
  tuduh: '7',
  tunjuk: '7',
  setuju: '7',
  tujoh: '7',

  // Indonesian 8
  delapan: '8',
  lapan: '8',
  pan: '8',
  dapan: '8',
  delapannya: '8',
  depan: '8',
  dilepan: '8',

  // Indonesian 9
  sembilan: '9',
  lan: '9',
  milan: '9',
  bilan: '9',
  sembi: '9',
  sembilannya: '9',
  sembilang: '9',
  sembilin: '9',

  // English 0-9
  zero: '0',
  oh: '0',
  one: '1',
  won: '1',
  two: '2',
  to: '2',
  too: '2',
  three: '3',
  tree: '3',
  four: '4',
  for: '4',
  fore: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  ate: '8',
  nine: '9',
};

// Compound words without spaces
const COMPOUND_WORDS: Record<string, string[]> = {
  sepuluh: ['1', '0'],
  sebelas: ['1', '1'],
  duabelas: ['1', '2'],
  tigabelas: ['1', '3'],
  empatbelas: ['1', '4'],
  limabelas: ['1', '5'],
  enambelas: ['1', '6'],
  tujuhbelas: ['1', '7'],
  delapanbelas: ['1', '8'],
  sembilanbelas: ['1', '9'],

  duapuluh: ['2', '0'],
  tigapuluh: ['3', '0'],
  empatpuluh: ['4', '0'],
  limapuluh: ['5', '0'],
  enampuluh: ['6', '0'],
  tujuhpuluh: ['7', '0'],
  delapanpuluh: ['8', '0'],
  sembilanpuluh: ['9', '0'],

  ten: ['1', '0'],
  eleven: ['1', '1'],
  twelve: ['1', '2'],
  thirteen: ['1', '3'],
  fourteen: ['1', '4'],
  fifteen: ['1', '5'],
  sixteen: ['1', '6'],
  seventeen: ['1', '7'],
  eighteen: ['1', '8'],
  nineteen: ['1', '9'],
  twenty: ['2', '0'],
  thirty: ['3', '0'],
  forty: ['4', '0'],
  fifty: ['5', '0'],
  sixty: ['6', '0'],
  seventy: ['7', '0'],
  eighty: ['8', '0'],
  ninety: ['9', '0'],
};

// Filler / natural speech words to ignore safely
const IGNORED_WORDS = new Set([
  'koma',
  'titik',
  'dan',
  'lalu',
  'terus',
  'point',
  'dot',
  'and',
  'uh',
  'um',
  'eh',
  'ya',
  'ok',
  'oke',
]);

/**
 * Extracts digits from a single transcript string.
 */
export function parseSpeechToDigits(transcript: string): string[] {
  if (!transcript) return [];

  let normalized = transcript
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .trim();

  // Strip leading "3 koma" or "3 titik" or "3 point" or "tiga koma" at the very start
  normalized = normalized
    .replace(/^(3|tiga|three)\s*(koma|titik|point|dot)/i, '')
    .trim();

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const result: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (IGNORED_WORDS.has(token)) {
      continue;
    }

    // Case 1: Token contains literal digits
    if (/\d/.test(token)) {
      const digitsOnly = token.replace(/\D/g, '');
      for (const d of digitsOnly) {
        result.push(d);
      }
      continue;
    }

    // Case 2: Compound words
    if (COMPOUND_WORDS[token]) {
      result.push(...COMPOUND_WORDS[token]);
      continue;
    }

    // Case 3: Indonesian compounds "X belas", "X puluh"
    if (i + 1 < tokens.length) {
      const nextToken = tokens[i + 1];

      if (nextToken === 'belas') {
        const base = WORD_TO_DIGIT[token];
        if (base) {
          result.push('1', base);
          i++;
          continue;
        }
      } else if (nextToken === 'puluh') {
        const base = WORD_TO_DIGIT[token];
        if (base) {
          result.push(base);
          i++;
          if (i + 1 < tokens.length) {
            const unitToken = tokens[i + 1];
            const unitDigit = WORD_TO_DIGIT[unitToken];
            if (unitDigit) {
              result.push(unitDigit);
              i++;
            }
          }
          continue;
        }
      }
    }

    // Case 4: Direct dictionary match
    const singleDigit = WORD_TO_DIGIT[token];
    if (singleDigit) {
      result.push(singleDigit);
    }
  }

  return result;
}

/**
 * Multi-alternative evaluation:
 * Given multiple speech alternatives for an utterance and the expected next digit,
 * verifies if ANY alternative matches the expected digit.
 * This guarantees that minor acoustic misrecognitions (e.g. "tubuh" vs "tujuh", "tempat" vs "empat")
 * never cause a false mistake!
 */
export function extractDigitsWithExpectedTarget(
  candidateTranscripts: string[],
  expectedDigit?: string
): string[] {
  if (!candidateTranscripts || candidateTranscripts.length === 0) return [];

  // Parse each alternative
  const candidatesParsed = candidateTranscripts.map((t) => parseSpeechToDigits(t));

  // If no expected digit specified, return primary candidate
  if (!expectedDigit) {
    return candidatesParsed[0] || [];
  }

  // If the primary candidate already contains the expected digit as its first digit, return it!
  const primary = candidatesParsed[0] || [];
  if (primary.length > 0 && primary[0] === expectedDigit) {
    return primary;
  }

  // Check other alternatives: did ANY alternative produce the expected digit?
  for (let i = 1; i < candidatesParsed.length; i++) {
    const alt = candidatesParsed[i];
    if (alt && alt.length > 0 && alt[0] === expectedDigit) {
      // An alternative hypothesis correctly identified the expected digit!
      // Return this alternative to prevent a false error.
      return alt;
    }
  }

  // Fallback to primary candidate
  return primary;
}
