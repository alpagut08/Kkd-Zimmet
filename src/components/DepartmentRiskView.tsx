import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Printer,
  ShieldAlert,
  Flame,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  X,
  Users,
  Grid,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import {
  Company,
  DepartmentRiskProfile,
  Employee,
  HazardType,
  PPEAssignment,
  PPEItem,
  RiskEntry,
  RiskMethod,
} from '../types';
import {
  calculateRiskScore,
  evaluateNoiseLevel,
  MATRIX_5X5_PROBABILITY_OPTIONS,
  MATRIX_5X5_SEVERITY_OPTIONS,
  FINE_KINNEY_PROBABILITY_OPTIONS,
  FINE_KINNEY_FREQUENCY_OPTIONS,
  FINE_KINNEY_SEVERITY_OPTIONS,
} from '../utils/riskScoring';
import { turkishIncludes } from '../utils/turkish';

interface DepartmentRiskViewProps {
  company: Company;
  companies: Company[];
  departments: DepartmentRiskProfile[];
  employees: Employee[];
  assignments: PPEAssignment[];
  catalog: PPEItem[];
  riskMethod: RiskMethod;
  onChangeRiskMethod: (method: RiskMethod) => void;
  onAddDepartment: (dept: DepartmentRiskProfile) => void;
  onUpdateDepartment: (dept: DepartmentRiskProfile) => void;
  onDeleteDepartment: (deptId: string) => void;
  onCopyDepartmentToCompany: (dept: DepartmentRiskProfile, targetCompanyId: string) => void;
  onBulkApplyDeptPPEToEmployees: (dept: DepartmentRiskProfile) => void;
  onOpenReportPrintModal: (dept?: DepartmentRiskProfile) => void;
  onSelectEmployeeForAssign: (emp: Employee) => void;
}

const ALL_HAZARD_TYPES: HazardType[] = [
  'Gürültü',
  'Toz (Ahşap/MDF/Metal)',
  'Kimyasal / Buhar / Solvent',
  'Kesilme / Delinme / Uzuv Kaybı',
  'Ezilme / Düşen Nesne',
  'Yüksekten Düşme',
  'Sıcak Yüzey / Yanık / Kıvılcım',
  'Elektrik / Ark Flaşı',
  'Yangın / Patlama',
  'Titreşim',
  'Kayma / Takılma / Düşme',
  'Görünürlük / Araç Çarpması',
];

