export type DangerClass = 'Az Tehlikeli' | 'Tehlikeli' | 'Çok Tehlikeli';

export type PPECategory =
  | 'Kafa Koruma'
  | 'İşitme Koruma'
  | 'Göz ve Yüz Koruma'
  | 'Solunum Koruma'
  | 'El ve Kol Koruma'
  | 'Ayak ve Bacak Koruma'
  | 'Vücut ve Giysi Koruma'
  | 'Yüksekten Düşmeyi Önleme'
  | 'Özel / Diğer';

export type PPERiskCategory = 'Kategori I' | 'Kategori II' | 'Kategori III';

export interface AuthorizedPersonnel {
  employerName: string;
  employerTitle: string; // İşveren veya İşveren Vekili
  isgExpertName: string;
  isgExpertCertNo: string; // İSG Katip Belge No / Sertifika No
  isgExpertClass?: 'A' | 'B' | 'C';
  workplaceDoctorName: string; // İşyeri Hekimi
  employeeRepName?: string; // Çalışan Temsilcisi
}

export interface Company {
  id: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  sgkSicilNo: string;
  taxNo: string;
  dangerClass: DangerClass;
  logoUrl?: string; // Base64 data URL
  authorized: AuthorizedPersonnel;
  customCommitmentText?: string;
  createdAt: string;
  updatedAt: string;
}

export type RiskFactor =
  | 'Gürültü (>80 dB)'
  | 'Ahşap / Taş / Metal Tozu'
  | 'Kimyasal / Çözücü / Boya'
  | 'Yüksekte Çalışma (>1.8m)'
  | 'Sıcak Yüzey / Kıvılcım / Alev'
  | 'Elektrik Riski'
  | 'Dönen Aksam / Makine'
  | 'Ağır Parça / Düşme Tehlikesi'
  | 'Kesici / Delici Aletler'
  | 'Titreşimli Aletler';

