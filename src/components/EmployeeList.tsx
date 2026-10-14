import React, { useState, useRef } from 'react';
import {
  UserPlus,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Edit2,
  Trash2,
  ShieldAlert,
  FileText,
  X,
  CheckCircle2,
  CheckSquare,
  Square,
  Layers,
  FileDown,
} from 'lucide-react';
import { Company, DepartmentRiskProfile, Employee, JobRole, PPEAssignment, RiskFactor } from '../types';
import { formatDateTR, maskTCKN, turkishIncludes, validateTCKN } from '../utils/turkish';
import {
  downloadEmployeeTemplate,
  exportEmployeesToExcel,
  parseEmployeeFile,
} from '../utils/excel';
import { downloadPPEAssignmentWordDoc } from '../utils/wordExport';

interface EmployeeListProps {
  company: Company;
  employees: Employee[];
  jobRoles: JobRole[];
  departments?: DepartmentRiskProfile[];
  assignments: PPEAssignment[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  onBulkAddEmployees: (emps: Employee[]) => void;
  onSelectEmployeeForAssign: (emp: Employee) => void;
  onOpenPrintModal: (emp?: Employee) => void;
  onOpenBulkAssign: (selectedEmployees?: Employee[]) => void;
}

const ALL_RISK_FACTORS: RiskFactor[] = [
  'Gürültü (>80 dB)',
  'Ahşap / Taş / Metal Tozu',
  'Kimyasal / Çözücü / Boya',
  'Yüksekte Çalışma (>1.8m)',
  'Sıcak Yüzey / Kıvılcım / Alev',
  'Elektrik Riski',
  'Dönen Aksam / Makine',
  'Ağır Parça / Düşme Tehlikesi',
  'Kesici / Delici Aletler',
  'Titreşimli Aletler',
];

export const EmployeeList: React.FC<EmployeeListProps> = ({
  company,
  employees,
  jobRoles,
  departments = [],
  assignments,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onBulkAddEmployees,
  onSelectEmployeeForAssign,
  onOpenPrintModal,
  onOpenBulkAssign,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [maskTC, setMaskTC] = useState(true);
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set());

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [tcKimlikNo, setTcKimlikNo] = useState('');
  const [sicilNo, setSicilNo] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [customJobInput, setCustomJobInput] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [shoeSize, setShoeSize] = useState('42');
  const [clothingSize, setClothingSize] = useState('L');
  const [gloveSize, setGloveSize] = useState('9');
  const [helmetMaskNote, setHelmetMaskNote] = useState('');
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [notes, setNotes] = useState('');
  const [tcValidationError, setTcValidationError] = useState('');
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Department names for table filter
  const deptFilterOptions = Array.from(
    new Set([
      ...departments.map((d) => d.name),
      ...employees.map((e) => e.department).filter(Boolean),
    ])
  );

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      turkishIncludes(emp.fullName, searchTerm) ||
      turkishIncludes(emp.sicilNo, searchTerm) ||
      turkishIncludes(emp.department, searchTerm) ||
      emp.jobTitles.some((j) => turkishIncludes(j, searchTerm)) ||
      (emp.tcKimlikNo && emp.tcKimlikNo.includes(searchTerm));

    const matchesDept = selectedDepartment === 'ALL' || emp.department === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setFullName(emp.fullName);
      setTcKimlikNo(emp.tcKimlikNo || '');
      setSicilNo(emp.sicilNo);
      setDepartment(emp.department);
      setSelectedJobs(emp.jobTitles);
      setStartDate(emp.startDate);
      setShoeSize(emp.shoeSize || '42');
      setClothingSize(emp.clothingSize || 'L');
      setGloveSize(emp.gloveSize || '9');
      setHelmetMaskNote(emp.helmetMaskNote || '');
      setRiskFactors(emp.riskFactors || []);
      setNotes(emp.notes || '');
    } else {
      setEditingEmp(null);
      setFullName('');
      setTcKimlikNo('');
      setSicilNo(`SICIL-${Math.floor(1000 + Math.random() * 9000)}`);
      setDepartment('');
      setSelectedJobs(jobRoles.length > 0 ? [jobRoles[0].title] : []);
      setStartDate(new Date().toISOString().slice(0, 10));
      setShoeSize('42');
      setClothingSize('L');
      setGloveSize('9');
      setHelmetMaskNote('');
      setRiskFactors([]);
      setNotes('');
    }
    setTcValidationError('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleTcChange = (val: string) => {
    setTcKimlikNo(val);
    if (val.trim()) {
      const res = validateTCKN(val);
      if (!res.valid) {
        setTcValidationError(res.message);
      } else {
        setTcValidationError('');
      }
    } else {
      setTcValidationError('');
    }
  };

