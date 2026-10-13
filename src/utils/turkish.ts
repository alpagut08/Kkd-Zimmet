/**
 * Turkish string normalization and case-insensitive comparison
 */
export function normalizeTurkish(text: string): string {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .trim();
}

export function turkishIncludes(source: string, search: string): boolean {
  if (!search) return true;
  if (!source) return false;
  return normalizeTurkish(source).includes(normalizeTurkish(search));
}

/**
 * Format ISO date string (YYYY-MM-DD) to Turkish standard (GG.AA.YYYY)
 */
export function formatDateTR(isoDate?: string): string {
  if (!isoDate) return '-';
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${day}.${month}.${year}`;
    }
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Returns current date in YYYY-MM-DD format
 */
export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate renewal date by adding months to an ISO date
 */
export function addMonthsToDate(isoDate: string, months: number): string {
  if (!isoDate || months <= 0) return isoDate;
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    d.setMonth(d.getMonth() + months);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return isoDate;
  }
}

/**
 * Mask TC Identity number for KVKK compliance: e.g. 12345678901 -> 12*******01
 */
export function maskTCKN(tckn?: string): string {
  if (!tckn || tckn.trim().length === 0) return 'Belirtilmedi';
  const clean = tckn.replace(/\D/g, '');
  if (clean.length !== 11) return clean;
  return `${clean.slice(0, 2)}*******${clean.slice(9, 11)}`;
}

/**
 * Validate TC Identity number based on Turkish official algorithm
 */
export function validateTCKN(tckn: string): { valid: boolean; message: string } {
  if (!tckn) {
    return { valid: true, message: '' }; // TC is optional
  }
  const clean = tckn.trim();
  if (clean.length === 0) return { valid: true, message: '' };

  if (!/^\d{11}$/.test(clean)) {
    return { valid: false, message: 'T.C. Kimlik No 11 haneli rakamlardan oluşmalıdır.' };
  }
  if (clean[0] === '0') {
    return { valid: false, message: 'T.C. Kimlik No ilk basamağı 0 olamaz.' };
  }

  const digits = clean.split('').map(Number);

  // 1, 3, 5, 7, 9. basamaklar toplamı
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  // 2, 4, 6, 8. basamaklar toplamı
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  // 10. basamak kontrolü: ((oddSum * 7) - evenSum) % 10 === digits[9]
  const digit10 = (oddSum * 7 - evenSum) % 10;
  const normalizedDigit10 = digit10 < 0 ? digit10 + 10 : digit10;

  if (normalizedDigit10 !== digits[9]) {
    return { valid: false, message: 'Geçersiz T.C. Kimlik Numarası (Algoritma doğrulanamadı).' };
  }

  // 11. basamak kontrolü: ilk 10 basamak toplamı % 10 === digits[10]
  const first10Sum = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  if (first10Sum % 10 !== digits[10]) {
    return { valid: false, message: 'Geçersiz T.C. Kimlik Numarası (Kontrol hanesi tutarsız).' };
  }

  return { valid: true, message: 'Geçerli T.C. Kimlik No' };
}

/**
 * Check if a date is overdue or due within 30 days
 */
export function getExpiryStatus(renewalDate?: string): {
  status: 'valid' | 'due-soon' | 'expired' | 'none';
  daysLeft: number;
  label: string;
} {
  if (!renewalDate) {
    return { status: 'none', daysLeft: 9999, label: 'Süresiz / Belirtilmedi' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(renewalDate);
  target.setHours(0, 0, 0, 0);

  if (isNaN(target.getTime())) {
    return { status: 'none', daysLeft: 9999, label: '-' };
  }

  const diffMs = target.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: 'expired',
      daysLeft,
      label: `Süresi ${Math.abs(daysLeft)} gün geçti!`,
    };
  } else if (daysLeft <= 30) {
    return {
      status: 'due-soon',
      daysLeft,
      label: `${daysLeft} gün kaldı (Yenileme Yaklaştı)`,
    };
  } else {
    return {
      status: 'valid',
      daysLeft,
      label: `${daysLeft} gün kaldı`,
    };
  }
}

/**
 * Generate a formal Form number (e.g. KKD-2026-0001)
 */
export function generateFormNo(index: number = 1): string {
  const year = new Date().getFullYear();
  return `KKD-${year}-${String(index).padStart(4, '0')}`;
}
