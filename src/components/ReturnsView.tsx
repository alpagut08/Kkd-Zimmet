import React, { useState } from 'react';
import { RotateCcw, Search, Download, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Company, Employee, ReturnRecord } from '../types';
import { formatDateTR, turkishIncludes } from '../utils/turkish';
import * as XLSX from 'xlsx';

interface ReturnsViewProps {
  company: Company;
  employees: Employee[];
  returnRecords: ReturnRecord[];
  onDeleteReturnRecord: (id: string) => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({
  company,
  employees,
  returnRecords,
  onDeleteReturnRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState('ALL');

  const empMap = new Map(employees.map((e) => [e.id, e]));

  const filtered = returnRecords.filter((rec) => {
    const emp = empMap.get(rec.employeeId);
    const matchesSearch =
      turkishIncludes(rec.ppeName, searchTerm) ||
      (emp && turkishIncludes(emp.fullName, searchTerm)) ||
      (rec.notes && turkishIncludes(rec.notes, searchTerm)) ||
      turkishIncludes(rec.receivedBy, searchTerm);

    const matchesReason = filterReason === 'ALL' || rec.returnReason === filterReason;

    return matchesSearch && matchesReason;
  });

  const exportReturnsToExcel = () => {
    const exportData = filtered.map((rec, i) => {
      const emp = empMap.get(rec.employeeId);
      return {
        'Sıra': i + 1,
        'Çalışan': emp?.fullName || 'Bilinmiyor',
        'Sicil No': emp?.sicilNo || '-',
        'KKD Adı': rec.ppeName,
        'İade Tarihi': formatDateTR(rec.returnDate),
        'İade Nedeni': rec.returnReason,
        'Donanımın Akıbeti': rec.condition,
        'Teslim Alan Yetkili': rec.receivedBy,
        'Notlar': rec.notes || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'İade ve Değişimler');
    XLSX.writeFile(wb, `${company.title.slice(0, 15)}_KKD_Iade_Raporu.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Çalışan adı, KKD adı veya yetkili ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">Tüm İade Nedenleri</option>
            <option value="Kullanım Ömrü Doldu / Aşınma">Kullanım Ömrü Doldu / Aşınma</option>
            <option value="Hasar / Arıza">Hasar / Arıza</option>
            <option value="Beden / Uyumsuzluk">Beden / Uyumsuzluk</option>
            <option value="İşten Ayrılma">İşten Ayrılma</option>
            <option value="Görev Değişikliği">Görev Değişikliği</option>
          </select>
        </div>

        <button
          onClick={exportReturnsToExcel}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
          İade Raporu İndir (Excel)
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <RotateCcw className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            Henüz kaydedilmiş KKD iade veya değişim tutanağı bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3">Çalışan Bilgisi</th>
                  <th className="py-3 px-3">İade Edilen KKD</th>
                  <th className="py-3 px-3">İade Tarihi</th>
                  <th className="py-3 px-3">İade Nedeni</th>
                  <th className="py-3 px-3">Donanım Durumu</th>
                  <th className="py-3 px-3">Teslim Alan</th>
                  <th className="py-3 px-3">Açıklama / Not</th>
                  <th className="py-3 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((rec, idx) => {
                  const emp = empMap.get(rec.employeeId);
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {emp?.fullName || 'Bilinmiyor'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {emp?.department} ({emp?.sicilNo})
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {rec.ppeName}
                      </td>
                      <td className="py-3 px-3">{formatDateTR(rec.returnDate)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          {rec.returnReason}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rec.condition === 'Hurdaya Ayrıldı'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : rec.condition === 'Yenisi Verildi'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {rec.condition}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {rec.receivedBy}
                      </td>
                      <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate">
                        {rec.notes || '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm('İade tutanağını silmek istediğinize emin misiniz?')) {
                              onDeleteReturnRecord(rec.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
  );
};
