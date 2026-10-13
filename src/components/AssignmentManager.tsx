import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  AlertTriangle,
  Clock,
  Sparkles,
  Printer,
  Trash2,
  Edit2,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  X,
  FileText,
  User,
} from 'lucide-react';
import {
  Company,
  DepartmentRiskProfile,
  Employee,
  JobRole,
  PPEAssignment,
  PPEItem,
} from '../types';
import { addMonthsToDate, formatDateTR, getExpiryStatus, getTodayISO } from '../utils/turkish';

interface AssignmentManagerProps {
  company: Company;
  employee: Employee;
  catalog: PPEItem[];
  jobRoles: JobRole[];
  departments: DepartmentRiskProfile[];
  assignments: PPEAssignment[];
  onAddAssignment: (assignment: PPEAssignment) => void;
  onUpdateAssignment: (assignment: PPEAssignment) => void;
  onDeleteAssignment: (assignmentId: string, removalReason?: string) => void;
  onOpenReturnModal: (assignment: PPEAssignment) => void;
  onOpenPrintModal: (employee: Employee) => void;
  onBackToList: () => void;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  company,
  employee,
  catalog,
  jobRoles,
  departments,
  assignments,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onOpenReturnModal,
  onOpenPrintModal,
  onBackToList,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<PPEAssignment | null>(null);