export interface Employee {
  id: string;
  companyId: string;
  fullName: string;
  tcKimlikNo?: string;
  sicilNo: string;
  department: string;
  jobTitles: string[]; // Can have multiple job roles
  startDate: string; // YYYY-MM-DD
  shoeSize?: string; // e.g. "42"
  clothingSize?: string; // e.g. "L", "XL"
  gloveSize?: string; // e.g. "9", "10"
  helmetMaskNote?: string;
  riskFactors?: RiskFactor[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalOption {
  codeKey: string;
  label: string;
  description: string;
  options: { value: string; label: string; meaning: string }[];
}

export interface PPEItem {
  id: string;
  name: string;
  category: PPECategory;
  standards: string[]; // e.g. ["EN ISO 20345:2022", "SRC"]
  standardTitle: string; // e.g. "Güvenlik Ayakkabıları Standardı"
  riskCategory: PPERiskCategory;
  description: string;
  technicalSpecsExplained: string[]; // Bullet-by-bullet explanation of markings & codes
  technicalOptions?: TechnicalOption[]; // Configurable codes (e.g. S3 vs S1P, FFP2 vs FFP3, 4-2-4-3-X-F)
  usageArea: string;
  cautions: string; // Dikkat edilecek hususlar
  recommendedRenewalMonths: number; // e.g. 6, 12, 24, 0 (tek kullanımlık)
  isCustom?: boolean; // User created
  isFavorite?: boolean;
}

export interface PPEAssignment {
  id: string;
  employeeId: string;
  companyId: string;
  ppeId: string;
  ppeName: string;
  category: PPECategory;
  standard: string;
  technicalDetails: string; // User selected or specified codes (e.g. "S3 SRC - Çelik burun & ara taban")
  brandModel: string;
  serialOrCertNo?: string; // CE No / Seri No (özellikle paraşüt tipi kemer veya yalıtkan ekipman için)
  size: string; // e.g. "42" or "L" or "9"
  quantity: number;
  deliveryDate: string; // YYYY-MM-DD
  renewalDate: string; // YYYY-MM-DD
  periodicCheckDate?: string; // Son periyodik kontrol tarihi (Düşme durdurma / Yalıtkan ekipman)
  nextCheckDate?: string; // Bir sonraki kontrol tarihi (en geç 12 ay)
  status: 'Aktif' | 'İade Edildi' | 'Yenilendi' | 'Hasarlı / Hurda';
  reasonForRemoval?: string; // If a mandatory item was skipped: "Neden zimmetlenmedi?"
  employeeSignature?: string; // Base64 data URL
  trainerName?: string;
  trainingDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ReturnRecord {
  id: string;
  assignmentId: string;
  employeeId: string;
  companyId: string;
  ppeName: string;
  returnDate: string;
  returnReason: 'Kullanım Ömrü Doldu / Aşınma' | 'Hasar / Arıza' | 'Beden / Uyumsuzluk' | 'İşten Ayrılma' | 'Görev Değişikliği' | 'Diğer';
  condition: 'Hurdaya Ayrıldı' | 'Yenisi Verildi' | 'Temizlenip Depolandı';
  notes?: string;
  receivedBy: string; // İSG Uzmanı veya Amirin adı
  newAssignmentId?: string; // Bağlantılı yeni zimmet varsa
  createdAt: string;
}

export interface JobRoleAssignmentDef {
  ppeName: string;
  defaultStandard?: string;
  defaultTechnicalCode?: string;
  notes?: string;
}

export interface JobRole {
  id: string;
  companyId?: string; // undefined means universal/system
  title: string;
  description?: string;
  mandatoryPPE: JobRoleAssignmentDef[]; // ZORUNLU
  conditionalPPE: JobRoleAssignmentDef[]; // DURUMA GÖRE
  warningNote?: string; // NOT alanı (Sarı uyarı kutusu)
  isCustom?: boolean;
}

export type RiskMethod = '5x5' | 'FineKinney';

export type HazardType =
  | 'Gürültü'
  | 'Toz (Ahşap/MDF/Metal)'
  | 'Kimyasal / Buhar / Solvent'
  | 'Kesilme / Delinme / Uzuv Kaybı'
  | 'Ezilme / Düşen Nesne'
  | 'Yüksekten Düşme'
  | 'Sıcak Yüzey / Yanık / Kıvılcım'
  | 'Elektrik / Ark Flaşı'
  | 'Yangın / Patlama'
  | 'Titreşim'
  | 'Kayma / Takılma / Düşme'
  | 'Görünürlük / Araç Çarpması'
  | 'Diğer / Ergonomik';

export interface DepartmentPPERecommendation {
  ppeName: string;
  standard?: string;
  technicalCode?: string;
  notes?: string;
}

export interface RiskEntry {
  id: string;
  hazard: string; // Tehlike tanımı
  consequence: string; // Olası risk / sonuç
  hazardType: HazardType;
  // KKD Öncesi Skor (Mevcut Risk)
  currentProbability: number; // 1-5 (5x5) veya 0.5-10 (Fine-Kinney)
  currentSeverity: number; // 1-5 (5x5) veya 1-100 (Fine-Kinney)
  currentFrequency?: number; // 0.5-10 (Yalnızca Fine-Kinney)
  currentScore: number;
  // Kontrol Hiyerarşisi (KKD öncesi alınan önlemler)
  prePPEControls: string; // Mühendislik (aspirasyon, siper), İdari (eğitim, rotasyon)
  // Önerilen KKD'ler
  recommendedPPE: DepartmentPPERecommendation[];
  // KKD Sonrası Skor (Artık Risk)
  residualProbability: number;
  residualSeverity: number;
  residualFrequency?: number;
  residualScore: number;
  // Yönetim
  responsiblePerson?: string;
  dueDate?: string; // GG.AA.YYYY veya ISO
  // Ek İSG Ölçüm ve Sağlık Alanları
  noiseDbA?: number; // dB(A) ölçüm değeri
  sdsReference?: string; // SDS / Ortam ölçüm referansı
  healthSurveillanceRequired?: boolean; // Sağlık gözetimi / meslek hastalığı takibi
  notes?: string;
}

export interface DepartmentRiskProfile {
  id: string;
  companyId: string;
  name: string;
  activityDescription: string;
  noiseLevelDbA?: number;
  riskEntries: RiskEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  companies: Company[];
  activeCompanyId: string;
  employees: Employee[];
  catalog: PPEItem[];
  jobRoles: JobRole[];
  departments: DepartmentRiskProfile[];
  riskMethod: RiskMethod;
  assignments: PPEAssignment[];
  returnRecords: ReturnRecord[];
  darkMode: boolean;
}