export const DepartmentRiskView: React.FC<DepartmentRiskViewProps> = ({
  company,
  companies,
  departments,
  employees,
  assignments,
  catalog,
  riskMethod,
  onChangeRiskMethod,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onCopyDepartmentToCompany,
  onBulkApplyDeptPPEToEmployees,
  onOpenReportPrintModal,
  onSelectEmployeeForAssign,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    departments[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'matrix' | 'heatmap' | 'adequacy'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [hazardFilter, setHazardFilter] = useState<string>('ALL');

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentRiskProfile | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptNoise, setDeptNoise] = useState<number | undefined>(undefined);

  // Copy Dept Modal State
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [deptToCopy, setDeptToCopy] = useState<DepartmentRiskProfile | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState<string>(
    companies.find((c) => c.id !== company.id)?.id || ''
  );

  // Risk Entry Modal State
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskEntry | null>(null);
  const [hazardText, setHazardText] = useState('');
  const [consequenceText, setConsequenceText] = useState('');
  const [selectedHazardType, setSelectedHazardType] = useState<HazardType>('Gürültü');
  const [curProb, setCurProb] = useState(3);
  const [curSev, setCurSev] = useState(3);
  const [curFreq, setCurFreq] = useState(6);
  const [prePPEControls, setPrePPEControls] = useState('');
  const [selectedPpeNames, setSelectedPpeNames] = useState<string[]>([]);
  const [customPpeInput, setCustomPpeInput] = useState('');
  const [resProb, setResProb] = useState(1);
  const [resSev, setResSev] = useState(2);
  const [resFreq, setResFreq] = useState(2);
  const [noiseEntryDbA, setNoiseEntryDbA] = useState<number | undefined>(undefined);
  const [sdsRef, setSdsRef] = useState('');
  const [healthSurv, setHealthSurv] = useState(false);
  const [respPerson, setRespPerson] = useState(company.authorized.isgExpertName);
  const [entryDueDate, setEntryDueDate] = useState('Sürekli');

  // Heatmap detail modal
  const [cellModalData, setCellModalData] = useState<{
    dept: DepartmentRiskProfile;
    hazardType: HazardType;
    entries: RiskEntry[];
  } | null>(null);

  const selectedDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const filteredDepartments = departments.filter((d) =>
    turkishIncludes(d.name, searchTerm)
  );

  // Filtered Risk Entries for selected department
  const filteredRiskEntries = selectedDept
    ? selectedDept.riskEntries.filter((re) => {
        const matchesHazard =
          hazardFilter === 'ALL' || re.hazardType === hazardFilter;
        const matchesSearch =
          turkishIncludes(re.hazard, searchTerm) ||
          turkishIncludes(re.consequence, searchTerm) ||
          turkishIncludes(re.prePPEControls, searchTerm) ||
          re.recommendedPPE.some((p) => turkishIncludes(p.ppeName, searchTerm));
        return matchesHazard && matchesSearch;
      })
    : [];

  // Open Department Modal
  const handleOpenDeptModal = (dept?: DepartmentRiskProfile) => {
    if (dept) {
      setEditingDept(dept);
      setDeptName(dept.name);
      setDeptDesc(dept.activityDescription);
      setDeptNoise(dept.noiseLevelDbA);
    } else {
      setEditingDept(null);
      setDeptName('');
      setDeptDesc('');
      setDeptNoise(undefined);
    }
    setDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    if (editingDept) {
      const updated: DepartmentRiskProfile = {
        ...editingDept,
        name: deptName.trim(),
        activityDescription: deptDesc.trim(),
        noiseLevelDbA: deptNoise,
        updatedAt: new Date().toISOString(),
      };
      onUpdateDepartment(updated);
    } else {
      const newDept: DepartmentRiskProfile = {
        id: `dept-${Date.now()}`,
        companyId: company.id,
        name: deptName.trim(),
        activityDescription: deptDesc.trim(),
        noiseLevelDbA: deptNoise,
        riskEntries: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddDepartment(newDept);
      setSelectedDeptId(newDept.id);
    }
    setDeptModalOpen(false);
  };

  // Open Risk Entry Modal
  const handleOpenRiskModal = (entry?: RiskEntry) => {
    if (entry) {
      setEditingRisk(entry);
      setHazardText(entry.hazard);
      setConsequenceText(entry.consequence);
      setSelectedHazardType(entry.hazardType);
      setCurProb(entry.currentProbability);
      setCurSev(entry.currentSeverity);
      setCurFreq(entry.currentFrequency || 6);
      setPrePPEControls(entry.prePPEControls);
      setSelectedPpeNames(entry.recommendedPPE.map((p) => p.ppeName));
      setResProb(entry.residualProbability);
      setResSev(entry.residualSeverity);
      setResFreq(entry.residualFrequency || 2);
      setNoiseEntryDbA(entry.noiseDbA);
      setSdsRef(entry.sdsReference || '');
      setHealthSurv(!!entry.healthSurveillanceRequired);
      setRespPerson(entry.responsiblePerson || company.authorized.isgExpertName);
      setEntryDueDate(entry.dueDate || 'Sürekli');
    } else {
      setEditingRisk(null);
      setHazardText('');
      setConsequenceText('');
      setSelectedHazardType('Gürültü');
      setCurProb(3);
      setCurSev(3);
      setCurFreq(6);
      setPrePPEControls('');
      setSelectedPpeNames([]);
      setResProb(1);
      setResSev(2);
      setResFreq(2);
      setNoiseEntryDbA(undefined);
      setSdsRef('');
      setHealthSurv(false);
      setRespPerson(company.authorized.isgExpertName);
      setEntryDueDate('Sürekli');
    }
    setRiskModalOpen(true);
  };

  const handleSaveRiskEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !hazardText.trim()) return;

    const curScoreEval = calculateRiskScore(
      riskMethod,
      curProb,
      curSev,
      riskMethod === 'FineKinney' ? curFreq : undefined
    );
    const resScoreEval = calculateRiskScore(
      riskMethod,
      resProb,
      resSev,
      riskMethod === 'FineKinney' ? resFreq : undefined
    );

    const recommendedPPE = selectedPpeNames.map((name) => {
      const catItem = catalog.find((c) => c.name === name);
      return {
        ppeName: name,
        standard: catItem ? catItem.standards.join(', ') : 'EN Standardı',
        technicalCode: catItem ? catItem.technicalSpecsExplained[0] : '',
      };
    });

    const entryData: RiskEntry = {
      id: editingRisk ? editingRisk.id : `re-${Date.now()}`,
      hazard: hazardText.trim(),
      consequence: consequenceText.trim(),
      hazardType: selectedHazardType,
      currentProbability: curProb,
      currentSeverity: curSev,
      currentFrequency: riskMethod === 'FineKinney' ? curFreq : undefined,
      currentScore: curScoreEval.score,
      prePPEControls: prePPEControls.trim() || 'Kaynakta mühendislik ve idari önlemler',
      recommendedPPE,
      residualProbability: resProb,
      residualSeverity: resSev,
      residualFrequency: riskMethod === 'FineKinney' ? resFreq : undefined,
      residualScore: resScoreEval.score,
      responsiblePerson: respPerson.trim() || undefined,
      dueDate: entryDueDate.trim() || undefined,
      noiseDbA: noiseEntryDbA,
      sdsReference: sdsRef.trim() || undefined,
      healthSurveillanceRequired: healthSurv,
    };

    let updatedEntries: RiskEntry[];
    if (editingRisk) {
      updatedEntries = selectedDept.riskEntries.map((re) =>
        re.id === editingRisk.id ? entryData : re
      );
    } else {
      updatedEntries = [...selectedDept.riskEntries, entryData];
    }

    onUpdateDepartment({
      ...selectedDept,
      riskEntries: updatedEntries,
      updatedAt: new Date().toISOString(),
    });

    setRiskModalOpen(false);
  };

  const handleDeleteRiskEntry = (entryId: string) => {
    if (!selectedDept) return;
    if (confirm('Bu tehlike ve risk kaydını silmek istediğinizden emin misiniz?')) {
      const updatedEntries = selectedDept.riskEntries.filter((re) => re.id !== entryId);
      onUpdateDepartment({
        ...selectedDept,
        riskEntries: updatedEntries,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Toggle PPE in recommendation picker
  const toggleRecommendedPpe = (name: string) => {
    setSelectedPpeNames((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleAddCustomPpeToEntry = () => {
    if (customPpeInput.trim() && !selectedPpeNames.includes(customPpeInput.trim())) {
      setSelectedPpeNames((prev) => [...prev, customPpeInput.trim()]);
      setCustomPpeInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Method Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold mb-1">
              <Layers className="w-3.5 h-3.5" />
              Bölüm Bazlı KKD Risk Belirleme ve Isı Haritası
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              İşyeri Bölüm Risk Matrisi & Tehlike Yönetimi
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Her bölümün tehlikelerini, gürültü/toz/kimyasal maruziyetini ve kontrol hiyerarşisine göre
              gereken KKD'leri belirleyin.
            </p>
          </div>

          {/* Method and Report Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Risk Method Switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-500 px-2 text-[11px]">Yöntem:</span>
              <button
                type="button"
                onClick={() => onChangeRiskMethod('5x5')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  riskMethod === '5x5'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                5x5 Matris
              </button>
              <button
                type="button"
                onClick={() => onChangeRiskMethod('FineKinney')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  riskMethod === 'FineKinney'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Fine-Kinney
              </button>
            </div>

            <button
              onClick={() => onOpenReportPrintModal()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Genel Risk Raporu (PDF)
            </button>
          </div>
        </div>

        {/* View Mode Tabs (Matrix Table vs Heatmap vs Adequacy) */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                viewMode === 'matrix'
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Bölüm Risk Tablosu
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                viewMode === 'heatmap'
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Risk Isı Haritası (Heatmap)
            </button>
            <button
              onClick={() => setViewMode('adequacy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                viewMode === 'adequacy'
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              KKD Yeterlilik Kontrolü
            </button>
          </div>

          <button
            onClick={() => handleOpenDeptModal()}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Bölüm Ekle
          </button>
        </div>
      </div>

      {/* Control Hierarchy Mandatory Banner */}
      <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs flex items-center justify-between text-amber-900 dark:text-amber-200 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Kontrol Hiyerarşisi İlkesi:</strong> KKD son çaredir; kaynakta önlem
            alınamayan veya yetersiz kalan riskler için kullanılır (Ortadan Kaldırma &gt; İkame &gt;
            Mühendislik &gt; İdari &gt; KKD).
          </span>
        </div>
        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hidden md:inline">
          6331 Sayılı Kanun Madde 19
        </span>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MATRIX TABLE VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && selectedDept && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column: Department List */}
          <div className="lg:col-span-1 space-y-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 px-1">
                <span>İşyeri Bölümleri ({departments.length})</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Bölüm ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
                {filteredDepartments.map((d) => {
                  const isSelected = d.id === selectedDeptId;
                  const deptEmps = employees.filter((e) => e.department === d.name);

                  // Calculate max score
                  const maxScore =
                    d.riskEntries.length > 0
                      ? Math.max(...d.riskEntries.map((r) => r.currentScore))
                      : 0;

                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDeptId(d.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-amber-600 text-white font-bold shadow-sm'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate font-semibold">{d.name}</div>
                        <div
                          className={`text-[10px] mt-0.5 truncate ${
                            isSelected ? 'text-amber-100' : 'text-slate-400'
                          }`}
                        >
                          {deptEmps.length} Çalışan • {d.riskEntries.length} Tehlike
                        </div>
                      </div>

                      {maxScore > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : maxScore >= 15
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : maxScore >= 9
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          Skor: {maxScore}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Department Details & Risk Entries */}
          <div className="lg:col-span-3 space-y-4">
            {/* Department Summary Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {selectedDept.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {employees.filter((e) => e.department === selectedDept.name).length} Çalışan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDept.activityDescription || 'Bölüm faaliyet açıklaması belirtilmedi.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => onBulkApplyDeptPPEToEmployees(selectedDept)}
                    title="Bu bölümdeki çalışanların zimmetine önerilen KKD'leri tek tıkla taslak olarak ekle"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Bölüm KKD'lerini Çalışanlara Ata
                  </button>

                  <button
                    onClick={() => onOpenReportPrintModal(selectedDept)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Bölüm Raporu (PDF)
                  </button>

                  <button
                    onClick={() => handleOpenDeptModal(selectedDept)}
                    title="Bölümü Düzenle"
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {companies.length > 1 && (
                    <button
                      onClick={() => {
                        setDeptToCopy(selectedDept);
                        setCopyModalOpen(true);
                      }}
                      title="Başka Şirkete Kopyala"
                      className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `"${selectedDept.name}" bölümünü ve tüm tehlike kayıtlarını silmek istediğinize emin misiniz?`
                        )
                      ) {
                        onDeleteDepartment(selectedDept.id);
                      }
                    }}
                    title="Bölümü Sil"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Noise Level & Environmental Monitoring Row */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Ortam Gürültü Seviyesi:
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="40"
                    max="140"
                    placeholder="Örn: 85"
                    value={selectedDept.noiseLevelDbA ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : undefined;
                      onUpdateDepartment({
                        ...selectedDept,
                        noiseLevelDbA: val,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                  <span>dB(A)</span>

                  {/* Noise Evaluation Badge */}
                  {(() => {
                    const evalRes = evaluateNoiseLevel(selectedDept.noiseLevelDbA);
                    return (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${evalRes.badgeClass}`}
                      >
                        {evalRes.label}
                      </span>
                    );
                  })()}
                </div>

                <button
                  onClick={() => handleOpenRiskModal()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-xs text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Yeni Tehlike / Risk Ekle
                </button>
              </div>
            </div>

            {/* Filter by Hazard Type */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setHazardFilter('ALL')}
                className={`px-3 py-1 rounded-xl font-semibold transition shrink-0 ${
                  hazardFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Tüm Tehlikeler ({selectedDept.riskEntries.length})
              </button>
              {ALL_HAZARD_TYPES.map((ht) => {
                const count = selectedDept.riskEntries.filter((r) => r.hazardType === ht).length;
                if (count === 0) return null;
                return (
                  <button
                    key={ht}
                    onClick={() => setHazardFilter(ht)}
                    className={`px-2.5 py-1 rounded-xl font-semibold transition shrink-0 flex items-center gap-1 ${
                      hazardFilter === ht
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{ht}</span>
                    <span className="px-1 rounded-full bg-black/10 dark:bg-white/10 text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table of Hazards */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              {filteredRiskEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  Bu bölümde henüz kayıtlı tehlike bulunmuyor veya arama kriterine uymuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3 w-8 text-center">#</th>
                        <th className="py-3 px-3 min-w-[200px]">Tehlike & Olası Sonuç</th>
                        <th className="py-3 px-3 text-center">Mevcut Risk</th>
                        <th className="py-3 px-3 min-w-[180px]">KKD Öncesi Önlemler (Hiyerarşi)</th>
                        <th className="py-3 px-3 min-w-[190px]">Önerilen KKD'ler</th>
                        <th className="py-3 px-3 text-center">Artık Risk</th>
                        <th className="py-3 px-3">Sorumlu</th>
                        <th className="py-3 px-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRiskEntries.map((re, idx) => {
                        const curScoreEval = calculateRiskScore(
                          riskMethod,
                          re.currentProbability,
                          re.currentSeverity,
                          re.currentFrequency
                        );
                        const resScoreEval = calculateRiskScore(
                          riskMethod,
                          re.residualProbability,
                          re.residualSeverity,
                          re.residualFrequency
                        );

                        return (
                          <tr
                            key={re.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                          >
                            <td className="py-3 px-3 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {re.hazard}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {re.consequence}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                  {re.hazardType}
                                </span>
                                {re.noiseDbA && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                    {re.noiseDbA} dB(A)
                                  </span>
                                )}
                                {re.healthSurveillanceRequired && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                    Sağlık Gözetimi Şart
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Mevcut Risk Skoru */}
                            <td className="py-3 px-3 text-center">
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {re.currentProbability} × {re.currentSeverity} = {curScoreEval.score}
                              </div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${curScoreEval.badgeBg} ${curScoreEval.badgeText}`}
                              >
                                {curScoreEval.level}
                              </span>
                            </td>

                            {/* KKD Öncesi Önlemler */}
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300 leading-snug">
                              {re.prePPEControls}
                            </td>

                            {/* Önerilen KKD'ler */}
                            <td className="py-3 px-3">
                              <div className="space-y-1">
                                {re.recommendedPPE.map((ppe, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="p-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px]"
                                  >
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {ppe.ppeName}
                                    </span>
                                    {ppe.standard && (
                                      <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-mono">
                                        {ppe.standard}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Artık Risk Skoru */}
                            <td className="py-3 px-3 text-center">
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {re.residualProbability} × {re.residualSeverity} = {resScoreEval.score}
                              </div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${resScoreEval.badgeBg} ${resScoreEval.badgeText}`}
                              >
                                {resScoreEval.level}
                              </span>
                            </td>

                            {/* Sorumlu & Termin */}
                            <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {re.responsiblePerson || 'İSG Birimi'}
                              </div>
                              <div className="text-slate-400">{re.dueDate || 'Sürekli'}</div>
                            </td>

                            {/* İşlemler */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenRiskModal(re)}
                                  title="Düzenle"
                                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRiskEntry(re.id)}
                                  title="Sil"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: RISK HEATMAP VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'heatmap' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-amber-500" />
                İşyeri Tehlike & Risk Isı Haritası (Heatmap)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bölümler ve tehlike türleri arasındaki risk yoğunluğu matrisi. Hücreye tıklayarak
                detayları görüntüleyebilirsiniz.
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500" /> Düşük (1-4)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-500" /> Orta (5-9)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-600" /> Yüksek (10-16)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-600" /> Çok Yüksek (17-25)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-slate-700">
                  <th className="p-2.5 text-left min-w-[180px] sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                    Bölüm / Alan
                  </th>
                  {ALL_HAZARD_TYPES.map((ht) => (
                    <th key={ht} className="p-2 min-w-[80px] text-[10px] leading-tight">
                      {ht}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-2.5 text-left font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                      <div className="truncate max-w-[200px]">{dept.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {dept.riskEntries.length} Tehlike Kaydı
                      </div>
                    </td>

                    {ALL_HAZARD_TYPES.map((ht) => {
                      const matched = dept.riskEntries.filter((r) => r.hazardType === ht);
                      if (matched.length === 0) {
                        return (
                          <td key={ht} className="p-2 text-slate-300 dark:text-slate-700 text-xs">
                            -
                          </td>
                        );
                      }

                      const maxScore = Math.max(...matched.map((r) => r.currentScore));
                      const scoreEval = calculateRiskScore(riskMethod, 1, maxScore);

                      return (
                        <td key={ht} className="p-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setCellModalData({
                                dept,
                                hazardType: ht,
                                entries: matched,
                              })
                            }
                            className={`w-full py-1.5 px-1 rounded-lg font-black text-[11px] transition shadow-xs cursor-pointer ${scoreEval.badgeBg} ${scoreEval.badgeText} hover:scale-105`}
                            title={`${dept.name} - ${ht}: Maksimum Skor ${maxScore}`}
                          >
                            {maxScore}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: PPE ADEQUACY CHECK VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'adequacy' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              KKD Yeterlilik ve Eksiklik Kontrolü
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bölüm matrisinde tanımlanan zorunlu KKD'ler ile personelin aktif zimmetleri
              karşılaştırılır; zimmetlenmemiş donanımlar kırmızı uyarı olarak tespit edilir.
            </p>
          </div>

          <div className="space-y-4">
            {departments.map((dept) => {
              const deptEmployees = employees.filter((e) => e.department === dept.name);
              // Required unique PPE names in this department
              const requiredPpeNames = Array.from(
                new Set(dept.riskEntries.flatMap((re) => re.recommendedPPE.map((p) => p.ppeName)))
              );

              return (
                <div
                  key={dept.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {dept.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({deptEmployees.length} Çalışan • {requiredPpeNames.length} Matris KKD'si)
                      </span>
                    </div>

                    <button
                      onClick={() => onBulkApplyDeptPPEToEmployees(dept)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs"
                    >
                      Bölümdeki Tüm Çalışanlara Eksiksiz KKD Ata
                    </button>
                  </div>

                  {deptEmployees.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">
                      Bu departmana kayıtlı çalışan bulunmamaktadır.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {deptEmployees.map((emp) => {
                        const empActiveAsgs = assignments.filter(
                          (a) => a.employeeId === emp.id && a.status === 'Aktif'
                        );
                        const assignedPpeNames = new Set(
                          empActiveAsgs.map((a) => a.ppeName.toLowerCase())
                        );

                        // Missing PPEs
                        const missingPpes = requiredPpeNames.filter(
                          (rName) => !assignedPpeNames.has(rName.toLowerCase())
                        );

                        return (
                          <div
                            key={emp.id}
                            className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                              missingPpes.length === 0
                                ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {emp.fullName}
                                </span>
                                <span className="text-[10px] text-slate-400">{emp.sicilNo}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Aktif Zimmet: {empActiveAsgs.length} KKD
                              </div>

                              {missingPpes.length === 0 ? (
                                <div className="mt-2 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Tüm Bölüm KKD'leri Zimmetli (Eksik Yok)
                                </div>
                              ) : (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-200 block">
                                    Eksik Donanımlar ({missingPpes.length}):
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {missingPpes.map((mPpe, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200"
                                      >
                                        ✗ {mPpe}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                              <button
                                onClick={() => onSelectEmployeeForAssign(emp)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                              >
                                Zimmetleri Düzenle
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer Bottom Banner */}
      <div className="p-3 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 text-xs italic">
        * Bu matris başlangıç taslağıdır. Risk skorları, KKD seçimi ve önlemler işyerinin gerçek
        koşullarına, ortam ölçümlerine, SDS'lere ve 6331 sayılı Kanun ile Risk Değerlendirmesi
        Yönetmeliği kapsamında oluşturulan risk değerlendirme ekibinin kararına göre belirlenmelidir.
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal 1: Add / Edit Department */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingDept ? 'Bölümü Düzenle' : 'Yeni İşyeri Bölümü Ekle'}
              </h3>
              <button
                onClick={() => setDeptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Bölüm / Alan Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Akü Şarj ve Forklift Bakım İstasyonu"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Faaliyet Açıklaması</label>
                <textarea
                  rows={3}
                  placeholder="Bu alanda yürütülen temel imalat veya operasyon süreçleri..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Ortam Gürültü Seviyesi (dB(A))</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Örn: 84.5"
                  value={deptNoise ?? ''}
                  onChange={(e) =>
                    setDeptNoise(e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Copy Department to Another Company */}
      {copyModalOpen && deptToCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Bölümü Başka Şirkete Kopyala
            </h3>
            <p className="text-xs text-slate-500">
              <strong>"{deptToCopy.name}"</strong> bölümünün tüm tehlike kayıtları ve KKD önerileri
              seçilen şirkete kopyalanacaktır.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">Hedef Şirket:</label>
              <select
                value={targetCompanyId}
                onChange={(e) => setTargetCompanyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {companies
                  .filter((c) => c.id !== company.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (targetCompanyId) {
                    onCopyDepartmentToCompany(deptToCopy, targetCompanyId);
                    setCopyModalOpen(false);
                    alert('Bölüm başarıyla hedef şirkete kopyalandı!');
                  }
                }}
                className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs"
              >
                Kopyala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Risk Entry */}
      {riskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingRisk ? 'Tehlike & Risk Kaydını Düzenle' : 'Bölüme Yeni Tehlike & Risk Ekle'}
                </h3>
              </div>
              <button
                onClick={() => setRiskModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRiskEntry} className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
              {/* Row 1: Hazard & Hazard Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Tehlike Tanımı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Yüksek devirli testere gürültüsü, MDF tozu, sıcak tutkal yanığı"
                    value={hazardText}
                    onChange={(e) => setHazardText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tehlike Türü</label>
                  <select
                    value={selectedHazardType}
                    onChange={(e) => setSelectedHazardType(e.target.value as HazardType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {ALL_HAZARD_TYPES.map((ht) => (
                      <option key={ht} value={ht}>
                        {ht}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Consequence */}
              <div>
                <label className="block font-semibold mb-1">Olası Risk ve Sonuç</label>
                <input
                  type="text"
                  placeholder="Örn: Kalıcı işitme kaybı, kornea çizilmesi, 2. derece el yanığı"
                  value={consequenceText}
                  onChange={(e) => setConsequenceText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Row 3: Current Risk Scoring (Mevcut Risk - KKD Öncesi) */}
              <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 dark:text-rose-200 text-xs">
                    1. MEVCUT RİSK (Önlem & KKD Öncesi Durum)
                  </span>
                  {(() => {
                    const sc = calculateRiskScore(
                      riskMethod,
                      curProb,
                      curSev,
                      riskMethod === 'FineKinney' ? curFreq : undefined
                    );
                    return (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-black ${sc.badgeBg} ${sc.badgeText}`}
                      >
                        Skor: {sc.score} ({sc.level})
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Olasılık</label>
                    <select
                      value={curProb}
                      onChange={(e) => setCurProb(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {riskMethod === '5x5'
                        ? MATRIX_5X5_PROBABILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label} ({o.meaning})
                            </option>
                          ))
                        : FINE_KINNEY_PROBABILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label} ({o.meaning})
                            </option>
                          ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Şiddet</label>
                    <select
                      value={curSev}
                      onChange={(e) => setCurSev(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {riskMethod === '5x5'
                        ? MATRIX_5X5_SEVERITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label} ({o.meaning})
                            </option>
                          ))
                        : FINE_KINNEY_SEVERITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label} ({o.meaning})
                            </option>
                          ))}
                    </select>
                  </div>

                  {riskMethod === 'FineKinney' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold mb-1">Frekans / Maruziyet</label>
                      <select
                        value={curFreq}
                        onChange={(e) => setCurFreq(parseFloat(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {FINE_KINNEY_FREQUENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label} ({o.meaning})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Hierarchy of Controls (Pre-PPE Measures) */}
              <div>
                <label className="block font-semibold mb-1 text-slate-900 dark:text-white">
                  KKD Öncesi Alınan Önlemler (Kontrol Hiyerarşisi: İkame, Mühendislik, İdari)
                </label>
                <textarea
                  rows={2}
                  placeholder="Örn: Lokal toz emiş siklonu, ses yalıtım kabini, makine siperlikleri, rotasyon..."
                  value={prePPEControls}
                  onChange={(e) => setPrePPEControls(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Row 5: Recommended PPE Picker */}
              <div className="space-y-1.5">
                <label className="block font-semibold">Önerilen KKD'ler ({selectedPpeNames.length} Seçili)</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {catalog.map((item) => {
                    const isChecked = selectedPpeNames.includes(item.name);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-1.5 p-1 rounded-lg cursor-pointer transition text-[11px] ${
                          isChecked
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 font-bold'
                            : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRecommendedPpe(item.name)}
                          className="rounded text-amber-600"
                        />
                        <span className="truncate">{item.name}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom PPE Write-in */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Listede olmayan özel KKD yazın..."
                    value={customPpeInput}
                    onChange={(e) => setCustomPpeInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPpeToEntry}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs"
                  >
                    Ekle
                  </button>
                </div>
              </div>

              {/* Row 6: Residual Risk Scoring (Artık Risk - KKD Sonrası) */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                    2. ARTIK RİSK (Önlem ve KKD Sonrası Kalan Risk)
                  </span>
                  {(() => {
                    const sc = calculateRiskScore(
                      riskMethod,
                      resProb,
                      resSev,
                      riskMethod === 'FineKinney' ? resFreq : undefined
                    );
                    return (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-black ${sc.badgeBg} ${sc.badgeText}`}
                      >
                        Skor: {sc.score} ({sc.level})
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Artık Olasılık</label>
                    <select
                      value={resProb}
                      onChange={(e) => setResProb(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {riskMethod === '5x5'
                        ? MATRIX_5X5_PROBABILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))
                        : FINE_KINNEY_PROBABILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Artık Şiddet</label>
                    <select
                      value={resSev}
                      onChange={(e) => setResSev(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {riskMethod === '5x5'
                        ? MATRIX_5X5_SEVERITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))
                        : FINE_KINNEY_SEVERITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 7: Additional Measurement & SDS references */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Gürültü dB(A)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Örn: 86.5"
                    value={noiseEntryDbA ?? ''}
                    onChange={(e) =>
                      setNoiseEntryDbA(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">SDS / Ölçüm Referansı</label>
                  <input
                    type="text"
                    placeholder="Örn: SDS Bölüm 8 VOC Sınırı"
                    value={sdsRef}
                    onChange={(e) => setSdsRef(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sorumlu & Termin</label>
                  <input
                    type="text"
                    placeholder="Örn: İSG Uzmanı / Sürekli"
                    value={respPerson}
                    onChange={(e) => setRespPerson(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={healthSurv}
                  onChange={(e) => setHealthSurv(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Bu tehlike için sağlık gözetimi / meslek hastalığı takibi gereklidir.
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRiskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  {editingRisk ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Heatmap Cell Detail Modal */}
      {cellModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600">
                  {cellModalData.dept.name}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {cellModalData.hazardType} Riskleri ({cellModalData.entries.length} Kayıt)
                </h3>
              </div>
              <button
                onClick={() => setCellModalData(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              {cellModalData.entries.map((ent) => {
                const curSc = calculateRiskScore(riskMethod, ent.currentProbability, ent.currentSeverity);
                return (
                  <div
                    key={ent.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{ent.hazard}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${curSc.badgeBg} ${curSc.badgeText}`}
                      >
                        Skor: {curSc.score}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{ent.consequence}</p>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">
                      <strong>Önlem:</strong> {ent.prePPEControls}
                    </div>
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-[10px] text-amber-700 block mb-0.5">
                        Gereken KKD'ler:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {ent.recommendedPPE.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600"
                          >
                            {p.ppeName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCellModalData(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