  // Selected PPE in Add Modal
  const [selectedPpeId, setSelectedPpeId] = useState(catalog[0]?.id || '');
  const [brandModel, setBrandModel] = useState('');
  const [serialOrCertNo, setSerialOrCertNo] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState(getTodayISO());
  const [renewalDate, setRenewalDate] = useState(addMonthsToDate(getTodayISO(), 12));
  const [size, setSize] = useState('');
  const [technicalDetails, setTechnicalDetails] = useState('');
  const [trainerName, setTrainerName] = useState(company.authorized.isgExpertName);
  const [trainingDate, setTrainingDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');

  // Non-assignment rationale modal for mandatory item removal
  const [removalModalOpen, setRemovalModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<PPEAssignment | null>(null);
  const [removalReason, setRemovalReason] = useState('');

  // Active employee assignments
  const employeeAssignments = assignments.filter((a) => a.employeeId === employee.id);

  // Get matching Job Roles for this employee (4-B)
  const matchingRoles = jobRoles.filter((r) => employee.jobTitles.includes(r.title));
  
  // Get matching Department for this employee (4-C)
  const matchingDept = departments.find(
    (d) => d.name.toLowerCase() === employee.department.toLowerCase()
  );

  // Merged suggestions map: Job Role (4-B) + Department Matrix (4-C)
  interface CombinedSuggestion {
    ppeName: string;
    standard: string;
    technicalCode: string;
    source: 'görev' | 'bölüm' | 'ikisi';
  }

  const suggestionMap = new Map<string, CombinedSuggestion>();

  // 1. Process Job Roles (4-B)
  matchingRoles.flatMap((r) => r.mandatoryPPE).forEach((p) => {
    const key = p.ppeName.trim().toLowerCase();
    suggestionMap.set(key, {
      ppeName: p.ppeName,
      standard: p.defaultStandard || '',
      technicalCode: p.defaultTechnicalCode || '',
      source: 'görev',
    });
  });

  // 2. Process Department Matrix (4-C)
  if (matchingDept) {
    matchingDept.riskEntries.flatMap((re) => re.recommendedPPE).forEach((p) => {
      const key = p.ppeName.trim().toLowerCase();
      if (suggestionMap.has(key)) {
        const existing = suggestionMap.get(key)!;
        existing.source = 'ikisi';
        if (!existing.standard && p.standard) existing.standard = p.standard;
      } else {
        suggestionMap.set(key, {
          ppeName: p.ppeName,
          standard: p.standard || '',
          technicalCode: p.technicalCode || '',
          source: 'bölüm',
        });
      }
    });
  }

  const suggestedMergedList = Array.from(suggestionMap.values());
  const suggestedMandatory = matchingRoles.flatMap((r) => r.mandatoryPPE);
  const suggestedConditional = matchingRoles.flatMap((r) => r.conditionalPPE);

  // Open Add modal with auto-fill based on PPE catalog item
  const handleOpenAddModal = (ppeItem?: PPEItem, presetCode?: string) => {
    const item = ppeItem || catalog.find((c) => c.id === selectedPpeId) || catalog[0];
    if (!item) return;

    setSelectedPpeId(item.id);
    setBrandModel('');
    setSerialOrCertNo('');
    setQuantity(1);
    setDeliveryDate(getTodayISO());
    setRenewalDate(
      item.recommendedRenewalMonths > 0
        ? addMonthsToDate(getTodayISO(), item.recommendedRenewalMonths)
        : getTodayISO()
    );

    // Prefill size according to category
    if (item.category === 'Ayak ve Bacak Koruma') {
      setSize(employee.shoeSize || '42');
    } else if (item.category === 'El ve Kol Koruma') {
      setSize(employee.gloveSize || '9');
    } else if (item.category === 'Vücut ve Giysi Koruma') {
      setSize(employee.clothingSize || 'L');
    } else {
      setSize('Standart');
    }

    setTechnicalDetails(presetCode || item.technicalSpecsExplained[0] || item.standards[0] || '');
    setTrainerName(company.authorized.isgExpertName);
    setTrainingDate(getTodayISO());
    setNotes('');
    setEditingAssignment(null);
    setIsAddModalOpen(true);
  };

  const handlePpeSelectionChange = (ppeId: string) => {
    setSelectedPpeId(ppeId);
    const item = catalog.find((c) => c.id === ppeId);
    if (!item) return;

    if (item.category === 'Ayak ve Bacak Koruma') {
      setSize(employee.shoeSize || '42');
    } else if (item.category === 'El ve Kol Koruma') {
      setSize(employee.gloveSize || '9');
    } else if (item.category === 'Vücut ve Giysi Koruma') {
      setSize(employee.clothingSize || 'L');
    } else {
      setSize('Standart');
    }

    setTechnicalDetails(item.technicalSpecsExplained[0] || item.standards[0] || '');
    setRenewalDate(
      item.recommendedRenewalMonths > 0
        ? addMonthsToDate(deliveryDate, item.recommendedRenewalMonths)
        : deliveryDate
    );
  };

  const handleEditAssignment = (asg: PPEAssignment) => {
    setEditingAssignment(asg);
    setSelectedPpeId(asg.ppeId);
    setBrandModel(asg.brandModel);
    setSerialOrCertNo(asg.serialOrCertNo || '');
    setSize(asg.size);
    setQuantity(asg.quantity);
    setDeliveryDate(asg.deliveryDate);
    setRenewalDate(asg.renewalDate);
    setTechnicalDetails(asg.technicalDetails);
    setTrainerName(asg.trainerName || company.authorized.isgExpertName);
    setTrainingDate(asg.trainingDate || asg.deliveryDate);
    setNotes(asg.notes || '');
    setIsAddModalOpen(true);
  };

  const handleAutoAssignJobRoles = () => {
    let addedCount = 0;
    suggestedMergedList.forEach((s) => {
      // Find item in catalog
      const catItem = catalog.find(
        (c) => c.name.toLowerCase() === s.ppeName.toLowerCase()
      );
      const alreadyHas = employeeAssignments.some(
        (a) => a.ppeName.toLowerCase() === s.ppeName.toLowerCase() && a.status === 'Aktif'
      );

      if (!alreadyHas && catItem) {
        let defaultSize = 'Standart';
        if (catItem.category === 'Ayak ve Bacak Koruma') defaultSize = employee.shoeSize || '42';
        else if (catItem.category === 'El ve Kol Koruma') defaultSize = employee.gloveSize || '9';
        else if (catItem.category === 'Vücut ve Giysi Koruma') defaultSize = employee.clothingSize || 'L';

        const newAsg: PPEAssignment = {
          id: `asg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          employeeId: employee.id,
          companyId: company.id,
          ppeId: catItem.id,
          ppeName: catItem.name,
          category: catItem.category,
          standard: s.standard || catItem.standards.join(', '),
          technicalDetails: s.technicalCode || catItem.technicalSpecsExplained[0] || '',
          brandModel: 'Mevzuat Standardı Uyumlu',
          serialOrCertNo: '',
          size: defaultSize,
          quantity: 1,
          deliveryDate: getTodayISO(),
          renewalDate:
            catItem.recommendedRenewalMonths > 0
              ? addMonthsToDate(getTodayISO(), catItem.recommendedRenewalMonths)
              : getTodayISO(),
          status: 'Aktif',
          trainerName: company.authorized.isgExpertName,
          trainingDate: getTodayISO(),
          notes: `Otomatik öneri (Kaynak: ${s.source.toUpperCase()})`,
          createdAt: new Date().toISOString(),
        };

        onAddAssignment(newAsg);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      alert(`Görev ve Bölüm matrisine uygun ${addedCount} adet KKD çalışana otomatik zimmetlendi.`);
    } else {
      alert('Önerilen tüm KKD\'ler zaten çalışana zimmetli durumda.');
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const item = catalog.find((c) => c.id === selectedPpeId);
    if (!item) return;

    if (editingAssignment) {
      const updated: PPEAssignment = {
        ...editingAssignment,
        ppeId: item.id,
        ppeName: item.name,
        category: item.category,
        standard: item.standards.join(', '),
        technicalDetails,
        brandModel: brandModel.trim() || 'Standart',
        serialOrCertNo: serialOrCertNo.trim() || undefined,
        size: size.trim(),
        quantity,
        deliveryDate,
        renewalDate,
        trainerName,
        trainingDate,
        notes: notes.trim() || undefined,
      };
      onUpdateAssignment(updated);
    } else {
      const newAsg: PPEAssignment = {
        id: `asg-${Date.now()}`,
        employeeId: employee.id,
        companyId: company.id,
        ppeId: item.id,
        ppeName: item.name,
        category: item.category,
        standard: item.standards.join(', '),
        technicalDetails,
        brandModel: brandModel.trim() || 'Standart',
        serialOrCertNo: serialOrCertNo.trim() || undefined,
        size: size.trim(),
        quantity,
        deliveryDate,
        renewalDate,
        status: 'Aktif',
        trainerName,
        trainingDate,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddAssignment(newAsg);
    }

    setIsAddModalOpen(false);
  };

  const handleRenewQuick = (asg: PPEAssignment) => {
    const item = catalog.find((c) => c.id === asg.ppeId);
    const months = item ? item.recommendedRenewalMonths : 12;
    const newRenewal = addMonthsToDate(getTodayISO(), months > 0 ? months : 12);

    const updated: PPEAssignment = {
      ...asg,
      deliveryDate: getTodayISO(),
      renewalDate: newRenewal,
      status: 'Aktif',
    };
    onUpdateAssignment(updated);
  };

  const promptRemoveAssignment = (asg: PPEAssignment) => {
    // Check if this was a mandatory item for employee's role
    const isMandatory = suggestedMandatory.some(
      (m) => m.ppeName.toLowerCase() === asg.ppeName.toLowerCase()
    );

    if (isMandatory) {
      setItemToRemove(asg);
      setRemovalReason('');
      setRemovalModalOpen(true);
    } else {
      if (confirm(`"${asg.ppeName}" zimmetini kaldırmak istediğinizden emin misiniz?`)) {
        onDeleteAssignment(asg.id);
      }
    }
  };

  const handleConfirmRemovalWithReason = () => {
    if (!itemToRemove) return;
    onDeleteAssignment(itemToRemove.id, removalReason.trim());
    setRemovalModalOpen(false);
    setItemToRemove(null);
  };

  return (
    <div className="space-y-5">
      {/* Employee Top Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {employee.fullName}
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {employee.sicilNo}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {employee.department}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>
                  <strong>Görevler:</strong> {employee.jobTitles.join(', ')}
                </span>
                <span>•</span>
                <span>
                  <strong>Ölçüler:</strong> Ayakkabı: {employee.shoeSize || '-'} | Tulum:{' '}
                  {employee.clothingSize || '-'} | Eldiven: {employee.gloveSize || '-'}
                </span>
                <span>•</span>
                <span>
                  <strong>İşe Giriş:</strong> {formatDateTR(employee.startDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenPrintModal(employee)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition"
            >
              <Printer className="w-4 h-4" />
              Zimmet & Taahhütname Yazdır
            </button>
            <button
              onClick={onBackToList}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
            >
              Çalışan Listesine Dön
            </button>
          </div>
        </div>
      </div>

      {/* Role Warning Notes Banner */}
      {matchingRoles.some((r) => r.warningNote) && (
        <div className="space-y-2">
          {matchingRoles
            .filter((r) => r.warningNote)
            .map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs flex items-start gap-2.5 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    {r.title} Görevi İçin İSG Notu:
                  </span>
                  <p className="text-amber-800 dark:text-amber-300 mt-0.5">{r.warningNote}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Auto-Suggest & Recommendation Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Görev & Bölüm Matrisine Göre Otomatik KKD Önerisi</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Görev: <strong>{employee.jobTitles.join(', ')}</strong> | Bölüm: <strong>{employee.department}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoAssignJobRoles}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Önerilen Tüm KKD'leri Ekle ({suggestedMergedList.length})
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Katalogdan Manuel Ekle
            </button>
          </div>
        </div>

        {/* Chips preview of merged items */}
        {suggestedMergedList.length > 0 && (
          <div className="pt-2 border-t border-amber-500/20 flex flex-wrap gap-1.5 items-center text-[10px]">
            <span className="text-slate-500 font-semibold mr-1">Önerilen Donanımlar:</span>
            {suggestedMergedList.map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800 border border-amber-300 dark:border-amber-800 flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200"
              >
                <span>{s.ppeName}</span>
                <span
                  className={`px-1 py-0.2 rounded text-[8.5px] font-bold uppercase ${
                    s.source === 'ikisi'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : s.source === 'bölüm'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {s.source}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Current Assignments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Zimmetli Donanım Listesi ({employeeAssignments.length} Kalem)
            </h3>
          </div>
        </div>

        {employeeAssignments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            Bu çalışana henüz KKD zimmetlenmemiştir. Yukarıdaki butondan önerilen KKD'leri
            ekleyebilirsiniz.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3">KKD Adı & Standart</th>
                  <th className="py-3 px-3">Teknik Özellik / Sınıf Kodu</th>
                  <th className="py-3 px-3">Marka & Seri/CE No</th>
                  <th className="py-3 px-3 text-center">Beden & Adet</th>
                  <th className="py-3 px-3">Teslim & Yenileme</th>
                  <th className="py-3 px-3 text-center">Durum / Kalan Süre</th>
                  <th className="py-3 px-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employeeAssignments.map((asg, index) => {
                  const expiry = getExpiryStatus(asg.renewalDate);

                  return (
                    <tr
                      key={asg.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {asg.ppeName}
                        </div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                          {asg.standard}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                          {asg.technicalDetails || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {asg.brandModel || 'Standart'}
                        </div>
                        {asg.serialOrCertNo && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {asg.serialOrCertNo}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {asg.size}
                        </span>
                        <div className="text-[11px] text-slate-500 font-bold">{asg.quantity} Adet</div>
                      </td>

                      <td className="py-3 px-3 text-[11px]">
                        <div>
                          Teslim: <span className="font-semibold">{formatDateTR(asg.deliveryDate)}</span>
                        </div>
                        <div className="text-slate-500">
                          Yenileme: <span className="font-semibold">{formatDateTR(asg.renewalDate)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            asg.status !== 'Aktif'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                              : expiry.status === 'expired'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                              : expiry.status === 'due-soon'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {asg.status !== 'Aktif' ? asg.status : expiry.label}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleRenewQuick(asg)}
                            title="Bugün İtibarıyla Yenile"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenReturnModal(asg)}
                            title="İade / Değişim Tutanağı Düzenle"
                            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditAssignment(asg)}
                            title="Düzenle"
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => promptRemoveAssignment(asg)}
                            title="Zimmetten Kaldır"
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

      {/* Add / Edit Assignment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {editingAssignment ? 'KKD Zimmetini Düzenle' : 'Çalışana Yeni KKD Zimmetle'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold mb-1">KKD Seçimi (Katalog) *</label>
                <select
                  value={selectedPpeId}
                  onChange={(e) => handlePpeSelectionChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.category}] {c.name} — ({c.standards.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Technical Code / Specification Picker */}
              <div>
                <label className="block font-semibold mb-1">
                  Teknik Özellik / Standart Sınıf Kodu (PDF Çıktısına Yazılır) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 4243XP, S3 SRC HRO, FFP2 NR Ventilli, A2P3"
                  value={technicalDetails}
                  onChange={(e) => setTechnicalDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  * EN 388, EN ISO 20345 veya EN 149 sınıflarını buraya tam kod olarak yazınız.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Marka & Model</label>
                  <input
                    type="text"
                    placeholder="Örn: 3M Peltor, Mekap Pro, Ansell"
                    value={brandModel}
                    onChange={(e) => setBrandModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Seri No / CE Belge No</label>
                  <input
                    type="text"
                    placeholder="CE 2777 veya SN: 2026-9812"
                    value={serialOrCertNo}
                    onChange={(e) => setSerialOrCertNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Beden / Ölçü</label>
                  <input
                    type="text"
                    placeholder="Örn: 42, L, 9, Standart"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Teslim Adedi</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Teslim Tarihi</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Yenileme / Değişim Tarihi</label>
                  <input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Eğitimi Veren / Teslim Eden</label>
                  <input
                    type="text"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Eğitim & Bilgilendirme Tarihi</label>
                  <input
                    type="date"
                    value={trainingDate}
                    onChange={(e) => setTrainingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Açıklama / Not</label>
                <textarea
                  rows={2}
                  placeholder="Kullanım şartı, ambalaj durumu veya istihkak notu..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {editingAssignment ? 'Güncelle' : 'Zimmete Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Non-Assignment Rationale Modal (Zorunlu KKD Çıkarıldığında Gerekçe) */}
      {removalModalOpen && itemToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Zorunlu KKD Kaldırılıyor!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong>{itemToRemove.ppeName}</strong> bu çalışanın görevi için zorunlu KKD
                  listesindedir.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Neden Zimmetlenmedi? (Gerekçe PDF Tutanağında Dipnot Olarak Çıkar):
              </label>
              <textarea
                rows={3}
                placeholder="Örn: Çalışanın mevcut sağlam KKD'si bulunuyor / Ortamda lokal havalandırma mevcut olduğundan bu vardiyada muaf..."
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemovalModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmRemovalWithReason}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Gerekçeyle Kaldır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
