import React, { useState } from 'react';
import {
  Search,
  Star,
  Info,
  Plus,
  ShieldAlert,
  Clock,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PPECategory, PPEItem, PPERiskCategory } from '../types';
import { turkishIncludes } from '../utils/turkish';

interface PPECatalogViewProps {
  catalog: PPEItem[];
  onAddCustomPPE: (item: PPEItem) => void;
  onUpdatePPE: (item: PPEItem) => void;
  onToggleFavorite: (id: string) => void;
}

const CATEGORY_TABS: { label: string; value: PPECategory | 'ALL' }[] = [
  { label: 'Tüm KKD\'ler', value: 'ALL' },
  { label: 'Kafa Koruma', value: 'Kafa Koruma' },
  { label: 'İşitme Koruma', value: 'İşitme Koruma' },
  { label: 'Göz ve Yüz', value: 'Göz ve Yüz Koruma' },
  { label: 'Solunum Koruma', value: 'Solunum Koruma' },
  { label: 'El ve Kol', value: 'El ve Kol Koruma' },
  { label: 'Ayak ve Bacak', value: 'Ayak ve Bacak Koruma' },
  { label: 'Vücut ve Giysi', value: 'Vücut ve Giysi Koruma' },
  { label: 'Yüksekte Çalışma', value: 'Yüksekten Düşmeyi Önleme' },
  { label: 'Özel / Diğer', value: 'Özel / Diğer' },
];

