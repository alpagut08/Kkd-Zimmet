import { HazardType, RiskMethod } from '../types';

export interface ScoreEvaluation {
  score: number;
  level: 'Düşük' | 'Orta' | 'Yüksek' | 'Çok Yüksek' | 'Kabul Edilebilir' | 'Olası' | 'Önemli';
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  actionRequired: string;
}

export const MATRIX_5X5_PROBABILITY_OPTIONS = [
  { value: 1, label: '1 - Çok Küçük', meaning: 'Yılda bir kez veya daha az' },
  { value: 2, label: '2 - Küçük', meaning: 'Yılda birkaç kez gerçekleşebilir' },
  { value: 3, label: '3 - Orta', meaning: 'Ayda bir veya birkaç kez gerçekleşebilir' },
  { value: 4, label: '4 - Yüksek', meaning: 'Haftada bir veya vardiya içinde sıkça' },
  { value: 5, label: '5 - Çok Yüksek', meaning: 'Sürekli veya neredeyse kesin' },
];

export const MATRIX_5X5_SEVERITY_OPTIONS = [
  { value: 1, label: '1 - Çok Hafif', meaning: 'İlk yardım gerektirmeyen çizik/hafif sızı' },
  { value: 2, label: '2 - Hafif', meaning: 'İlk yardım gerektiren, iş günü kaybı olmayan yaralanma' },
  { value: 3, label: '3 - Orta', meaning: 'Hastanede tedavi, geçici iş göremezlik (kırık, kesi)' },
  { value: 4, label: '4 - Ciddi', meaning: 'Ağır yaralanma, uzuv kaybı, kalıcı meslek hastalığı' },
  { value: 5, label: '5 - Çok Ciddi', meaning: 'Ölüm veya birden fazla çalışanın ağır yaralanması' },
];

export const FINE_KINNEY_PROBABILITY_OPTIONS = [
  { value: 0.5, label: '0.5 - Çok Zayıf Olasılık', meaning: 'Beklenmez ancak teorik mümkün' },
  { value: 1, label: '1 - Zayıf Olasılık', meaning: 'Çok seyrek gerçekleşir' },
  { value: 3, label: '3 - Muhtemel Değil Fakat Mümkün', meaning: 'Alışılmadık ama olabilir' },
  { value: 6, label: '6 - Kuvvetle Muhtemel', meaning: 'Şaşırtıcı olmayan şekilde gerçekleşir' },
  { value: 10, label: '10 - Beklenir / Kesin', meaning: 'Kaçınılmaz ve sürekli risk' },
];

export const FINE_KINNEY_FREQUENCY_OPTIONS = [
  { value: 0.5, label: '0.5 - Çok Seyrek', meaning: 'Yılda bir veya daha az' },
  { value: 1, label: '1 - Seyrek', meaning: 'Yılda birkaç kez' },
  { value: 2, label: '2 - Bazen', meaning: 'Ayda bir kez' },
  { value: 3, label: '3 - Ara Sıra', meaning: 'Haftada bir kez' },
  { value: 6, label: '6 - Sık Sık', meaning: 'Günde bir veya birkaç kez' },
  { value: 10, label: '10 - Sürekli', meaning: 'Sürekli maruziyet veya tam vardiya' },
];

export const FINE_KINNEY_SEVERITY_OPTIONS = [
  { value: 1, label: '1 - Hafif', meaning: 'İlk yardım gerektiren ufak sıyrık' },
  { value: 3, label: '3 - Önemli', meaning: 'Dış tıp merkezi tedavisi, iş kaybı' },
  { value: 7, label: '7 - Ciddi', meaning: 'Ağır yaralanma, uzuv kaybı' },
  { value: 15, label: '15 - Çok Ciddi', meaning: 'Ölüm' },
  { value: 40, label: '40 - Felaket', meaning: 'Birden çok ölüm' },
];

