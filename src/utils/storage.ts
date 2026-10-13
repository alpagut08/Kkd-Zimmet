import { AppState } from '../types';
import { SAMPLE_COMPANY, SAMPLE_EMPLOYEES, SAMPLE_ASSIGNMENTS } from '../data/sampleData';
import { INITIAL_PPE_CATALOG } from '../data/initialCatalog';
import { INITIAL_JOB_ROLE_MATRIX } from '../data/initialJobMatrix';
import { INITIAL_DEPARTMENTS } from '../data/initialDepartments';

const STORAGE_KEY = 'isg_kkd_app_v3';

export function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.companies) && parsed.companies.length > 0) {
        const catalog = Array.isArray(parsed.catalog) && parsed.catalog.length > 0
          ? parsed.catalog
          : INITIAL_PPE_CATALOG;
        const jobRoles = Array.isArray(parsed.jobRoles) && parsed.jobRoles.length > 0
          ? parsed.jobRoles
          : INITIAL_JOB_ROLE_MATRIX;
        const departments = Array.isArray(parsed.departments) && parsed.departments.length > 0
          ? parsed.departments
          : INITIAL_DEPARTMENTS;

        return {
          companies: parsed.companies,
          activeCompanyId: parsed.activeCompanyId || parsed.companies[0].id,
          employees: parsed.employees || [],
          catalog,
          jobRoles,
          departments,
          riskMethod: parsed.riskMethod || '5x5',
          assignments: parsed.assignments || [],
          returnRecords: parsed.returnRecords || [],
          darkMode: parsed.darkMode || false,
        };
      }
    }
  } catch (err) {
    console.error('LocalStorage load error:', err);
  }

  // Fallback default state
  return {
    companies: [SAMPLE_COMPANY],
    activeCompanyId: SAMPLE_COMPANY.id,
    employees: SAMPLE_EMPLOYEES,
    catalog: INITIAL_PPE_CATALOG,
    jobRoles: INITIAL_JOB_ROLE_MATRIX,
    departments: INITIAL_DEPARTMENTS,
    riskMethod: '5x5',
    assignments: SAMPLE_ASSIGNMENTS,
    returnRecords: [],
    darkMode: false,
  };
}

export function saveStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('LocalStorage save error:', err);
  }
}

export function exportBackupJSON(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `isg_kkd_yedek_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseBackupJSON(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  if (!parsed.companies || !Array.isArray(parsed.companies)) {
    throw new Error('Geçersiz yedek dosyası: Şirket listesi bulunamadı.');
  }
  return {
    companies: parsed.companies,
    activeCompanyId: parsed.activeCompanyId || parsed.companies[0]?.id || '',
    employees: parsed.employees || [],
    catalog: parsed.catalog || INITIAL_PPE_CATALOG,
    jobRoles: parsed.jobRoles || INITIAL_JOB_ROLE_MATRIX,
    departments: parsed.departments || INITIAL_DEPARTMENTS,
    riskMethod: parsed.riskMethod || '5x5',
    assignments: parsed.assignments || [],
    returnRecords: parsed.returnRecords || [],
    darkMode: parsed.darkMode || false,
  };
}
