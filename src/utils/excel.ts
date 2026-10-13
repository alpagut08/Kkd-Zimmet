import * as XLSX from 'xlsx';
import { Employee, PPEAssignment } from '../types';
import { formatDateTR } from './turkish';

/**
 * Downloads a sample Excel / CSV template for importing employees
 */
export function downloadEmployeeTemplate(): void {
  const sampleRows = [
    {
      'Ad Soyad': 'Ahmet Yılmaz',
      'TC Kimlik No': '12345678901',
      'Sicil No': 'SICIL-001',
      'Departman': 'Marangozhane',
      'Görev': 'Marangoz / Ahşap İşleme Operatörü',
      'İşe Giriş Tarihi (GG.AA.YYYY)': '15.01.2024',
      'Ayakkabı No': '43',
      'Kıyafet Bedeni': 'L',
      'Eldiven Bedeni': '9',
      'Baret ve Maske Notu': 'Standart',
    },
    {
      'Ad Soyad': 'Mehmet Demir',
      'TC Kimlik No': '98765432109',
      'Sicil No': 'SICIL-002',
      'Departman': 'Boyahane',
      'Görev': 'Boyahane / Vernikçi',
      'İşe Giriş Tarihi (GG.AA.YYYY)': '01.03.2024',
      'Ayakkabı No': '42',
      'Kıyafet Bedeni': 'XL',
      'Eldiven Bedeni': '10',
      'Baret ve Maske Notu': 'Silikon Yarım Yüz Maske Uyumlu',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Calisan_Sablon');

  // Generate and download
  XLSX.writeFile(workbook, 'calisan_ekleme_sablonu.xlsx');
}

/**
 * Parses uploaded Excel or CSV file for employees
 */
export async function parseEmployeeFile(
  file: File,
  companyId: string
): Promise<{ employees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const employees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        const errors: string[] = [];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2;
          const fullName = (row['Ad Soyad'] || row['Adı Soyadı'] || row['FullName'] || row['AD SOYAD'] || '').toString().trim();

          if (!fullName) {
            errors.push(`Satır ${rowNum}: Ad Soyad alanı boş olduğundan atlandı.`);
            return;
          }

          const tcKimlikNo = (row['TC Kimlik No'] || row['TCKN'] || row['TC'] || '').toString().trim();
          const sicilNo = (row['Sicil No'] || row['Sicil'] || `SICIL-${Math.floor(1000 + Math.random() * 9000)}`).toString().trim();
          const department = (row['Departman'] || row['Birim'] || 'Üretim').toString().trim();
          const rawJob = (row['Görev'] || row['Unvan'] || row['Görevi'] || 'Genel Personel').toString().trim();
          const jobTitles = rawJob ? [rawJob] : ['Genel Personel'];

          let startDate = new Date().toISOString().slice(0, 10);
          const rawDate = row['İşe Giriş Tarihi (GG.AA.YYYY)'] || row['İşe Giriş Tarihi'] || row['Giriş Tarihi'];
          if (rawDate) {
            if (rawDate instanceof Date) {
              startDate = rawDate.toISOString().slice(0, 10);
            } else if (typeof rawDate === 'string' && rawDate.includes('.')) {
              const parts = rawDate.split('.');
              if (parts.length === 3) {
                startDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            } else if (typeof rawDate === 'string' && rawDate.includes('-')) {
              startDate = rawDate;
            }
          }

          const shoeSize = (row['Ayakkabı No'] || row['Ayakkabı'] || '').toString().trim();
          const clothingSize = (row['Kıyafet Bedeni'] || row['Beden'] || '').toString().trim();
          const gloveSize = (row['Eldiven Bedeni'] || row['Eldiven'] || '').toString().trim();
          const helmetMaskNote = (row['Baret ve Maske Notu'] || row['Baret/Maske Notu'] || '').toString().trim();

          employees.push({
            companyId,
            fullName,
            tcKimlikNo,
            sicilNo,
            department,
            jobTitles,
            startDate,
            shoeSize,
            clothingSize,
            gloveSize,
            helmetMaskNote,
            riskFactors: [],
          });
        });

        resolve({ employees, errors });
      } catch (err: any) {
        reject(new Error(`Dosya okuma hatası: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Dosya yüklenirken bir hata oluştu.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Export employees to Excel
 */
export function exportEmployeesToExcel(employees: Employee[], companyTitle: string): void {
  const exportData = employees.map((emp, i) => ({
    'Sıra': i + 1,
    'Ad Soyad': emp.fullName,
    'T.C. Kimlik No': emp.tcKimlikNo || '-',
    'Sicil No': emp.sicilNo,
    'Departman': emp.department,
    'Görevler': emp.jobTitles.join(', '),
    'İşe Giriş Tarihi': formatDateTR(emp.startDate),
    'Ayakkabı No': emp.shoeSize || '-',
    'Kıyafet Bedeni': emp.clothingSize || '-',
    'Eldiven Bedeni': emp.gloveSize || '-',
    'Risk Faktörleri': emp.riskFactors?.join(', ') || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Çalışan Listesi');
  XLSX.writeFile(workbook, `${companyTitle.slice(0, 20)}_Calisan_Listesi.xlsx`);
}

/**
 * Export assignments summary to Excel
 */
export function exportAssignmentsToExcel(
  assignments: PPEAssignment[],
  employees: Employee[],
  companyTitle: string
): void {
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const exportData = assignments.map((asg, i) => {
    const emp = empMap.get(asg.employeeId);
    return {
      'Sıra': i + 1,
      'Çalışan': emp?.fullName || 'Bilinmiyor',
      'Sicil No': emp?.sicilNo || '-',
      'Departman': emp?.department || '-',
      'KKD Adı': asg.ppeName,
      'Kategori': asg.category,
      'Standart': asg.standard,
      'Teknik Özellik / Kod': asg.technicalDetails || '-',
      'Marka / Model': asg.brandModel || '-',
      'Seri / CE No': asg.serialOrCertNo || '-',
      'Beden': asg.size || '-',
      'Adet': asg.quantity,
      'Teslim Tarihi': formatDateTR(asg.deliveryDate),
      'Yenileme Tarihi': formatDateTR(asg.renewalDate),
      'Durum': asg.status,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Zimmet Listesi');
  XLSX.writeFile(workbook, `${companyTitle.slice(0, 20)}_KKD_Zimmet_Raporu.xlsx`);
}