export const PPECatalogView: React.FC<PPECatalogViewProps> = ({
  catalog,
  onAddCustomPPE,
  onUpdatePPE,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PPECategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Detail Modal
  const [detailItem, setDetailItem] = useState<PPEItem | null>(null);

  // Add / Edit Custom PPE Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<PPECategory>('El ve Kol Koruma');
  const [customStandards, setCustomStandards] = useState('');
  const [customStandardTitle, setCustomStandardTitle] = useState('');
  const [customRiskCat, setCustomRiskCat] = useState<PPERiskCategory>('Kategori II');
  const [customDesc, setCustomDesc] = useState('');
  const [customSpecs, setCustomSpecs] = useState('');
  const [customUsage, setCustomUsage] = useState('');
  const [customCautions, setCustomCautions] = useState('');
  const [customRenewalMonths, setCustomRenewalMonths] = useState(12);

  // Filter logic
  const filteredItems = catalog.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;

    const matchesFavorites = !onlyFavorites || item.isFavorite;

    const matchesSearch =
      turkishIncludes(item.name, searchTerm) ||
      turkishIncludes(item.standardTitle, searchTerm) ||
      turkishIncludes(item.description, searchTerm) ||
      turkishIncludes(item.usageArea, searchTerm) ||
      turkishIncludes(item.cautions, searchTerm) ||
      item.standards.some((s) => turkishIncludes(s, searchTerm)) ||
      item.technicalSpecsExplained.some((sp) => turkishIncludes(sp, searchTerm));

    return matchesCategory && matchesFavorites && matchesSearch;
  });

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: PPEItem = {
      id: `ppe-custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      standards: customStandards.split(',').map((s) => s.trim()).filter(Boolean),
      standardTitle: customStandardTitle.trim() || 'Özel Koruyucu Donanım Standardı',
      riskCategory: customRiskCat,
      description: customDesc.trim(),
      technicalSpecsExplained: customSpecs
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      usageArea: customUsage.trim(),
      cautions: customCautions.trim(),
      recommendedRenewalMonths: customRenewalMonths,
      isCustom: true,
      isFavorite: false,
    };

    onAddCustomPPE(newItem);
    setIsAddModalOpen(false);
    // Reset form
    setCustomName('');
    setCustomStandards('');
    setCustomStandardTitle('');
    setCustomDesc('');
    setCustomSpecs('');
    setCustomUsage('');
    setCustomCautions('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Big Search Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="KKD adı, standart (örn: EN 388, S3, FFP2), anahtar kelime (kaynak, boya, ahşap) ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Quick Filters: Sık Kullanılanlar & Yeni KKD */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                onlyFavorites
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : 'text-amber-500'}`} />
              Favoriler
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Özel KKD Ekle
            </button>
          </div>
        </div>

        {/* Category Horizontal Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.value;
            const count =
              tab.value === 'ALL'
                ? catalog.length
                : catalog.filter((c) => c.category === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Toplam {filteredItems.length} donanım listeleniyor</span>
        <span className="hidden sm:inline italic">
          * Kart üzerindeki "Teknik Standart Detayı" butonuna basarak EN kod açıklamalarını görüntüleyin.
        </span>
      </div>

      {/* Grid of PPE Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Card Top: Category & Favorite */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {item.category}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.riskCategory === 'Kategori III'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : item.riskCategory === 'Kategori II'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.riskCategory}
                  </span>
                  <button
                    onClick={() => onToggleFavorite(item.id)}
                    title={item.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                    className="p-1 text-slate-400 hover:text-amber-500 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        item.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                {item.name}
              </h3>

              {/* Standards Tags */}
              <div className="flex flex-wrap gap-1 my-2">
                {item.standards.map((std, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                  >
                    {std}
                  </span>
                ))}
              </div>

              {/* Short Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                {item.description}
              </p>

              {/* Renewal info */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Tavsiye Edilen Ömür:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {item.recommendedRenewalMonths === 0
                      ? 'Tek Kullanımlık'
                      : `${item.recommendedRenewalMonths} Ay`}
                  </strong>
                </span>
              </div>
            </div>

            {/* Card Footer: Detail & Options */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setDetailItem(item)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Info className="w-3.5 h-3.5" />
                Standart Detayı & Kodlar
              </button>
              {item.isCustom && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                  Özel Tanımlı
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Technical Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                    {detailItem.category}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {detailItem.riskCategory}
                  </span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mt-0.5">
                  {detailItem.name}
                </h3>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Standart Başlığı */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl">
                <span className="block font-bold text-blue-900 dark:text-blue-200 text-xs mb-1">
                  Uygulanan Standartlar & Başlık:
                </span>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {detailItem.standards.map((std, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-[11px]"
                    >
                      {std}
                    </span>
                  ))}
                </div>
                <p className="text-blue-800 dark:text-blue-300 font-medium">
                  {detailItem.standardTitle}
                </p>
              </div>

              {/* Teknik Özellikler ve Kod Açıklamaları (Madde Madde) */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Teknik Özellik ve Kod İşaretleri Açıklaması:
                </h4>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-slate-700 dark:text-slate-200 font-mono text-[11px] leading-relaxed">
                  {detailItem.technicalSpecsExplained.map((spec, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-600 shrink-0">•</span>
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kullanım Alanları */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1">
                  Tipik Kullanım Alanları:
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {detailItem.usageArea}
                </p>
              </div>

              {/* Dikkat Edilecek Hususlar */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
                    İSG Uzmanı ve Kullanıcı İçin Dikkat Edilecek Hususlar:
                  </span>
                  <p className="text-amber-800 dark:text-amber-300 text-xs mt-0.5 leading-relaxed">
                    {detailItem.cautions}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom PPE Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  Kataloğa Yeni Özel KKD Ekle
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="p-6 space-y-3 flex-1 overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold mb-1">KKD Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ark Korumalı Deri Montaj Eldiveni"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Kategori</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as PPECategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {CATEGORY_TABS.filter((c) => c.value !== 'ALL').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Risk Kategorisi</label>
                  <select
                    value={customRiskCat}
                    onChange={(e) => setCustomRiskCat(e.target.value as PPERiskCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Kategori I">Kategori I (Basit riskler)</option>
                    <option value="Kategori II">Kategori II (Orta mekanik riskler)</option>
                    <option value="Kategori III">Kategori III (Ölümcül/Geri dönüşsüz riskler)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Standartlar (Virgülle ayırın)</label>
                <input
                  type="text"
                  placeholder="Örn: EN 388:2016, EN 407:2020"
                  value={customStandards}
                  onChange={(e) => setCustomStandards(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Standart Başlığı / Anlamı</label>
                <input
                  type="text"
                  placeholder="Örn: Mekanik ve Termal Risklere Karşı Koruma"
                  value={customStandardTitle}
                  onChange={(e) => setCustomStandardTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Açıklama</label>
                <input
                  type="text"
                  placeholder="Kısa ürün tanıtımı..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Teknik Özellik ve Kod Açıklamaları (Her satıra bir madde)
                </label>
                <textarea
                  rows={3}
                  placeholder="Örn:&#10;1. Aşınma Seviyesi 4: En yüksek aşınma dayanımı&#10;2. Kesilme Seviyesi X: Coup testi uygulanmadı"
                  value={customSpecs}
                  onChange={(e) => setCustomSpecs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Kullanım Alanı</label>
                  <input
                    type="text"
                    placeholder="Montaj, şantiye..."
                    value={customUsage}
                    onChange={(e) => setCustomUsage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tavsiye Edilen Ömür (Ay)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={customRenewalMonths}
                    onChange={(e) => setCustomRenewalMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Dikkat Edilecek Hususlar</label>
                <input
                  type="text"
                  placeholder="Kullanıcıya ve İSG uzmanına önemli uyarı..."
                  value={customCautions}
                  onChange={(e) => setCustomCautions(e.target.value)}
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
                  Kataloğa Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
