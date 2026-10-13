import React, { useRef } from 'react';
import {
  Building2,
  Moon,
  Sun,
  Download,
  Upload,
  Plus,
  ShieldCheck,
  Edit,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { Company } from '../types';

interface HeaderProps {
  companies: Company[];
  activeCompany: Company;
  onSelectCompany: (companyId: string) => void;
  onOpenCompanyModal: (company?: Company) => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  companies,
  activeCompany,
  onSelectCompany,
  onOpenCompanyModal,
  onExportJSON,
  onImportJSON,
  darkMode,
  onToggleDarkMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getDangerBadgeClass = (dangerClass: string) => {
    switch (dangerClass) {
      case 'Çok Tehlikeli':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800';
      case 'Tehlikeli':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 dark:from-white dark:via-slate-200 dark:to-amber-400 bg-clip-text text-transparent truncate">
                  İSG KKD Zimmet & Taahhüt
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                  6331 MEVZUAT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                Kişisel Koruyucu Donanım Yönetim & Yasal Taahhütname Portalı
              </p>
            </div>
          </div>

          {/* Active Company Selector & Info Pill */}
          <div className="flex items-center gap-2 max-w-md min-w-0">
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400 ml-2 shrink-0" />
              <select
                aria-label="Aktif Şirket Seçiniz"
                value={activeCompany.id}
                onChange={(e) => onSelectCompany(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 pr-7 pl-2 py-1 focus:outline-none cursor-pointer truncate max-w-[140px] sm:max-w-[210px] md:max-w-[260px]"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900 dark:text-slate-100 dark:bg-slate-900">
                    {c.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onOpenCompanyModal(activeCompany)}
                title="Seçili Şirketi Düzenle"
                className="p-1 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onOpenCompanyModal()}
                title="Yeni Şirket Ekle"
                className="p-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Danger class badge */}
            <span
              className={`hidden lg:inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold border ${getDangerBadgeClass(
                activeCompany.dangerClass
              )}`}
            >
              <AlertTriangle className="w-3 h-3 mr-1 inline" />
              {activeCompany.dangerClass}
            </span>
          </div>

          {/* Right Action Tools: Backup, Restore, Theme */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onExportJSON}
              title="Tüm Verilerin Yedeğini İndir (JSON)"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Yedek Al</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Yedekten Geri Yükle (JSON)"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Yedek Yükle</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportJSON}
              accept=".json"
              className="hidden"
            />

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={darkMode ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent dark:border-slate-700 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Sub-bar showing Authorized Personnel & SGK */}
        <div className="py-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">SGK Sicil:</span>{' '}
              {activeCompany.sgkSicilNo || 'Belirtilmedi'}
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-600 inline" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">İSG Uzmanı:</span>{' '}
              {activeCompany.authorized.isgExpertName} ({activeCompany.authorized.isgExpertCertNo || 'Belge No Yok'})
            </span>
            {activeCompany.authorized.workplaceDoctorName && (
              <span className="hidden md:inline-flex items-center gap-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">İşyeri Hekimi:</span>{' '}
                {activeCompany.authorized.workplaceDoctorName}
              </span>
            )}
          </div>
          <div className="shrink-0 text-slate-400 text-[10px]">
            Tarih Biçimi: <span className="font-medium text-slate-600 dark:text-slate-300">GG.AA.YYYY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
