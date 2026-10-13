import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Layers,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  Grid,
} from 'lucide-react';
import {
  AppState,
  Company,
  DepartmentRiskProfile,
  Employee,
  JobRole,
  PPEAssignment,
  PPEItem,
  ReturnRecord,
  RiskMethod,
} from './types';
import {
  loadInitialState,
  saveStateToStorage,
  exportBackupJSON,
  parseBackupJSON,
} from './utils/storage';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EmployeeList } from './components/EmployeeList';
import { AssignmentManager } from './components/AssignmentManager';
import { PPECatalogView } from './components/PPECatalogView';
import { JobMatrixView } from './components/JobMatrixView';
import { DepartmentRiskView } from './components/DepartmentRiskView';
import { ReturnsView } from './components/ReturnsView';
import { CompanyModal } from './components/CompanyModal';
import { BulkAssignModal } from './components/BulkAssignModal';
import { ReturnFormModal } from './components/ReturnFormModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { RiskReportPrintModal } from './components/RiskReportPrintModal';

type TabKey = 'dashboard' | 'employees' | 'catalog' | 'matrix' | 'departments' | 'returns';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Currently inspected employee for detailed assignment management
  const [managingEmployee, setManagingEmployee] = useState<Employee | null>(null);

  // Modals state
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkAssignTargetEmployees, setBulkAssignTargetEmployees] = useState<Employee[] | undefined>(
    undefined
  );

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTargetAssignment, setReturnTargetAssignment] = useState<PPEAssignment | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printTargetEmployee, setPrintTargetEmployee] = useState<Employee | undefined>(undefined);

  const [riskReportModalOpen, setRiskReportModalOpen] = useState(false);
  const [riskReportTargetDept, setRiskReportTargetDept] = useState<DepartmentRiskProfile | undefined>(undefined);

  // Dark mode effect
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Persist state changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Active Company
  const activeCompany =
    state.companies.find((c) => c.id === state.activeCompanyId) || state.companies[0];

  // Active Company's employees
  const companyEmployees = state.employees.filter((e) => e.companyId === activeCompany.id);

  // Active Company's assignments
  const companyAssignments = state.assignments.filter((a) => a.companyId === activeCompany.id);

  // Active Company's return records
  const companyReturns = state.returnRecords.filter((r) => r.companyId === activeCompany.id);

  // Active Company's departments
  const companyDepartments = state.departments.filter(
    (d) => !d.companyId || d.companyId === activeCompany.id
  );

  // Handlers
  const handleSelectCompany = (companyId: string) => {
    setState((prev) => ({ ...prev, activeCompanyId: companyId }));
    setManagingEmployee(null);
  };

  const handleSaveCompany = (company: Company) => {
    setState((prev) => {
      const exists = prev.companies.some((c) => c.id === company.id);
      const updatedCompanies = exists
        ? prev.companies.map((c) => (c.id === company.id ? company : c))
        : [...prev.companies, company];

      return {
        ...prev,
        companies: updatedCompanies,
        activeCompanyId: company.id,
      };
    });
  };

  const handleDeleteCompany = (companyId: string) => {
    if (state.companies.length <= 1) {
      alert('Sistemde en az bir şirket kaydı bulunmalıdır.');
      return;
    }
    setState((prev) => {
      const remaining = prev.companies.filter((c) => c.id !== companyId);
      return {
        ...prev,
        companies: remaining,
        activeCompanyId: remaining[0].id,
      };
    });
  };

  const handleToggleDarkMode = () => {
    setState((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleExportJSON = () => {
    exportBackupJSON(state);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const newState = parseBackupJSON(text);
        setState(newState);
        alert('Yedek başarıyla yüklendi ve tüm veriler güncellendi!');
      } catch (err: any) {
        alert(`Yedek yükleme hatası: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Employee CRUD
  const handleAddEmployee = (emp: Employee) => {
    setState((prev) => ({ ...prev, employees: [emp, ...prev.employees] }));
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === emp.id ? emp : e)),
    }));
    if (managingEmployee?.id === emp.id) {
      setManagingEmployee(emp);
    }
  };

  const handleDeleteEmployee = (empId: string) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== empId),
      assignments: prev.assignments.filter((a) => a.employeeId !== empId),
      returnRecords: prev.returnRecords.filter((r) => r.employeeId !== empId),
    }));
    if (managingEmployee?.id === empId) {
      setManagingEmployee(null);
    }
  };

  const handleBulkAddEmployees = (newEmps: Employee[]) => {
    setState((prev) => ({
      ...prev,
      employees: [...newEmps, ...prev.employees],
    }));
  };

  // Assignments CRUD
  const handleAddAssignment = (asg: PPEAssignment) => {
    setState((prev) => ({ ...prev, assignments: [asg, ...prev.assignments] }));
  };

  const handleUpdateAssignment = (asg: PPEAssignment) => {
    setState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === asg.id ? asg : a)),
    }));
  };

  const handleDeleteAssignment = (assignmentId: string, removalReason?: string) => {
    setState((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== assignmentId),
    }));
  };

  const handleBulkAssign = (newAssignments: PPEAssignment[]) => {
    setState((prev) => ({
      ...prev,
      assignments: [...newAssignments, ...prev.assignments],
    }));
  };

  // Return Record
  const handleSaveReturn = (record: ReturnRecord, updatedAssignment: PPEAssignment) => {
    setState((prev) => ({
      ...prev,
      returnRecords: [record, ...prev.returnRecords],
      assignments: prev.assignments.map((a) =>
        a.id === updatedAssignment.id ? updatedAssignment : a
      ),
    }));
  };

  const handleDeleteReturnRecord = (recordId: string) => {
    setState((prev) => ({
      ...prev,
      returnRecords: prev.returnRecords.filter((r) => r.id !== recordId),
    }));
  };

  // Catalog CRUD
  const handleAddCustomPPE = (item: PPEItem) => {
    setState((prev) => ({ ...prev, catalog: [item, ...prev.catalog] }));
  };

  const handleUpdatePPE = (item: PPEItem) => {
    setState((prev) => ({
      ...prev,
      catalog: prev.catalog.map((c) => (c.id === item.id ? item : c)),
    }));
  };

  const handleToggleFavorite = (itemId: string) => {
    setState((prev) => ({
      ...prev,
      catalog: prev.catalog.map((c) =>
        c.id === itemId ? { ...c, isFavorite: !c.isFavorite } : c
      ),
    }));
  };

  // Job Roles CRUD
  const handleAddJobRole = (role: JobRole) => {
    setState((prev) => ({ ...prev, jobRoles: [role, ...prev.jobRoles] }));
  };

  const handleUpdateJobRole = (role: JobRole) => {
    setState((prev) => ({
      ...prev,
      jobRoles: prev.jobRoles.map((r) => (r.id === role.id ? role : r)),
    }));
  };

  const handleDeleteJobRole = (roleId: string) => {
    setState((prev) => ({
      ...prev,
      jobRoles: prev.jobRoles.filter((r) => r.id !== roleId),
    }));
  };

  // Department Risk Matrix CRUD & Actions
  const handleAddDepartment = (dept: DepartmentRiskProfile) => {
    setState((prev) => ({
      ...prev,
      departments: [dept, ...prev.departments],
    }));
  };

  const handleUpdateDepartment = (dept: DepartmentRiskProfile) => {
    setState((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => (d.id === dept.id ? dept : d)),
    }));
  };

  const handleDeleteDepartment = (deptId: string) => {
    setState((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d.id !== deptId),
    }));
  };

  const handleCopyDepartmentToCompany = (dept: DepartmentRiskProfile, targetCompanyId: string) => {
    const copiedDept: DepartmentRiskProfile = {
      ...dept,
      id: `dept-${Date.now()}`,
      companyId: targetCompanyId,
      name: `${dept.name} (Kopya)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskEntries: dept.riskEntries.map((re, idx) => ({
        ...re,
        id: `re-${Date.now()}-${idx}`,
      })),
    };
    setState((prev) => ({
      ...prev,
      departments: [copiedDept, ...prev.departments],
    }));
    alert(`"${dept.name}" bölümü seçilen hedef şirkete başarıyla kopyalandı.`);
  };

  const handleChangeRiskMethod = (method: RiskMethod) => {
    setState((prev) => ({
      ...prev,
      riskMethod: method,
    }));
  };

  const handleBulkApplyDeptPPEToEmployees = (dept: DepartmentRiskProfile) => {
    const deptEmployees = companyEmployees.filter(
      (e) => e.department.toLowerCase() === dept.name.toLowerCase()
    );
    if (deptEmployees.length === 0) {
      alert(`Bu bölüme ("${dept.name}") atanmış aktif çalışan bulunamadı.`);
      return;
    }

    const uniquePpeNames = Array.from(
      new Set(
        dept.riskEntries
          .flatMap((re) => re.recommendedPPE)
          .map((p) => p.ppeName.trim())
          .filter(Boolean)
      )
    );

    if (uniquePpeNames.length === 0) {
      alert('Bu bölümde tanımlı önerilen KKD bulunmuyor.');
      return;
    }

    const newAssignments: PPEAssignment[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const renewalDate = nextYear.toISOString().slice(0, 10);

    for (const emp of deptEmployees) {
      for (const ppeName of uniquePpeNames) {
        const catalogItem = state.catalog.find(
          (c) => c.name.toLowerCase() === ppeName.toLowerCase()
        );
        const deptRec = dept.riskEntries
          .flatMap((re) => re.recommendedPPE)
          .find((p) => p.ppeName.trim().toLowerCase() === ppeName.toLowerCase());

        newAssignments.push({
          id: `asg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          employeeId: emp.id,
          companyId: activeCompany.id,
          ppeId: catalogItem?.id || `custom-${Date.now()}`,
          ppeName: ppeName,
          category: catalogItem?.category || 'Özel / Diğer',
          standard: deptRec?.standard || catalogItem?.standards[0] || 'EN Standart',
          technicalDetails: deptRec?.technicalCode || catalogItem?.technicalSpecsExplained[0] || '',
          brandModel: '',
          size: catalogItem?.category === 'Ayak ve Bacak Koruma' ? (emp.shoeSize || '42') : 'Standart',
          quantity: 1,
          deliveryDate: today,
          renewalDate: renewalDate,
          status: 'Aktif',
          trainerName: activeCompany.authorized.isgExpertName,
          trainingDate: today,
          createdAt: new Date().toISOString(),
        });
      }
    }

    handleBulkAssign(newAssignments);
    alert(
      `"${dept.name}" bölümündeki ${deptEmployees.length} çalışana toplam ${newAssignments.length} adet KKD zimmeti başarıyla oluşturuldu.`
    );
  };

  // Navigation helpers
  const handleSelectEmployeeForAssign = (emp: Employee) => {
    setManagingEmployee(emp);
    setActiveTab('employees');
  };

  const handleOpenPrintModal = (emp?: Employee) => {
    setPrintTargetEmployee(emp);
    setPrintModalOpen(true);
  };

  const handleOpenBulkAssignModal = (selected?: Employee[]) => {
    setBulkAssignTargetEmployees(selected);
    setBulkAssignModalOpen(true);
  };

  const handleOpenReturnModal = (assignment: PPEAssignment) => {
    setReturnTargetAssignment(assignment);
    setReturnModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Fixed Header */}
      <Header
        companies={state.companies}
        activeCompany={activeCompany}
        onSelectCompany={handleSelectCompany}
        onOpenCompanyModal={(comp) => {
          setCompanyToEdit(comp || null);
          setCompanyModalOpen(true);
        }}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        darkMode={state.darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar py-2">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setManagingEmployee(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Gösterge Paneli
            </button>

            <button
              onClick={() => {
                setActiveTab('employees');
                setManagingEmployee(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === 'employees'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Çalışanlar & Zimmetler ({companyEmployees.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('catalog');
                setManagingEmployee(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              KKD Kataloğu ({state.catalog.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('matrix');
                setManagingEmployee(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === 'matrix'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Görev–KKD Matrisi ({state.jobRoles.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('departments');
                setManagingEmployee(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === 'departments'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Grid className="w-4 h-4" />
              Bölüm Risk Matrisi ({companyDepartments.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('returns');
                setManagingEmployee(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === 'returns'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              İade & Değişim Tutanağı ({companyReturns.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        id="app-main"
        className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 ${
          printModalOpen || riskReportModalOpen ? 'print:hidden' : ''
        }`}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            company={activeCompany}
            employees={companyEmployees}
            assignments={companyAssignments}
            catalog={state.catalog}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              setManagingEmployee(null);
            }}
            onSelectEmployeeForAssign={handleSelectEmployeeForAssign}
            onOpenBulkAssign={() => handleOpenBulkAssignModal()}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {activeTab === 'employees' && (
          <>
            {managingEmployee ? (
              <AssignmentManager
                company={activeCompany}
                employee={managingEmployee}
                catalog={state.catalog}
                jobRoles={state.jobRoles}
                departments={companyDepartments}
                assignments={companyAssignments}
                onAddAssignment={handleAddAssignment}
                onUpdateAssignment={handleUpdateAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                onOpenReturnModal={handleOpenReturnModal}
                onOpenPrintModal={handleOpenPrintModal}
                onBackToList={() => setManagingEmployee(null)}
              />
            ) : (
              <EmployeeList
                company={activeCompany}
                employees={companyEmployees}
                jobRoles={state.jobRoles}
                departments={companyDepartments}
                assignments={companyAssignments}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onBulkAddEmployees={handleBulkAddEmployees}
                onSelectEmployeeForAssign={handleSelectEmployeeForAssign}
                onOpenPrintModal={handleOpenPrintModal}
                onOpenBulkAssign={handleOpenBulkAssignModal}
              />
            )}
          </>
        )}

        {activeTab === 'catalog' && (
          <PPECatalogView
            catalog={state.catalog}
            onAddCustomPPE={handleAddCustomPPE}
            onUpdatePPE={handleUpdatePPE}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'matrix' && (
          <JobMatrixView
            jobRoles={state.jobRoles}
            catalog={state.catalog}
            onAddJobRole={handleAddJobRole}
            onUpdateJobRole={handleUpdateJobRole}
            onDeleteJobRole={handleDeleteJobRole}
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentRiskView
            company={activeCompany}
            companies={state.companies}
            departments={companyDepartments}
            employees={companyEmployees}
            assignments={companyAssignments}
            catalog={state.catalog}
            riskMethod={state.riskMethod}
            onChangeRiskMethod={handleChangeRiskMethod}
            onAddDepartment={handleAddDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onCopyDepartmentToCompany={handleCopyDepartmentToCompany}
            onBulkApplyDeptPPEToEmployees={handleBulkApplyDeptPPEToEmployees}
            onOpenReportPrintModal={(dept) => {
              setRiskReportTargetDept(dept);
              setRiskReportModalOpen(true);
            }}
            onSelectEmployeeForAssign={handleSelectEmployeeForAssign}
          />
        )}

        {activeTab === 'returns' && (
          <ReturnsView
            company={activeCompany}
            employees={companyEmployees}
            returnRecords={companyReturns}
            onDeleteReturnRecord={handleDeleteReturnRecord}
          />
        )}
      </main>

      {/* Footer Mandatory Warning Notice */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-3 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Standart bilgileri bilgilendirme amaçlıdır; KKD seçimi işyeri risk değerlendirmesine, ürün
            etiketine ve üretici bilgilerine göre yapılmalıdır. Güncel standart sürümlerini kontrol
            ediniz.
          </span>
          <span className="text-slate-400">
            6331 Sayılı İSG Kanunu & KKD Yönetmeliği Uyumlu
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      <CompanyModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        companyToEdit={companyToEdit}
        onSave={handleSaveCompany}
        onDelete={handleDeleteCompany}
      />

      <BulkAssignModal
        isOpen={bulkAssignModalOpen}
        onClose={() => setBulkAssignModalOpen(false)}
        company={activeCompany}
        employees={companyEmployees}
        catalog={state.catalog}
        preSelectedEmployees={bulkAssignTargetEmployees}
        onBulkAssign={handleBulkAssign}
      />

      {returnTargetAssignment && (
        <ReturnFormModal
          isOpen={returnModalOpen}
          onClose={() => {
            setReturnModalOpen(false);
            setReturnTargetAssignment(null);
          }}
          assignment={returnTargetAssignment}
          employee={companyEmployees.find(
            (e) => e.id === returnTargetAssignment.employeeId
          )}
          company={activeCompany}
          onSaveReturn={handleSaveReturn}
        />
      )}

      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        company={activeCompany}
        employees={companyEmployees}
        assignments={companyAssignments}
        catalog={state.catalog}
        targetEmployee={printTargetEmployee}
      />

      <RiskReportPrintModal
        isOpen={riskReportModalOpen}
        onClose={() => setRiskReportModalOpen(false)}
        company={activeCompany}
        departments={companyDepartments}
        employees={companyEmployees}
        targetDepartment={riskReportTargetDept}
        riskMethod={state.riskMethod}
      />
    </div>
  );
};
export default App;
