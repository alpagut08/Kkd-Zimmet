import React, { useState } from 'react';
import { Layers, X, CheckCircle2, Users, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { Company, Employee, PPEAssignment, PPEItem } from '../types';
import { addMonthsToDate, getTodayISO } from '../utils/turkish';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  employees: Employee[];
  catalog: PPEItem[];
  preSelectedEmployees?: Employee[];
  onBulkAssign: (assignments: PPEAssignment[]) => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  company,
  employees,
  catalog,
  preSelectedEmployees,
  onBulkAssign,
}) => {
  const [targetEmpIds, setTargetEmpIds] = useState<Set<string>>(
    new Set(preSelectedEmployees?.map((e) => e.id) || employees.map((e) => e.id))
  );
  const [selectedPpeIds, setSelectedPpeIds] = useState<Set<string>>(new Set([catalog[0]?.id || '']));
  const [deliveryDate, setDeliveryDate] = useState(getTodayISO());
  const [brandModel, setBrandModel] = useState('Toplu Dağıtım Standart');
  const [filterDept, setFilterDept] = useState('ALL');

  if (!isOpen) return null;

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const toggleEmp = (id: string) => {
    setTargetEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = employees
      .filter((e) => filterDept === 'ALL' || e.department === filterDept)
      .map((e) => e.id);

    const allChecked = visibleIds.every((id) => targetEmpIds.has(id));
    setTargetEmpIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => {
        if (allChecked) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const togglePpe = (id: string) => {
    setSelectedPpeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetEmpIds.size === 0) {
      alert('Lütfen en az bir çalışan seçiniz.');
      return;
    }
    if (selectedPpeIds.size === 0) {
      alert('Lütfen en az bir KKD seçiniz.');
      return;
    }

    const newAssignments: PPEAssignment[] = [];

    targetEmpIds.forEach((empId) => {
      const emp = employees.find((e) => e.id === empId);
      if (!emp) return;

      selectedPpeIds.forEach((ppeId) => {
        const item = catalog.find((c) => c.id === ppeId);
        if (!item) return;

        let size = 'Standart';
        if (item.category === 'Ayak ve Bacak Koruma') size = emp.shoeSize || '42';
        else if (item.category === 'El ve Kol Koruma') size = emp.gloveSize || '9';
        else if (item.category === 'Vücut ve Giysi Koruma') size = emp.clothingSize || 'L';

        const renewal =
          item.recommendedRenewalMonths > 0
            ? addMonthsToDate(deliveryDate, item.recommendedRenewalMonths)
            : deliveryDate;

        newAssignments.push({
          id: `asg-bulk-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          employeeId: emp.id,
          companyId: company.id,
          ppeId: item.id,
          ppeName: item.name,
          category: item.category,
          standard: item.standards.join(', '),
          technicalDetails: item.technicalSpecsExplained[0] || '',
          brandModel: brandModel.trim() || 'Standart',
          size,
          quantity: 1,
          deliveryDate,
          renewalDate: renewal,
          status: 'Aktif',
          trainerName: company.authorized.isgExpertName,
          trainingDate: deliveryDate,
          notes: 'Toplu zimmet işlemi',
          createdAt: new Date().toISOString(),
        });
      });
    });

    onBulkAssign(newAssignments);
    alert(
      `Başarıyla ${targetEmpIds.size} çalışana toplam ${newAssignments.length} adet KKD zimmetlendi!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Toplu KKD Zimmeti Ata
              </h3>
              <p className="text-xs text-slate-500">
                Seçili çalışan grubuna veya tüm departmana tek seferde KKD paketi atayın.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExecute} className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
          {/* Step 1: Target Employees */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                1. Hedef Çalışanlar ({targetEmpIds.size} Seçili)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                >
                  <option value="ALL">Tüm Departmanlar</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={toggleAllVisible}
                  className="text-[11px] text-amber-600 font-semibold hover:underline"
                >
                  Tümünü Seç / Kaldır
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {employees
                .filter((e) => filterDept === 'ALL' || e.department === filterDept)
                .map((emp) => {
                  const isChecked = targetEmpIds.has(emp.id);
                  return (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition text-[11px] ${
                        isChecked
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEmp(emp.id)}
                        className="rounded text-amber-600"
                      />
                      <span className="truncate">{emp.fullName}</span>
                      <span className="text-[10px] text-slate-400 truncate">({emp.department})</span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* Step 2: PPE Items to assign */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              2. Zimmetlenecek KKD'leri Seçin ({selectedPpeIds.size} Seçili)
            </label>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {catalog.map((item) => {
                const isChecked = selectedPpeIds.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition text-[11px] ${
                      isChecked
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePpe(item.id)}
                      className="rounded text-emerald-600"
                    />
                    <span className="truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400">({item.category})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 3: Distribution parameters */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
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
              <label className="block font-semibold mb-1">Ortak Marka / Model Bilgisi</label>
              <input
                type="text"
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">
              * Her çalışanın ayakkabı, tulum ve eldiven bedeni profilden otomatik doldurulacaktır.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                Toplu Zimmeti Onayla
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
