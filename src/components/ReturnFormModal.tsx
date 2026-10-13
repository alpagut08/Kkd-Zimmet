import React, { useState } from 'react';
import { RotateCcw, X, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Company, Employee, PPEAssignment, ReturnRecord } from '../types';
import { getTodayISO } from '../utils/turkish';

interface ReturnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: PPEAssignment;
  employee?: Employee;
  company: Company;
  onSaveReturn: (record: ReturnRecord, updatedAssignment: PPEAssignment) => void;
}

export const ReturnFormModal: React.FC<ReturnFormModalProps> = ({
  isOpen,
  onClose,
  assignment,
  employee,
  company,
  onSaveReturn,
}) => {
  const [returnDate, setReturnDate] = useState(getTodayISO());
  const [returnReason, setReturnReason] = useState<ReturnRecord['returnReason']>(
    'Kullanım Ömrü Doldu / Aşınma'
  );
  const [condition, setCondition] = useState<ReturnRecord['condition']>('Hurdaya Ayrıldı');
  const [notes, setNotes] = useState('');
  const [receivedBy, setReceivedBy] = useState(company.authorized.isgExpertName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: ReturnRecord = {
      id: `ret-${Date.now()}`,
      assignmentId: assignment.id,
      employeeId: assignment.employeeId,
      companyId: company.id,
      ppeName: assignment.ppeName,
      returnDate,
      returnReason,
      condition,
      notes: notes.trim() || undefined,
      receivedBy: receivedBy.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedAssignment: PPEAssignment = {
      ...assignment,
      status: condition === 'Yenisi Verildi' ? 'Yenilendi' : 'İade Edildi',
    };

    onSaveReturn(record, updatedAssignment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                KKD İade & Değişim Tutanağı
              </h3>
              <p className="text-xs text-slate-500">
                Çalışan: <span className="font-semibold">{employee?.fullName || 'Bilinmiyor'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block text-[11px]">İade Edilen Donanım:</span>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
              {assignment.ppeName}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              Standart: {assignment.standard} | Beden: {assignment.size} | Marka: {assignment.brandModel}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">İade Tarihi</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">İade Nedeni</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value as ReturnRecord['returnReason'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="Kullanım Ömrü Doldu / Aşınma">Kullanım Ömrü Doldu / Aşınma</option>
                <option value="Hasar / Arıza">Hasar / Arıza / Kaza</option>
                <option value="Beden / Uyumsuzluk">Beden / Ergonomi Uyumsuzluğu</option>
                <option value="İşten Ayrılma">İşten Ayrılma</option>
                <option value="Görev Değişikliği">Görev Değişikliği</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Donanımın Akıbeti / Durumu</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ReturnRecord['condition'])}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="Hurdaya Ayrıldı">Hurdaya Ayrıldı (İmha Edilecek)</option>
              <option value="Yenisi Verildi">Yenisi Verildi (Değişim Yapıldı)</option>
              <option value="Temizlenip Depolandı">Temizlenip Depolandı (Yeniden Kullanılabilir)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Teslim Alan İSG / Amir Adı</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">İade Açıklaması / Durum Değerlendirmesi</label>
            <textarea
              rows={2}
              placeholder="Ekipmandaki deformasyon, hasar ayrıntısı veya tutanak notu..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
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
              Tutanağı Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