export function calculateRiskScore(
  method: RiskMethod,
  probability: number,
  severity: number,
  frequency?: number
): ScoreEvaluation {
  if (method === 'FineKinney') {
    const freq = frequency || 1;
    const score = Math.round(probability * freq * severity * 10) / 10;

    if (score < 20) {
      return {
        score,
        level: 'Kabul Edilebilir',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        badgeBg: 'bg-emerald-500',
        badgeText: 'text-white',
        actionRequired: 'Önlem gerekmeyebilir, mevcut durum sürdürülmeli.',
      };
    } else if (score <= 70) {
      return {
        score,
        level: 'Olası',
        colorClass: 'text-yellow-800 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
        badgeBg: 'bg-yellow-500',
        badgeText: 'text-slate-900',
        actionRequired: 'Gözetim altında tutulmalı, standart KKD uygulanmalı.',
      };
    } else if (score <= 200) {
      return {
        score,
        level: 'Önemli',
        colorClass: 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        badgeBg: 'bg-amber-500',
        badgeText: 'text-white',
        actionRequired: 'Kısa vadede önlem alınmalı ve KKD tavizsiz kullanılmalı.',
      };
    } else if (score <= 400) {
      return {
        score,
        level: 'Yüksek',
        colorClass: 'text-orange-900 bg-orange-50 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
        badgeBg: 'bg-orange-600',
        badgeText: 'text-white',
        actionRequired: 'Acil eylem planı yapılmalı, derhal koruyucu tedbirler devreye alınmalı.',
      };
    } else {
      return {
        score,
        level: 'Çok Yüksek',
        colorClass: 'text-rose-900 bg-rose-50 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        badgeBg: 'bg-rose-600',
        badgeText: 'text-white',
        actionRequired: 'Çalışma durdurulmalı, derhal acil önlem alınmalıdır!',
      };
    }
  }

  // 5x5 Matrix Default
  const score = Math.round(probability * severity);

  if (score <= 4) {
    return {
      score,
      level: 'Düşük',
      colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      badgeBg: 'bg-emerald-500',
      badgeText: 'text-white',
      actionRequired: 'Mevcut önlemler yeterli, rutin kontroller sürdürülmelidir.',
    };
  } else if (score <= 9) {
    return {
      score,
      level: 'Orta',
      colorClass: 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-white',
      actionRequired: 'Önlemler planlanmalı, KKD kullanımı denetlenmelidir.',
    };
  } else if (score <= 16) {
    return {
      score,
      level: 'Yüksek',
      colorClass: 'text-orange-900 bg-orange-50 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
      badgeBg: 'bg-orange-600',
      badgeText: 'text-white',
      actionRequired: 'Önemli risk; mühendislik önlemleri ve KKD ivedilikle uygulanmalıdır.',
    };
  } else {
    return {
      score,
      level: 'Çok Yüksek',
      colorClass: 'text-rose-900 bg-rose-50 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      badgeBg: 'bg-rose-600',
      badgeText: 'text-white',
      actionRequired: 'Kabul edilemez risk; acil müdahale gerektirir, risk düşürülmeden çalışılamaz!',
    };
  }
}

/**
 * Noise Level Evaluation based on Turkish OHS Noise Regulation
 */
export function evaluateNoiseLevel(dbA?: number): {
  status: 'safe' | 'lowerAction' | 'upperAction' | 'limitExceeded' | 'none';
  label: string;
  badgeClass: string;
  recommendation: string;
} {
  if (dbA === undefined || dbA === null || dbA <= 0) {
    return {
      status: 'none',
      label: 'Ölçüm Yapılmadı',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      recommendation: 'Ortam gürültü ölçümü yapılması önerilir.',
    };
  }

  if (dbA < 80) {
    return {
      status: 'safe',
      label: `${dbA} dB(A) - Güvenli Eşik`,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      recommendation: '80 dB(A) altında işitme koruyucu zorunlu değildir.',
    };
  } else if (dbA < 85) {
    return {
      status: 'lowerAction',
      label: `${dbA} dB(A) - En Düşük Maruziyet Eylem Değeri`,
      badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
      recommendation:
        'İşveren kulak koruyucu donanımları hazır bulundurmak ve isteyen çalışana temin etmekle yükümlüdür.',
    };
  } else if (dbA < 87) {
    return {
      status: 'upperAction',
      label: `${dbA} dB(A) - En Yüksek Maruziyet Eylem Değeri`,
      badgeClass: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 font-bold',
      recommendation:
        'Kulak koruyucu kullanımı ZORUNLUDUR! Gürültü azaltıcı mühendislik önlemleri planlanmalıdır.',
    };
  } else {
    return {
      status: 'limitExceeded',
      label: `${dbA} dB(A) - MARUZİYET SINIR DEĞERİ AŞILDI!`,
      badgeClass: 'bg-rose-600 text-white font-black animate-pulse',
      recommendation:
        '87 dB(A) sınır değeri aşıldı! Maruziyet derhal sınır değerin altına indirilmeli, yüksek SNR (>31 dB) kulak koruyucu derhal zorunlu kılınmalıdır.',
    };
  }
}
