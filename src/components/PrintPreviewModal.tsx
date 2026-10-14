import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Building2,
  CheckSquare,
  Square,
  Sliders,
  Sparkles,
  FileDown,
} from 'lucide-react';
import { Company, Employee, PPEAssignment, PPEItem } from '../types';
import { formatDateTR, generateFormNo, maskTCKN } from '../utils/turkish';
import { downloadPPEAssignmentWordDoc } from '../utils/wordExport';
import { SignaturePad } from './SignaturePad';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  employees: Employee[];
  assignments: PPEAssignment[];
  catalog: PPEItem[];
  targetEmployee?: Employee; // undefined means bulk print all
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  company,
  employees,
  assignments,
  catalog,
  targetEmployee,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    targetEmployee?.id || employees[0]?.id || ''
  );
  const [isBulkPrint, setIsBulkPrint] = useState(!targetEmployee);
  const [maskTC, setMaskTC] = useState(true);
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);
  const [useDigitalSignature, setUseDigitalSignature] = useState(false);
  const [printScale, setPrintScale] = useState<'fit' | '100' | '95' | '90' | '85'>('100');
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Digital Signatures
  const [employeeSignature, setEmployeeSignature] = useState<string>('');
  const [isgSignature, setIsgSignature] = useState<string>('');

  if (!isOpen) return null;

  // Print trigger
  const handlePrint = () => {
    window.print();
  };

  const printableEmployees = isBulkPrint
    ? employees
    : employees.filter((e) => e.id === selectedEmpId);

  const handleDownloadWord = async () => {
    try {
      setIsExportingWord(true);
      await downloadPPEAssignmentWordDoc(company, printableEmployees, assignments, maskTC);
    } catch (err: any) {
      alert(`Word dosyası oluşturulurken hata meydana geldi: ${err?.message || err}`);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:static print:bg-white">
      <div className="print-modal-content bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col border border-slate-200 dark:border-slate-800 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full">
        {/* Controls Toolbar (Hidden in print) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                KKD Zimmet Tutanağı & Taahhütname Önizleme (A4 Dikey)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Tek Sayfa A4 Garantili
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Tarayıcı Yazdırma (Ctrl+P / PDF) veya düzenlenebilir Microsoft Word (.docx) olarak indirin.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadWord}
              disabled={isExportingWord}
              title="Formu düzenlenebilir Microsoft Word (.docx) belgesi olarak indir"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 transition disabled:opacity-60 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              {isExportingWord ? 'Word Hazırlanıyor...' : 'Word (.docx) İndir'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Yazdır / PDF Olarak Kaydet
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Option toggles (Hidden in print) */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            {/* Single vs Bulk Selector */}
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Yazdırılacak:</label>
              <select
                value={isBulkPrint ? 'BULK' : selectedEmpId}
                onChange={(e) => {
                  if (e.target.value === 'BULK') {
                    setIsBulkPrint(true);
                  } else {
                    setIsBulkPrint(false);
                    setSelectedEmpId(e.target.value);
                  }
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="BULK">Tüm Çalışanlar (Toplu Yazdırma - {employees.length} Kişi)</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    Tek: {e.fullName} ({e.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Scale / Fit Selector */}
            <div className="flex items-center gap-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Sayfa Ölçeği:</label>
              <select
                value={printScale}
                onChange={(e) => setPrintScale(e.target.value as any)}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                title="Çok sayıda KKD olması durumunda sayfaya tam sığdırmak için ölçeği küçültebilirsiniz"
              >
                <option value="100">%100 (Standart - 1 Sayfa)</option>
                <option value="95">%95 (Hafif Kompakt)</option>
                <option value="90">%90 (Kompakt - 8+ KKD İçin)</option>
                <option value="85">%85 (Ultra Kompakt)</option>
              </select>
            </div>

            {/* Toggle Mask TC */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={maskTC}
                onChange={(e) => setMaskTC(e.target.checked)}
                className="rounded text-amber-600"
              />
              <span className="text-slate-700 dark:text-slate-300">TC Kimlik Maskeli (KVKK)</span>
            </label>

            {/* Toggle Detailed Specs */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDetailedSpecs}
                onChange={(e) => setShowDetailedSpecs(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Standart Açıklamaları Notu
              </span>
            </label>

            {/* Toggle Digital Canvas Signature */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useDigitalSignature}
                onChange={(e) => setUseDigitalSignature(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Ekranda Dijital İmza
              </span>
            </label>
          </div>
        </div>

        {/* Digital Signature Drawing Area (Visible only when toggle enabled and for single employee) */}
        {useDigitalSignature && !isBulkPrint && (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/60 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
            <SignaturePad
              label={`Çalışan İmzası: ${
                employees.find((e) => e.id === selectedEmpId)?.fullName || 'Çalışan'
              }`}
              initialSignature={employeeSignature}
              onSave={(sig) => setEmployeeSignature(sig)}
              onClear={() => setEmployeeSignature('')}
              height={90}
            />
            <SignaturePad
              label={`İSG Uzmanı İmzası: ${company.authorized.isgExpertName}`}
              initialSignature={isgSignature}
              onSave={(sig) => setIsgSignature(sig)}
              onClear={() => setIsgSignature('')}
              height={90}
            />
          </div>
        )}

        {/* Printable Document Body */}
        <div className="print-document-container flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 dark:bg-slate-950/80 print:p-0 print:bg-white print:overflow-visible">
          <div className="max-w-[210mm] mx-auto space-y-6 print:space-y-0 print:max-w-none print:w-full">
            {printableEmployees.map((emp, empIdx) => {
              const empAsgs = assignments.filter(
                (a) => a.employeeId === emp.id && a.status === 'Aktif'
              );

              // Scale wrapper helper class
              const scaleClass =
                printScale === '95'
                  ? 'scale-[0.95] origin-top'
                  : printScale === '90'
                  ? 'scale-[0.90] origin-top'
                  : printScale === '85'
                  ? 'scale-[0.85] origin-top'
                  : '';

              return (
                <div
                  key={emp.id}
                  className="a4-page bg-white text-slate-900 shadow-xl print:shadow-none p-5 sm:p-7 print:p-0 border border-slate-300 print:border-none rounded-xs flex flex-col justify-between"
                  style={{
                    pageBreakAfter: empIdx < printableEmployees.length - 1 ? 'always' : 'auto',
                    breakAfter: empIdx < printableEmployees.length - 1 ? 'page' : 'auto',
                  }}
                >
                  <div className={`space-y-2 ${scaleClass}`}>
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-1.5 flex items-start justify-between gap-3">
                      {/* Logo */}
                      <div className="w-16 h-12 flex items-center justify-center shrink-0">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt="Logo"
                            className="max-h-12 max-w-16 object-contain"
                          />
                        ) : (
                          <div className="w-14 h-11 border border-dashed border-slate-400 flex flex-col items-center justify-center text-[8px] text-slate-400 font-bold text-center">
                            <Building2 className="w-4 h-4 mb-0.5 text-slate-500" />
                            LOGO
                          </div>
                        )}
                      </div>

                      {/* Title block */}
                      <div className="flex-1 text-center px-1">
                        <h1 className="font-black text-xs sm:text-sm uppercase tracking-tight text-slate-900 leading-snug">
                          {company.title}
                        </h1>
                        <h2 className="font-extrabold text-[10.5px] uppercase tracking-wide text-amber-900 mt-0.5 leading-snug">
                          KİŞİSEL KORUYUCU DONANIM (KKD) ZİMMET TUTANAĞI VE TAAHHÜTNAMESİ
                        </h2>
                        <p className="text-[7.5px] text-slate-600 mt-0.5">
                          6331 Sayılı İSG Kanunu & Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik
                        </p>
                      </div>

                      {/* Meta Block */}
                      <div className="w-28 text-right text-[7.5px] text-slate-700 shrink-0 border border-slate-300 p-1 rounded bg-slate-50 leading-tight">
                        <div>
                          <strong>Form No:</strong> {generateFormNo(empIdx + 1)}
                        </div>
                        <div>
                          <strong>Tarih:</strong> {formatDateTR(new Date().toISOString().slice(0, 10))}
                        </div>
                        <div>
                          <strong>Revizyon:</strong> 01
                        </div>
                        <div>
                          <strong>Tehlike Sınıfı:</strong> {company.dangerClass}
                        </div>
                      </div>
                    </div>

                    {/* Bölüm 1: Çalışan Bilgileri */}
                    <div>
                      <div className="bg-slate-900 text-white font-bold text-[8.5px] px-2 py-0.5 tracking-wider uppercase rounded-t">
                        BÖLÜM 1 – ÇALIŞAN KİMLİK VE İŞ BİLGİLERİ
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[8.5px]">
                        <tbody>
                          <tr className="border-b border-slate-300">
                            <td className="py-0.5 px-1.5 font-bold bg-slate-50 w-24 border-r border-slate-300">
                              Adı Soyadı:
                            </td>
                            <td className="py-0.5 px-1.5 font-bold text-slate-900">
                              {emp.fullName}
                            </td>
                            <td className="py-0.5 px-1.5 font-bold bg-slate-50 w-24 border-r border-l border-slate-300">
                              T.C. Kimlik No:
                            </td>
                            <td className="py-0.5 px-1.5 font-mono">
                              {maskTC ? maskTCKN(emp.tcKimlikNo) : emp.tcKimlikNo || 'Belirtilmedi'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="py-0.5 px-1.5 font-bold bg-slate-50 border-r border-slate-300">
                              Sicil No:
                            </td>
                            <td className="py-0.5 px-1.5 font-semibold">{emp.sicilNo}</td>
                            <td className="py-0.5 px-1.5 font-bold bg-slate-50 border-r border-l border-slate-300">
                              İşe Giriş Tarihi:
                            </td>
                            <td className="py-0.5 px-1.5">{formatDateTR(emp.startDate)}</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 px-1.5 font-bold bg-slate-50 border-r border-slate-300">
                              Departman:
                            </td>
                            <td className="py-0.5 px-1.5">{emp.department}</td>
                            <td className="py-0.5 px-1.5 font-bold bg-slate-50 border-r border-l border-slate-300">
                              Görev / Unvan:
                            </td>
                            <td className="py-0.5 px-1.5 font-medium">{emp.jobTitles.join(', ')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bölüm 2: Zimmetlenen KKD Tablosu */}
                    <div>
                      <div className="bg-slate-900 text-white font-bold text-[8.5px] px-2 py-0.5 tracking-wider uppercase rounded-t">
                        BÖLÜM 2 – ZİMMETLENEN KİŞİSEL KORUYUCU DONANIMLAR (KKD) TABLOSU
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[8px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-center">
                            <th className="py-1 px-1 border-r border-slate-300 w-5">No</th>
                            <th className="py-1 px-1.5 border-r border-slate-300 text-left">KKD Cinsi & Standardı</th>
                            <th className="py-1 px-1.5 border-r border-slate-300 text-left">Teknik Özellik / Kod</th>
                            <th className="py-1 px-1 border-r border-slate-300">Marka / Model</th>
                            <th className="py-1 px-1 border-r border-slate-300 w-10">Beden</th>
                            <th className="py-1 px-1 border-r border-slate-300 w-7">Adet</th>
                            <th className="py-1 px-1 border-r border-slate-300 w-14">Teslim Trh</th>
                            <th className="py-1 px-1 border-r border-slate-300 w-14">Yenileme</th>
                            <th className="py-1 px-1 w-11">Paraf</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empAsgs.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-3 text-center text-slate-400 italic">
                                Bu personele henüz aktif KKD zimmeti atanmamıştır.
                              </td>
                            </tr>
                          ) : (
                            empAsgs.map((asg, i) => (
                              <tr key={asg.id} className="border-b border-slate-300">
                                <td className="py-0.5 px-1 text-center font-bold border-r border-slate-300">
                                  {i + 1}
                                </td>
                                <td className="py-0.5 px-1.5 border-r border-slate-300 font-semibold text-slate-900">
                                  <span>{asg.ppeName}</span>
                                  <span className="text-[7px] text-blue-800 font-mono ml-1.5">
                                    [{asg.standard}]
                                  </span>
                                </td>
                                <td className="py-0.5 px-1.5 border-r border-slate-300 font-mono text-[7px] text-slate-700">
                                  {asg.technicalDetails || '-'}
                                  {asg.serialOrCertNo && ` (Seri:${asg.serialOrCertNo})`}
                                </td>
                                <td className="py-0.5 px-1 border-r border-slate-300 text-center">
                                  {asg.brandModel || 'Standart'}
                                </td>
                                <td className="py-0.5 px-1 border-r border-slate-300 text-center font-semibold">
                                  {asg.size}
                                </td>
                                <td className="py-0.5 px-1 border-r border-slate-300 text-center font-bold">
                                  {asg.quantity}
                                </td>
                                <td className="py-0.5 px-1 border-r border-slate-300 text-center text-[7.5px]">
                                  {formatDateTR(asg.deliveryDate)}
                                </td>
                                <td className="py-0.5 px-1 border-r border-slate-300 text-center text-[7.5px]">
                                  {formatDateTR(asg.renewalDate)}
                                </td>
                                <td className="py-0.5 px-1 text-center font-mono text-[7px]">
                                  [&nbsp;&nbsp;&nbsp;&nbsp;]
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Standart ve Kod Açıklamaları Eki (Opsiyonel Bilgilendirme Notu) */}
                    {showDetailedSpecs && empAsgs.length > 0 && (
                      <div className="p-1.5 rounded border border-slate-300 bg-slate-50 text-[7px] leading-tight">
                        <div className="font-bold text-slate-900 uppercase tracking-wider mb-0.5">
                          KKD Standart ve Kod Bilgilendirme Notu:
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                          {empAsgs.map((asg) => {
                            const cat = catalog.find((c) => c.name === asg.ppeName);
                            if (!cat) return null;
                            return (
                              <div key={asg.id} className="truncate">
                                <span className="font-bold text-slate-900">• {asg.ppeName}:</span>{' '}
                                <span className="text-slate-600">
                                  {cat.technicalSpecsExplained.slice(0, 2).join(' | ')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bölüm 3: Çalışanın Yasal Taahhütnamesi */}
                    <div>
                      <div className="bg-slate-900 text-white font-bold text-[8.5px] px-2 py-0.5 tracking-wider uppercase rounded-t">
                        BÖLÜM 3 – ÇALIŞANIN KULLANIM VE MUHAFAZA TAAHHÜTNAMESİ
                      </div>
                      <div className="p-1.5 border border-slate-300 rounded-b text-[7.5px] leading-relaxed text-slate-800 text-justify bg-white">
                        {company.customCommitmentText ||
                          'Yukarıda cinsi, adedi ve standardı belirtilen kişisel koruyucu donanımları eksiksiz ve sağlam olarak teslim aldığımı beyan ederim. 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik kapsamında; tarafıma verilen KKD\'lerin kullanımı, bakımı ve saklanması konusunda eğitildiğimi, işyerinde zorunlu çalışma alanlarında bu donanımları eksiksiz ve talimatlara uygun şekilde kullanacağımı, kendi isteğimle değiştirmeyeceğimi, amacı dışında kullanmayacağımı ve işyeri dışına çıkarmayacağımı, hasar, arıza veya kullanım ömrünün bitmesi durumunda amirime ve İSG birimine bildireceğimi, işten ayrılmam hâlinde iade edeceğimi, kasıt veya ihmalim sonucu oluşacak zararlarda şirket prosedürlerinin uygulanacağını kabul ve taahhüt ederim.'}
                      </div>
                    </div>

                    {/* Bölüm 4: Eğitim / Bilgilendirme Kaydı */}
                    <div className="border border-slate-300 rounded p-1 text-[7.5px] bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-700">✓</span>
                        <span className="font-semibold text-slate-800">
                          KKD'lerin doğru kullanımı, bakımı, saklanması ve koruma sınırları hakkında uygulamalı bilgilendirme yapılmıştır.
                        </span>
                      </div>
                      <div className="text-right text-slate-600 space-x-2 text-[7.5px]">
                        <span>
                          <strong>Eğitim Tarihi:</strong> {formatDateTR(new Date().toISOString().slice(0, 10))}
                        </span>
                        <span>
                          <strong>Eğitici:</strong> {company.authorized.isgExpertName} (İSG Uzmanı)
                        </span>
                      </div>
                    </div>

                    {/* Bölüm 5: İmzalar (3 Blok) */}
                    <div>
                      <div className="bg-slate-900 text-white font-bold text-[8.5px] px-2 py-0.5 tracking-wider uppercase rounded-t">
                        BÖLÜM 5 – İMZA VE ONAY
                      </div>
                      <div className="grid grid-cols-3 border border-slate-300 rounded-b text-[8px]">
                        {/* 1: Teslim Alan Çalışan */}
                        <div className="p-1.5 border-r border-slate-300 flex flex-col justify-between h-20">
                          <div>
                            <div className="font-bold text-slate-900 uppercase text-[7.5px]">
                              TESLİM ALAN ÇALIŞAN
                            </div>
                            <div className="font-semibold text-[8px] text-slate-800 mt-0.5">
                              {emp.fullName}
                            </div>
                            <div className="text-[7px] text-slate-500">
                              Tarih: {formatDateTR(new Date().toISOString().slice(0, 10))}
                            </div>
                          </div>
                          <div className="text-center">
                            {useDigitalSignature && employeeSignature ? (
                              <img
                                src={employeeSignature}
                                alt="İmza"
                                className="h-8 mx-auto object-contain"
                              />
                            ) : (
                              <div className="text-slate-400 text-[7px] italic">
                                (İmza / Kaşe)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2: Teslim Eden / İSG Uzmanı */}
                        <div className="p-1.5 border-r border-slate-300 flex flex-col justify-between h-20">
                          <div>
                            <div className="font-bold text-slate-900 uppercase text-[7.5px]">
                              TESLİM EDEN / İSG UZMANI
                            </div>
                            <div className="font-semibold text-[8px] text-slate-800 mt-0.5">
                              {company.authorized.isgExpertName}
                            </div>
                            <div className="text-[7px] text-slate-500">
                              {company.authorized.isgExpertCertNo || 'İSG Katip No Belirtilmedi'}
                            </div>
                          </div>
                          <div className="text-center">
                            {useDigitalSignature && isgSignature ? (
                              <img
                                src={isgSignature}
                                alt="İSG İmza"
                                className="h-8 mx-auto object-contain"
                              />
                            ) : (
                              <div className="text-slate-400 text-[7px] italic">
                                (İmza / Kaşe)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3: İşveren / İşveren Vekili */}
                        <div className="p-1.5 flex flex-col justify-between h-20">
                          <div>
                            <div className="font-bold text-slate-900 uppercase text-[7.5px]">
                              İŞVEREN / İŞVEREN VEKİLİ
                            </div>
                            <div className="font-semibold text-[8px] text-slate-800 mt-0.5">
                              {company.authorized.employerName || 'Şirket Yetkilisi'}
                            </div>
                            <div className="text-[7px] text-slate-500">
                              {company.authorized.employerTitle}
                            </div>
                          </div>
                          <div className="text-center text-slate-400 text-[7px] italic">
                            (İmza / Kaşe)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Notes & Page Indicator */}
                  <div className="pt-1 border-t border-slate-300 text-[7px] text-slate-500 flex items-center justify-between mt-1">
                    <span>
                      Bu tutanak 2 (iki) asıl nüsha düzenlenir; 1 nüsha çalışana teslim edilir, 1 nüsha İSG özlük dosyasında saklanır.
                    </span>
                    <span className="font-semibold">
                      Sayfa {empIdx + 1} / {printableEmployees.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
