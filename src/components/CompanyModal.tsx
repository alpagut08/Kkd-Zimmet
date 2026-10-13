import React, { useState, useEffect } from 'react';
import { X, Building2, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { Company, DangerClass } from '../types';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyToEdit?: Company | null;
  onSave: (company: Company) => void;
  onDelete?: (companyId: string) => void;
}

const DEFAULT_COMMITMENT =
  'Yukarıda cinsi, adedi ve standardı belirtilen kişisel koruyucu donanımları eksiksiz ve sağlam olarak teslim aldığımı beyan ederim. 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik kapsamında; bana verilen KKD\'lerin kullanımı, bakımı ve saklanması konusunda bilgilendirildiğimi, işyerinde zorunlu olan çalışma alanlarında bu donanımları eksiksiz ve talimatlara uygun şekilde kullanacağımı, kendi isteğimle değiştirmeyeceğimi, amacı dışında kullanmayacağımı ve işyeri dışına çıkarmayacağımı, hasar, kayıp veya kullanım ömrünün bitmesi durumunda gecikmeden amirime ve İSG birimine bildireceğimi, işten ayrılmam hâlinde donanımları iade edeceğimi, kasıt veya ihmalim sonucu kaybolması/zarar görmesi durumunda şirket prosedürlerinin uygulanacağını kabul ve taahhüt ederim.';

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  companyToEdit,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sgkSicilNo, setSgkSicilNo] = useState('');
  const [taxNo, setTaxNo] = useState('');
  const [dangerClass, setDangerClass] = useState<DangerClass>('Tehlikeli');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  // Authorized
  const [employerName, setEmployerName] = useState('');
  const [employerTitle, setEmployerTitle] = useState('Fabrika Müdürü (İşveren Vekili)');
  const [isgExpertName, setIsgExpertName] = useState('');
  const [isgExpertCertNo, setIsgExpertCertNo] = useState('');
  const [isgExpertClass, setIsgExpertClass] = useState<'A' | 'B' | 'C'>('B');
  const [workplaceDoctorName, setWorkplaceDoctorName] = useState('');
  const [employeeRepName, setEmployeeRepName] = useState('');

  // Commitment text
  const [customCommitmentText, setCustomCommitmentText] = useState(DEFAULT_COMMITMENT);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (companyToEdit) {
      setTitle(companyToEdit.title);
      setAddress(companyToEdit.address || '');
      setPhone(companyToEdit.phone || '');
      setEmail(companyToEdit.email || '');
      setSgkSicilNo(companyToEdit.sgkSicilNo || '');
      setTaxNo(companyToEdit.taxNo || '');
      setDangerClass(companyToEdit.dangerClass || 'Tehlikeli');
      setLogoUrl(companyToEdit.logoUrl);
      setEmployerName(companyToEdit.authorized.employerName || '');
      setEmployerTitle(companyToEdit.authorized.employerTitle || 'İşveren / İşveren Vekili');
      setIsgExpertName(companyToEdit.authorized.isgExpertName || '');
      setIsgExpertCertNo(companyToEdit.authorized.isgExpertCertNo || '');
      setIsgExpertClass(companyToEdit.authorized.isgExpertClass || 'B');
      setWorkplaceDoctorName(companyToEdit.authorized.workplaceDoctorName || '');
      setEmployeeRepName(companyToEdit.authorized.employeeRepName || '');
      setCustomCommitmentText(companyToEdit.customCommitmentText || DEFAULT_COMMITMENT);
    } else {
      setTitle('');
      setAddress('');
      setPhone('');
      setEmail('');
      setSgkSicilNo('');
      setTaxNo('');
      setDangerClass('Tehlikeli');
      setLogoUrl(undefined);
      setEmployerName('');
      setEmployerTitle('İşveren / İşveren Vekili');
      setIsgExpertName('');
      setIsgExpertCertNo('');
      setIsgExpertClass('B');
      setWorkplaceDoctorName('');
      setEmployeeRepName('');
      setCustomCommitmentText(DEFAULT_COMMITMENT);
    }
    setErrorMessage('');
  }, [companyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Logo boyutu 2 MB üzerinde olamaz.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Şirket unvanı zorunludur.');
      return;
    }
    if (!isgExpertName.trim()) {
      setErrorMessage('İSG Uzmanı adı zorunludur (PDF imza alanı için gereklidir).');
      return;
    }

    const updatedCompany: Company = {
      id: companyToEdit ? companyToEdit.id : `comp-${Date.now()}`,
      title: title.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      sgkSicilNo: sgkSicilNo.trim(),
      taxNo: taxNo.trim(),
      dangerClass,
      logoUrl,
      authorized: {
        employerName: employerName.trim(),
        employerTitle: employerTitle.trim(),
        isgExpertName: isgExpertName.trim(),
        isgExpertCertNo: isgExpertCertNo.trim(),
        isgExpertClass,
        workplaceDoctorName: workplaceDoctorName.trim(),
        employeeRepName: employeeRepName.trim(),
      },
      customCommitmentText: customCommitmentText.trim(),
      createdAt: companyToEdit ? companyToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedCompany);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">
                {companyToEdit ? 'Şirket Bilgilerini Düzenle' : 'Yeni Şirket Kaydı Ekle'}
              </h3>
              <p className="text-xs text-slate-500">
                Form başlıkları, SGK ve PDF resmi imza yetkilileri bu bilgilerden oluşturulur.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}

          {/* Section 1: Kurumsal Bilgiler */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3">
              1. Şirket & İşyeri Bilgileri
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Şirket Resmi Unvanı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: ANADOLU MOBİLYA SANAYİ VE TİC. A.Ş."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İşyeri Tehlike Sınıfı
                </label>
                <select
                  value={dangerClass}
                  onChange={(e) => setDangerClass(e.target.value as DangerClass)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  <option value="Az Tehlikeli">Az Tehlikeli (Ofis, Büro, Mağaza)</option>
                  <option value="Tehlikeli">Tehlikeli (Montaj, İmalat, Depolama)</option>
                  <option value="Çok Tehlikeli">Çok Tehlikeli (Ağır Sanayi, Kimya, Maden, İnşaat)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SGK Sicil Numarası
                </label>
                <input
                  type="text"
                  placeholder="Örn: 4.2920.02.02.1045678.016.12-45"
                  value={sgkSicilNo}
                  onChange={(e) => setSgkSicilNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vergi Dairesi / No
                </label>
                <input
                  type="text"
                  placeholder="Örn: 0680456789 - İnegöl V.D."
                  value={taxNo}
                  onChange={(e) => setTaxNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefon / İletişim
                </label>
                <input
                  type="text"
                  placeholder="Örn: 0 (224) 714 80 90"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İşyeri Açık Adresi
                </label>
                <input
                  type="text"
                  placeholder="Örn: Organize Sanayi Bölgesi 4. Cadde No: 18 İnegöl / BURSA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              {/* Logo Upload */}
              <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Şirket Logosu (PDF ve Form Başlığında Çıkar)
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm transition">
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      Logo Yükle (PNG/JPG)
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl(undefined)}
                        className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Logoyu Kaldır
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Yetkili Kişiler (İmza Alanları) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3">
              2. Yetkili Kişiler (PDF ve Zimmet İmza Blokları)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İşveren / İşveren Vekili Adı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Mehmet Yılmaz"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İşveren Vekili Unvanı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Fabrika Müdürü / Genel Müdür"
                  value={employerTitle}
                  onChange={(e) => setEmployerTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İSG Uzmanı Adı Soyadı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Yakup Erdem"
                  value={isgExpertName}
                  onChange={(e) => setIsgExpertName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    İSG Katip Belge No
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: İSG-KATİP: 104859"
                    value={isgExpertCertNo}
                    onChange={(e) => setIsgExpertCertNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sınıfı
                  </label>
                  <select
                    value={isgExpertClass}
                    onChange={(e) => setIsgExpertClass(e.target.value as 'A' | 'B' | 'C')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                  >
                    <option value="A">A Sınıfı</option>
                    <option value="B">B Sınıfı</option>
                    <option value="C">C Sınıfı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İşyeri Hekimi (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Dr. Zeynep Kaya (Dip. No: 48920)"
                  value={workplaceDoctorName}
                  onChange={(e) => setWorkplaceDoctorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Çalışan Temsilcisi (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Hasan Aktaş (Baş Temsilci)"
                  value={employeeRepName}
                  onChange={(e) => setEmployeeRepName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Taahhütname Metni */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                3. Yasal Taahhütname Metni (6331 Sayılı Kanun Kapsamı)
              </h4>
              <button
                type="button"
                onClick={() => setCustomCommitmentText(DEFAULT_COMMITMENT)}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
              >
                Mevzuat Metnini Geri Yükle
              </button>
            </div>
            <textarea
              rows={4}
              value={customCommitmentText}
              onChange={(e) => setCustomCommitmentText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {companyToEdit && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${companyToEdit.title}" şirketini silmek istediğinizden emin misiniz?`)) {
                    onDelete(companyToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              >
                <Trash2 className="w-4 h-4" /> Şirketi Sil
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
