import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Copy,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Search,
  Download,
  X,
  ShieldAlert,
} from 'lucide-react';
import { JobRole, JobRoleAssignmentDef, PPEItem } from '../types';
import { turkishIncludes } from '../utils/turkish';

interface JobMatrixViewProps {
  jobRoles: JobRole[];
  catalog: PPEItem[];
  onAddJobRole: (role: JobRole) => void;
  onUpdateJobRole: (role: JobRole) => void;
  onDeleteJobRole: (roleId: string) => void;
}

export const JobMatrixView: React.FC<JobMatrixViewProps> = ({
  jobRoles,
  catalog,
  onAddJobRole,
  onUpdateJobRole,
  onDeleteJobRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);

  // Modal Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [warningNote, setWarningNote] = useState('');
  const [mandatoryPPE, setMandatoryPPE] = useState<JobRoleAssignmentDef[]>([]);
  const [conditionalPPE, setConditionalPPE] = useState<JobRoleAssignmentDef[]>([]);

  // Add PPE to list dropdown
  const [selectedPpeToAdd, setSelectedPpeToAdd] = useState('');
  const [addAsMandatory, setAddAsMandatory] = useState(true);

  const filteredRoles = jobRoles.filter(
    (r) =>
      turkishIncludes(r.title, searchTerm) ||
      (r.description && turkishIncludes(r.description, searchTerm)) ||
      (r.warningNote && turkishIncludes(r.warningNote, searchTerm))
  );

  const handleOpenModal = (role?: JobRole) => {
    if (role) {
      setEditingRole(role);
      setTitle(role.title);
      setDescription(role.description || '');
      setWarningNote(role.warningNote || '');
      setMandatoryPPE([...role.mandatoryPPE]);
      setConditionalPPE([...role.conditionalPPE]);
    } else {
      setEditingRole(null);
      setTitle('');
      setDescription('');
      setWarningNote('');
      setMandatoryPPE([]);
      setConditionalPPE([]);
    }
    setSelectedPpeToAdd(catalog[0]?.name || '');
    setIsModalOpen(true);
  };

  const handleCloneRole = (role: JobRole) => {
    const cloned: JobRole = {
      ...role,
      id: `role-clone-${Date.now()}`,
      title: `${role.title} (Kopya)`,
      isCustom: true,
    };
    onAddJobRole(cloned);
  };

  const handleAddPPEToRole = () => {
    if (!selectedPpeToAdd) return;
    const catItem = catalog.find((c) => c.name === selectedPpeToAdd);

    const newDef: JobRoleAssignmentDef = {
      ppeName: selectedPpeToAdd,
      defaultStandard: catItem ? catItem.standards.join(', ') : 'Standart Belirtilmedi',
      defaultTechnicalCode: catItem ? catItem.technicalSpecsExplained[0] : '',
    };

    if (addAsMandatory) {
      if (!mandatoryPPE.some((m) => m.ppeName === selectedPpeToAdd)) {
        setMandatoryPPE([...mandatoryPPE, newDef]);
      }
    } else {
      if (!conditionalPPE.some((c) => c.ppeName === selectedPpeToAdd)) {
        setConditionalPPE([...conditionalPPE, newDef]);
      }
    }
  };

  const handleRemoveMandatory = (idx: number) => {
    setMandatoryPPE(mandatoryPPE.filter((_, i) => i !== idx));
  };

  const handleRemoveConditional = (idx: number) => {
    setConditionalPPE(conditionalPPE.filter((_, i) => i !== idx));
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const roleData: JobRole = {
      id: editingRole ? editingRole.id : `role-custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      mandatoryPPE,
      conditionalPPE,
      warningNote: warningNote.trim() || undefined,
      isCustom: true,
    };

    if (editingRole) {
      onUpdateJobRole(roleData);
    } else {
      onAddJobRole(roleData);
    }
    setIsModalOpen(false);
  };

  const exportMatrixJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jobRoles, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `isg_gorev_kkd_matrisi_${new Date().toISOString().slice(0, 10)}.json`);
    dl.click();
    dl.remove();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Görev adı veya uyarı notu ara (örn: marangoz, kaynakçı, boyahane)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportMatrixJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Matrisi İndir (JSON)
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Yeni Görev Ekle
          </button>
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {filteredRoles.map((role, index) => (
          <div
            key={role.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3"
          >
            {/* Header: Title + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {role.title}
                  </h3>
                  {role.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={() => handleCloneRole(role)}
                  title="Görevi Kopyala"
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kopyala</span>
                </button>
                <button
                  onClick={() => handleOpenModal(role)}
                  title="Görevi Düzenle"
                  className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Düzenle</span>
                </button>
                {role.isCustom && (
                  <button
                    onClick={() => {
                      if (confirm(`"${role.title}" görevini silmek istediğinize emin misiniz?`)) {
                        onDeleteJobRole(role.id);
                      }
                    }}
                    title="Sil"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mandatory & Conditional PPE Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ZORUNLU KKD'ler */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 dark:text-emerald-200 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>ZORUNLU KKD'LER (Otomatik İşaretlenir - {role.mandatoryPPE.length})</span>
                </div>
                {role.mandatoryPPE.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Zorunlu KKD tanımlanmamış.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {role.mandatoryPPE.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900/40"
                      >
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">•</span>
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {item.ppeName}
                          </span>
                          {item.defaultStandard && (
                            <span className="text-[11px] text-slate-500 block">
                              Standart: {item.defaultStandard}
                            </span>
                          )}
                          {item.defaultTechnicalCode && (
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono block">
                              Önerilen Kod: {item.defaultTechnicalCode}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* DURUMA GÖRE KKD'ler */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60">
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900 dark:text-blue-200 mb-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>DURUMA GÖRE / İSTEĞE BAĞLI ({role.conditionalPPE.length})</span>
                </div>
                {role.conditionalPPE.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Duruma göre KKD tanımlanmamış.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {role.conditionalPPE.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900/40"
                      >
                        <span className="font-bold text-blue-600">•</span>
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {item.ppeName}
                          </span>
                          {item.defaultStandard && (
                            <span className="text-[11px] text-slate-500 block">
                              Standart: {item.defaultStandard}
                            </span>
                          )}
                          {item.defaultTechnicalCode && (
                            <span className="text-[10px] text-blue-800 dark:text-blue-300 font-mono block">
                              {item.defaultTechnicalCode}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* NOT Sarı Uyarı Kutusu */}
            {role.warningNote && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    Önemli İSG Değerlendirme Notu:
                  </span>
                  <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    {role.warningNote}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mandatory Disclaimer Footer */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Yasal Uyarı:</strong> Bu eşleştirme başlangıç önerisidir; nihai KKD seçimi işyeri risk
          değerlendirmesi, SDS (Güvenlik Bilgi Formu) ve ürün etiketine göre İSG uzmanı tarafından
          belirlenmelidir.
        </span>
      </div>

      {/* Modal for Add / Edit Role */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {editingRole ? 'Görevi ve KKD Listesini Düzenle' : 'Yeni Görev Tanımı Ekle'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold mb-1">Görev / Pozisyon Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Plazma Kesim Operatörü"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Açıklama</label>
                <input
                  type="text"
                  placeholder="İşin kısa tanımı..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Add PPE Section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block font-semibold">Göreve KKD Ekle:</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={selectedPpeToAdd}
                    onChange={(e) => setSelectedPpeToAdd(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    {catalog.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.category})
                      </option>
                    ))}
                  </select>

                  <select
                    value={addAsMandatory ? 'ZORUNLU' : 'DURUMA_GORE'}
                    onChange={(e) => setAddAsMandatory(e.target.value === 'ZORUNLU')}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="ZORUNLU">Zorunlu KKD Olarak</option>
                    <option value="DURUMA_GORE">Duruma Göre Olarak</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddPPEToRole}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs"
                  >
                    Listeye Ekle
                  </button>
                </div>
              </div>

              {/* List of Current Mandatory PPE */}
              <div>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                  Zorunlu KKD'ler ({mandatoryPPE.length}):
                </span>
                <div className="space-y-1">
                  {mandatoryPPE.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-xs"
                    >
                      <span>{m.ppeName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMandatory(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* List of Current Conditional PPE */}
              <div>
                <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">
                  Duruma Göre KKD'ler ({conditionalPPE.length}):
                </span>
                <div className="space-y-1">
                  {conditionalPPE.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 text-xs"
                    >
                      <span>{c.ppeName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveConditional(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning Note */}
              <div>
                <label className="block font-semibold mb-1 text-amber-700 dark:text-amber-400">
                  NOT / Uyarı Kutusu (Sarı İSG Hatırlatması)
                </label>
                <textarea
                  rows={3}
                  placeholder="Dönen parçalarda eldiven yasağı, SDS kontrolü, periyodik muayene notu..."
                  value={warningNote}
                  onChange={(e) => setWarningNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Görevi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