  const toggleRiskFactor = (rf: RiskFactor) => {
    setRiskFactors((prev) =>
      prev.includes(rf) ? prev.filter((r) => r !== rf) : [...prev, rf]
    );
  };

  const toggleJob = (jobTitle: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobTitle) ? prev.filter((j) => j !== jobTitle) : [...prev, jobTitle]
    );
  };

  const handleAddCustomJob = () => {
    if (customJobInput.trim() && !selectedJobs.includes(customJobInput.trim())) {
      setSelectedJobs((prev) => [...prev, customJobInput.trim()]);
      setCustomJobInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Ad Soyad alanı zorunludur.');
      return;
    }
    if (!department.trim()) {
      setFormError('Departman alanı zorunludur.');
      return;
    }
    if (selectedJobs.length === 0) {
      setFormError('En az bir görev seçilmelidir.');
      return;
    }
    if (tcKimlikNo.trim()) {
      const valRes = validateTCKN(tcKimlikNo);
      if (!valRes.valid) {
        setFormError(valRes.message);
        return;
      }
    }

    const employeeData: Employee = {
      id: editingEmp ? editingEmp.id : `emp-${Date.now()}`,
      companyId: company.id,
      fullName: fullName.trim(),
      tcKimlikNo: tcKimlikNo.trim() || undefined,
      sicilNo: sicilNo.trim(),
      department: department.trim(),
      jobTitles: selectedJobs,
      startDate,
      shoeSize,
      clothingSize,
      gloveSize,
      helmetMaskNote: helmetMaskNote.trim() || undefined,
      riskFactors,
      notes: notes.trim() || undefined,
      createdAt: editingEmp ? editingEmp.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingEmp) {
      onUpdateEmployee(employeeData);
    } else {
      onAddEmployee(employeeData);
    }
    setIsModalOpen(false);
  };

  // Bulk File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseEmployeeFile(file, company.id);
      if (result.employees.length === 0) {
        alert('Dosyada geçerli çalışan kaydı bulunamadı.');
        return;
      }

      const newEmployees: Employee[] = result.employees.map((raw, idx) => ({
        ...raw,
        id: `emp-${Date.now()}-${idx}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      onBulkAddEmployees(newEmployees);
      alert(
        `Başarıyla ${newEmployees.length} çalışan içe aktarıldı!${
          result.errors.length > 0 ? `\nUyarılar:\n${result.errors.join('\n')}` : ''
        }`
      );
    } catch (err: any) {
      alert(`İçe aktarma hatası: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Selection toggle
  const toggleSelectEmp = (id: string) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmpIds.size === filteredEmployees.length) {
      setSelectedEmpIds(new Set());
    } else {
      setSelectedEmpIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  };

  const [isExportingWord, setIsExportingWord] = useState(false);

  const handleDownloadWordSingle = async (emp: Employee) => {
    try {
      await downloadPPEAssignmentWordDoc(company, [emp], assignments, maskTC);
    } catch (err: any) {
      alert(`Word dosyası oluşturulurken hata: ${err?.message || err}`);
    }
  };

  const handleBulkDownloadWord = async () => {
    const selected = employees.filter((e) => selectedEmpIds.has(e.id));
    if (selected.length === 0) return;
    try {
      setIsExportingWord(true);
      await downloadPPEAssignmentWordDoc(company, selected, assignments, maskTC);
    } catch (err: any) {
      alert(`Word dosyası oluşturulurken hata: ${err?.message || err}`);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search & Dept Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Çalışan adı, sicil, görev, departman ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Tüm Departmanlar ({employees.length})</option>
            {deptFilterOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept} ({employees.filter((e) => e.department === dept).length})
              </option>
            ))}
          </select>

          {/* Mask TC Toggle */}
          <button
            type="button"
            onClick={() => setMaskTC(!maskTC)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              maskTC
                ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
            title="KVKK gereği TC kimlik numaralarını maskeler"
          >
            {maskTC ? 'TC Maskeli (KVKK)' : 'TC Açık'}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadEmployeeTemplate}
            title="Excel Şablonunu İndir"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Şablon İndir
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Excel veya CSV dosyasından toplu çalışan yükle"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Toplu İçe Aktar
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => exportEmployeesToExcel(employees, company.title)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Excel Aktar
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            Çalışan Ekle
          </button>
        </div>
      </div>

      {/* Bulk selection actions bar */}
      {selectedEmpIds.size > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="font-bold">{selectedEmpIds.size}</span> çalışan seçildi.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const selected = employees.filter((e) => selectedEmpIds.has(e.id));
                onOpenBulkAssign(selected);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" /> Seçilenlere Toplu KKD Ata
            </button>
            <button
              onClick={() => {
                const selected = employees.filter((e) => selectedEmpIds.has(e.id));
                if (selected.length === 1) onOpenPrintModal(selected[0]);
                else onOpenPrintModal(undefined); // bulk print
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-900 transition shadow-sm cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Seçilenleri Toplu Yazdır / PDF
            </button>
            <button
              onClick={handleBulkDownloadWord}
              disabled={isExportingWord}
              title="Seçili çalışanların zimmet formlarını tek bir Word (.docx) dosyasında indir"
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              {isExportingWord ? 'Word İndiriliyor...' : 'Seçilenleri Word (.docx) İndir'}
            </button>
            <button
              onClick={() => setSelectedEmpIds(new Set())}
              className="text-slate-500 hover:text-slate-700 px-2 py-1 cursor-pointer"
            >
              Seçimi Temizle
            </button>
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-amber-600 transition"
                  >
                    {selectedEmpIds.size > 0 && selectedEmpIds.size === filteredEmployees.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Çalışan Bilgisi</th>
                <th className="py-3 px-3">Departman & Görev</th>
                <th className="py-3 px-3">Beden Profili</th>
                <th className="py-3 px-3">Risk Faktörleri</th>
                <th className="py-3 px-3 text-center">Zimmetli KKD</th>
                <th className="py-3 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Aranan kriterlere uygun çalışan bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empAsgs = assignments.filter(
                    (a) => a.employeeId === emp.id && a.status === 'Aktif'
                  );
                  const isSelected = selectedEmpIds.has(emp.id);

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectEmp(emp.id)}
                          className="text-slate-400 hover:text-amber-600 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {emp.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 space-x-2 mt-0.5">
                          <span>Sicil: {emp.sicilNo}</span>
                          <span>•</span>
                          <span>
                            TC: {maskTC ? maskTCKN(emp.tcKimlikNo) : emp.tcKimlikNo || '-'}
                          </span>
                          <span>•</span>
                          <span>Giriş: {formatDateTR(emp.startDate)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {emp.department}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {emp.jobTitles.map((title, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                          <div>
                            Ayakkabı: <span className="font-bold text-slate-800 dark:text-slate-100">{emp.shoeSize || '-'}</span>
                          </div>
                          <div>
                            Kıyafet / Tulum: <span className="font-bold text-slate-800 dark:text-slate-100">{emp.clothingSize || '-'}</span>
                          </div>
                          <div>
                            Eldiven: <span className="font-bold text-slate-800 dark:text-slate-100">{emp.gloveSize || '-'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {emp.riskFactors && emp.riskFactors.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {emp.riskFactors.slice(0, 3).map((rf, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                              >
                                {rf}
                              </span>
                            ))}
                            {emp.riskFactors.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{emp.riskFactors.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            empAsgs.length > 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {empAsgs.length} KKD
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectEmployeeForAssign(emp)}
                            title="KKD Zimmetlerini Yönet & Yeni Ata"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Zimmetler</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenPrintModal(emp)}
                            title="Zimmet Tutanağı & Taahhütname Yazdır / PDF"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Form / PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadWordSingle(emp)}
                            title="Zimmet Tutanağını Word (.docx) formatında indir"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Word</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenModal(emp)}
                            title="Düzenle"
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`${emp.fullName} çalışanını silmek istediğinize emin misiniz?`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            title="Sil"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    {editingEmp ? 'Çalışan Bilgilerini Düzenle' : 'Yeni Çalışan Kaydı Ekle'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seçili Şirket: <span className="font-semibold">{company.title}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200 rounded-xl">
                  {formError}
                </div>
              )}

              {/* Temel Bilgiler */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Soyad <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sicil No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: SICIL-104"
                    value={sicilNo}
                    onChange={(e) => setSicilNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    T.C. Kimlik No (Opsiyonel / KVKK)
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="11 haneli TCKN"
                    value={tcKimlikNo}
                    onChange={(e) => handleTcChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 ${
                      tcValidationError
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-amber-500'
                    }`}
                  />
                  {tcValidationError && (
                    <span className="text-rose-500 text-[10px] mt-0.5 block">{tcValidationError}</span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    İşe Giriş Tarihi
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departman / Birim <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={departments.some((d) => d.name === department) ? department : '__CUSTOM__'}
                      onChange={(e) => {
                        if (e.target.value !== '__CUSTOM__') {
                          setDepartment(e.target.value);
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Bölüm Listesinden Seçiniz --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                      <option value="__CUSTOM__">Diğer / Manuel Giriş</option>
                    </select>

                    <input
                      type="text"
                      required
                      placeholder="veya bölüm adını yazınız..."
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    * Seçilen bölümün risk matrisindeki KKD'ler çalışan önerisine otomatik eklenir.
                  </span>
                </div>
              </div>

              {/* Görev / Unvan Seçimi (Çoklu Seçim Destekli) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Görev / Unvan (Önerilen KKD Matrisi İçin Seçiniz) <span className="text-rose-500">*</span>
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-44 overflow-y-auto space-y-1.5">
                  {jobRoles.map((role) => {
                    const isChecked = selectedJobs.includes(role.title);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition text-xs ${
                          isChecked
                            ? 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleJob(role.title)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>{role.title}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Job Input */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Listede olmayan özel görev ekle..."
                    value={customJobInput}
                    onChange={(e) => setCustomJobInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomJob}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs"
                  >
                    Ekle
                  </button>
                </div>
              </div>

              {/* Beden Profili */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                  Beden ve Ölçü Bilgileri
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ayakkabı No
                    </label>
                    <select
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'].map((n) => (
                        <option key={n} value={n}>
                          {n} Numara
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kıyafet / Tulum Bedeni
                    </label>
                    <select
                      value={clothingSize}
                      onChange={(e) => setClothingSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Eldiven Bedeni
                    </label>
                    <select
                      value={gloveSize}
                      onChange={(e) => setGloveSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {['7 (S)', '8 (M)', '9 (L)', '10 (XL)', '11 (XXL)'].map((g) => (
                        <option key={g} value={g.split(' ')[0]}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Baret / Solunum Maskesi Notu (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 58 cm kafa çevresi, Sakalsız conta testi uygun"
                      value={helmetMaskNote}
                      onChange={(e) => setHelmetMaskNote(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Ortam Risk Faktörleri (Risk Gap Uyarıları İçin) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Çalışma Ortamı Riskleri (Eksik KKD kontrolü için işaretleyiniz):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_RISK_FACTORS.map((rf) => {
                    const isChecked = riskFactors.includes(rf);
                    return (
                      <label
                        key={rf}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer border text-[11px] transition ${
                          isChecked
                            ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRiskFactor(rf)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>{rf}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Özel Notlar
                </label>
                <textarea
                  rows={2}
                  placeholder="Çalışan hakkında İSG notları..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingEmp ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
