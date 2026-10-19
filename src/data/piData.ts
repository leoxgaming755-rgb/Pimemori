/**
 * Master data for the Pi sequence provided by the user (1000 decimal digits).
 */

export const RAW_USER_PI_INPUT = `3.1415926535 8979323846 2643383279 5028841971 6939937510
  5820974944 5923078164 0628620899 8628034825 3421170679
  8214808651 3282306647 0938446095 5058223172 5359408128
  4811174502 8410270193 8521105559 6446229489 5493038196
  4428810975 6659334461 2847564823 3786783165 2712019091
  4564856692 3460348610 4543266482 1339360726 0249141273
  7245870066 0631558817 4881520920 9628292540 9171536436
  7892590360 0113305305 4882046652 1384146951 9415116094
  3305727036 5759591953 0921861173 8193261179 3105118548
  0744623799 6274956735 1885752724 8912279381 8301194912 
9833673362 4406566430 8602139494 6395224737 1907021798
  6094370277 0539217176 2931767523 8467481846 7669405132
  0005681271 4526356082 7785771342 7577896091 7363717872
  1468440901 2249534301 4654958537 1050792279 6892589235
  4201995611 2129021960 8640344181 5981362977 4771309960
  5187072113 4999999837 2978049951 0597317328 1609631859
  5024459455 3469083026 4252230825 3344685035 2619311881
  7101000313 7838752886 5875332083 8142061717 7669147303
  5982534904 2875546873 1159562863 8823537875 9375195778
  1857780532 1712268066 1300192787 6611195909 2164201989`;

// Extract digits only after '3.'
const cleanAfterDot = RAW_USER_PI_INPUT.replace(/^.*?3\./s, '').replace(/\D/g, '');

export const PI_DECIMALS = cleanAfterDot;
export const FULL_PI_STRING = `3.${PI_DECIMALS}`;
export const TOTAL_DECIMAL_DIGITS = PI_DECIMALS.length; // 1000 digits

export interface ChunkInfo {
  index: number; // 0, 1, 2...
  startDigit: number; // 1-based (e.g., 1)
  endDigit: number; // 1-based (e.g., 10)
  digits: string;
}

/**
 * Returns chunks grouped by specified size (default: 10 digits per chunk).
 */
export function getPiChunks(chunkSize: number = 10): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  for (let i = 0; i < PI_DECIMALS.length; i += chunkSize) {
    const chunkStr = PI_DECIMALS.slice(i, i + chunkSize);
    chunks.push({
      index: Math.floor(i / chunkSize),
      startDigit: i + 1,
      endDigit: Math.min(i + chunkSize, PI_DECIMALS.length),
      digits: chunkStr,
    });
  }
  return chunks;
}

export const PI_CHUNKS_OF_10 = getPiChunks(10);

/**
 * Milestones for memorization progress
 */
export const MILESTONES = [
  { count: 10, label: 'Pemula Pi (10 Digit)', badge: '🌱' },
  { count: 25, label: 'Penghafal Cermat (25 Digit)', badge: '⭐' },
  { count: 50, label: 'Setengah Abad (50 Digit)', badge: '🔥' },
  { count: 100, label: 'Klub Seratus (100 Digit)', badge: '🏆' },
  { count: 200, label: 'Master Memori (200 Digit)', badge: '⚡' },
  { count: 350, label: 'Ahli Deret (350 Digit)', badge: '💎' },
  { count: 500, label: 'Setengah Ribu (500 Digit)', badge: '👑' },
  { count: 750, label: 'Legenda Pi (750 Digit)', badge: '🌌' },
  { count: 1000, label: 'Grandmaster 1000 Pi', badge: '🪐' },
];
