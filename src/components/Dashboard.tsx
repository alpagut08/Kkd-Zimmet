import React from 'react';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  FileText,
  UserPlus,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Company, Employee, PPEAssignment, PPEItem } from '../types';
import { formatDateTR, getExpiryStatus } from '../utils/turkish';

interface DashboardProps {
  company: Company;
  employees: Employee[];
  assignments: PPEAssignment[];
  catalog: PPEItem[];
  onNavigateTab: (tab: 'employees' | 'catalog' | 'matrix' | 'returns') => void;
  onSelectEmployeeForAssign: (emp: Employee) => void;
  onOpenBulkAssign: () => void;
  onOpenPrintModal: (emp?: Employee) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  company,
  employees,
  assignments,
  onNavigateTab,
  onSelectEmployeeForAssign,
  onOpenBulkAssign,
  onOpenPrintModal,
}) => {
  const activeAssignments = assignments.filter((a) => a.status === 'Aktif');

  // Count expiring soon (within 30 days) and expired
  const expiredList: { asg: PPEAssignment; emp?: Employee; daysLeft: number }[] = [];
  const dueSoonList: { asg: PPEAssignment; emp?: Employee; daysLeft: number }[] = [];

  const empMap = new Map(employees.map((e) => [e.id, e]));

  activeAssignments.forEach((asg) => {
    const status = getExpiryStatus(asg.renewalDate);
    const emp = empMap.get(asg.employeeId);
    if (status.status === 'expired') {
      expiredList.push({ asg, emp, daysLeft: status.daysLeft });
    } else if (status.status === 'due-soon') {
      dueSoonList.push({ asg, emp, daysLeft: status.daysLeft });
    }
  });

  // Most assigned PPEs
  const ppeCountMap = new Map<string, number>();
  activeAssignments.forEach((asg) => {
    const count = ppeCountMap.get(asg.ppeName) || 0;
    ppeCountMap.set(asg.ppeName, count + asg.quantity);
  });
  const topAssignedPPE = Array.from(ppeCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Risk Gap Analysis: Check if employees have a risk factor but lack the corresponding PPE
  const riskGaps: { emp: Employee; missingType: string; reason: string }[] = [];

  employees.forEach((emp) => {
    const empAsgs = activeAssignments.filter((a) => a.employeeId === emp.id);

    if (emp.riskFactors?.includes('Gürültü (>80 dB)')) {
      const hasHearing = empAsgs.some((a) => a.category === 'İşitme Koruma');
      if (!hasHearing) {
        riskGaps.push({
          emp,
          missingType: 'İşitme Koruyucu',
          reason: 'Gürültü riski (>80 dB) mevcut ancak kulaklık veya tıkaç zimmetlenmemiş!',
        });
      }
    }

    if (emp.riskFactors?.includes('Yüksekte Çalışma (>1.8m)')) {
      const hasHarness = empAsgs.some((a) => a.category === 'Yüksekten Düşmeyi Önleme');
      if (!hasHarness) {
        riskGaps.push({
          emp,
          missingType: 'Düşme Durdurma Ekipmanı',
          reason: 'Yüksekte çalışma riski mevcut ancak paraşüt tipi kemer/lanyard zimmetlenmemiş!',
        });
      }
    }

    if (emp.riskFactors?.includes('Kimyasal / Çözücü / Boya')) {
      const hasChem = empAsgs.some(
        (a) => a.category === 'El ve Kol Koruma' && a.ppeName.toLowerCase().includes('kimyasal')
      );
      if (!hasChem) {
        riskGaps.push({
          emp,
          missingType: 'Kimyasal Eldiven / Maske',
          reason: 'Kimyasal/solvent riski tanımlı ancak EN ISO 374-1 kimyasal eldiven bulunmuyor!',
        });
      }
    }

    if (emp.riskFactors?.includes('Ahşap / Taş / Metal Tozu')) {
      const hasResp = empAsgs.some((a) => a.category === 'Solunum Koruma');
      if (!hasResp) {
        riskGaps.push({
          emp,
          missingType: 'Solunum Maskesi (FFP2/FFP3)',
          reason: 'Toz riski mevcut ancak toz maskesi atanmamış!',
        });
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {company.title}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              İSG Kişisel Koruyucu Donanım Takip Paneli
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              6331 sayılı İSG Kanunu ve KKD Yönetmeliği uyarınca çalışan zimmetlerini, yenileme sürelerini ve
              görev matrislerini merkezi olarak yönetin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('employees')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              Çalışan Yönetimi
            </button>
            <button
              onClick={onOpenBulkAssign}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition"
            >
              <Layers className="w-4 h-4" />
              Toplu KKD Zimmeti
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Çalışan */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kayıtlı Çalışan
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {employees.length}
            </div>
            <span className="text-[11px] text-slate-500">Tüm aktif personel</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Aktif Zimmet */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aktif KKD Zimmeti
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {activeAssignments.length}
            </div>
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Sahada zimmetli</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Yaklaşan Yenilemeler (30 gün) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Yenileme Yaklaşan
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {dueSoonList.length}
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">≤ 30 gün kalanlar</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Süresi Geçmiş */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Süresi Dolan KKD
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {expiredList.length}
            </div>
            <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Acil değişim gerekli</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Risk Gap Warning Box (İSG Uyarıları) */}
      {riskGaps.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 shadow-sm">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>İSG Risk Uyuşmazlığı Tespiti ({riskGaps.length} Uyarı)</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 mb-3">
            Aşağıdaki çalışanların profillerinde risk faktörü işaretli olduğu halde, ilgili koruyucu donanım
            henüz zimmetlenmemiştir:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {riskGaps.slice(0, 4).map((gap, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {gap.emp.fullName}
                  </span>{' '}
                  <span className="text-slate-500">({gap.emp.department})</span>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    {gap.reason}
                  </div>
                </div>
                <button
                  onClick={() => onSelectEmployeeForAssign(gap.emp)}
                  className="px-2 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-[11px] font-semibold shrink-0 ml-2"
                >
                  KKD Ata
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Urgent Expirations & Quick Top Assigned */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Expirations & Warnings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                KKD Yenileme ve Değişim Takip Listesi
              </h3>
              <span className="text-xs text-slate-500">
                Toplam {expiredList.length + dueSoonList.length} kayıt
              </span>
            </div>

            {expiredList.length === 0 && dueSoonList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Şu anda süresi geçmiş veya 30 gün içinde yenilenmesi gereken KKD bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {/* Expired items */}
                {expiredList.map(({ asg, emp, daysLeft }) => (
                  <div
                    key={asg.id}
                    className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-900 dark:text-rose-200">
                          {asg.ppeName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                          Süresi Geçti ({Math.abs(daysLeft)} gün)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Çalışan: <span className="font-medium">{emp?.fullName || 'Bilinmiyor'}</span> | Yenileme Tarihi:{' '}
                        {formatDateTR(asg.renewalDate)}
                      </div>
                    </div>
                    {emp && (
                      <button
                        onClick={() => onSelectEmployeeForAssign(emp)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm transition shrink-0 ml-2"
                      >
                        Yenile
                      </button>
                    )}
                  </div>
                ))}

                {/* Due soon items */}
                {dueSoonList.map(({ asg, emp, daysLeft }) => (
                  <div
                    key={asg.id}
                    className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-900 dark:text-amber-200">
                          {asg.ppeName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                          {daysLeft} gün kaldı
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Çalışan: <span className="font-medium">{emp?.fullName || 'Bilinmiyor'}</span> | Yenileme Tarihi:{' '}
                        {formatDateTR(asg.renewalDate)}
                      </div>
                    </div>
                    {emp && (
                      <button
                        onClick={() => onSelectEmployeeForAssign(emp)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition shrink-0 ml-2"
                      >
                        Yönet
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right (1 col): Top Assigned PPEs & Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              En Çok Zimmetlenen KKD'ler
            </h3>
            {topAssignedPPE.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Henüz zimmet kaydı yok.</p>
            ) : (
              <div className="space-y-2.5">
                {topAssignedPPE.map(([name, count], index) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {index + 1}
                      </span>
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                        {name}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs shrink-0">
                      {count} adet
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Hızlı İşlemler
            </h4>
            <button
              onClick={() => onNavigateTab('catalog')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                KKD Kataloğu ve Standart Kodları
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigateTab('matrix')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                Görev – KKD Eşleştirme Matrisi
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => onOpenPrintModal()}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Tüm Çalışanlar İçin Toplu PDF Yazdır
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
