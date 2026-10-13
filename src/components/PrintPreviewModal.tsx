import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Building2,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  PenTool,
} from 'lucide-react';
import { Company, Employee, PPEAssignment, PPEItem } from '../types';
import { formatDateTR, generateFormNo, maskTCKN } from '../utils/turkish';
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
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(true);
  const [useDigitalSignature, setUseDigitalSignature] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Controls Toolbar (Hidden in print) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                KKD Zimmet Tutanağı & Taahhütname Önizleme (A4 Dikey)
              </h3>
              <p className="text-xs text-slate-500">
                Tarayıcı Yazdırma İletişim Kutusu (Ctrl+P / PDF Olarak Kaydet) Türkçe karakterleri
                bozmadan vektörel A4 PDF üretir.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              Yazdır / PDF Olarak Kaydet
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800"
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
                Standart ve Kod Açıklamaları Eki Dahil
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
                Ekranda Dijital İmza Kullan
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
              height={100}
            />
            <SignaturePad
              label={`İSG Uzmanı İmzası: ${company.authorized.isgExpertName}`}
              initialSignature={isgSignature}
              onSave={(sig) => setIsgSignature(sig)}
              onClear={() => setIsgSignature('')}
              height={100}
            />
          </div>
        )}

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 print:p-0 print:bg-white print:overflow-visible">
          <div className="max-w-[210mm] mx-auto space-y-8 print:space-y-0 print:max-w-none print:w-full">
            {printableEmployees.map((emp, empIdx) => {
              const empAsgs = assignments.filter(
                (a) => a.employeeId === emp.id && a.status === 'Aktif'
              );

              return (
                <div
                  key={emp.id}
                  className="a4-page bg-white text-slate-900 shadow-xl print:shadow-none p-8 sm:p-10 border border-slate-300 print:border-none rounded-sm min-h-[297mm] flex flex-col justify-between"
                  style={{
                    pageBreakAfter: empIdx < printableEmployees.length - 1 ? 'always' : 'auto',
                    breakAfter: empIdx < printableEmployees.length - 1 ? 'page' : 'auto',
                  }}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
                      {/* Logo or placeholder */}
                      <div className="w-20 h-16 flex items-center justify-center shrink-0">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt="Logo"
                            className="max-h-16 max-w-20 object-contain"
                          />
                        ) : (
                          <div className="w-16 h-14 border border-dashed border-slate-400 flex flex-col items-center justify-center text-[9px] text-slate-400 font-bold text-center">
                            <Building2 className="w-5 h-5 mb-0.5 text-slate-500" />
                            LOGO
                          </div>
                        )}
                      </div>

                      {/* Title block */}
                      <div className="flex-1 text-center">
                        <h1 className="font-extrabold text-sm sm:text-base uppercase tracking-tight text-slate-900">
                          {company.title}
                        </h1>
                        <h2 className="font-black text-xs sm:text-sm uppercase tracking-wide text-amber-800 mt-1">
                          KİŞİSEL KORUYUCU DONANIM (KKD) ZİMMET TUTANAĞI VE KULLANIM TAAHHÜTNAMESİ
                        </h2>
                        <p className="text-[9px] text-slate-600 mt-0.5">
                          6331 Sayılı İSG Kanunu & Kişisel Koruyucu Donanımların İşyerlerinde
                          Kullanılması Hakkında Yönetmelik
                        </p>
                      </div>

                      {/* Meta Block */}
                      <div className="w-32 text-right text-[9px] text-slate-700 shrink-0 border border-slate-300 p-1.5 rounded bg-slate-50">
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
                          <strong>Tehlike:</strong> {company.dangerClass}
                        </div>
                      </div>
                    </div>

                    {/* Bölüm 1: Çalışan Bilgileri */}
                    <div>
                      <div className="bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1 tracking-wider uppercase rounded-t">
                        BÖLÜM 1 – ÇALIŞAN KİMLİK VE İŞ BİLGİLERİ
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[10px]">
                        <tbody>
                          <tr className="border-b border-slate-300">
                            <td className="p-1.5 font-bold bg-slate-50 w-28 border-r border-slate-300">
                              Adı Soyadı:
                            </td>
                            <td className="p-1.5 font-semibold text-slate-900">
                              {emp.fullName}
                            </td>
                            <td className="p-1.5 font-bold bg-slate-50 w-28 border-r border-l border-slate-300">
                              T.C. Kimlik No:
                            </td>
                            <td className="p-1.5 font-mono">
                              {maskTC ? maskTCKN(emp.tcKimlikNo) : emp.tcKimlikNo || 'Belirtilmedi'}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">
                              Sicil No:
                            </td>
                            <td className="p-1.5 font-semibold">{emp.sicilNo}</td>
                            <td className="p-1.5 font-bold bg-slate-50 border-r border-l border-slate-300">
                              İşe Giriş Tarihi:
                            </td>
                            <td className="p-1.5">{formatDateTR(emp.startDate)}</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">
                              Departman / Birim:
                            </td>
                            <td className="p-1.5">{emp.department}</td>
                            <td className="p-1.5 font-bold bg-slate-50 border-r border-l border-slate-300">
                              Görev / Unvan:
                            </td>
                            <td className="p-1.5 font-medium">{emp.jobTitles.join(', ')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bölüm 2: Zimmetlenen KKD Tablosu */}
                    <div>
                      <div className="bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1 tracking-wider uppercase rounded-t">
                        BÖLÜM 2 – ZİMMETLENEN KİŞİSEL KORUYUCU DONANIMLAR (KKD) TABLOSU
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[9px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-center">
                            <th className="p-1 border-r border-slate-300 w-6">No</th>
                            <th className="p-1 border-r border-slate-300 text-left">KKD Cinsi & Standardı</th>
                            <th className="p-1 border-r border-slate-300 text-left">Teknik Özellik / Sınıf Kodu</th>
                            <th className="p-1 border-r border-slate-300">Marka / Model</th>
                            <th className="p-1 border-r border-slate-300 w-12">Beden</th>
                            <th className="p-1 border-r border-slate-300 w-8">Adet</th>
                            <th className="p-1 border-r border-slate-300 w-16">Teslim Tarihi</th>
                            <th className="p-1 border-r border-slate-300 w-16">Yenileme Tarihi</th>
                            <th className="p-1 w-14">Çalışan Paraf</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empAsgs.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-4 text-center text-slate-400 italic">
                                Bu personele henüz aktif KKD zimmeti atanmamıştır.
                              </td>
                            </tr>
                          ) : (
                            empAsgs.map((asg, i) => (
                              <tr key={asg.id} className="border-b border-slate-300">
                                <td className="p-1 text-center font-bold border-r border-slate-300">
                                  {i + 1}
                                </td>
                                <td className="p-1 border-r border-slate-300 font-semibold text-slate-900">
                                  <div>{asg.ppeName}</div>
                                  <div className="text-[8px] text-blue-800 font-mono">
                                    {asg.standard}
                                  </div>
                                </td>
                                <td className="p-1 border-r border-slate-300 font-mono text-[8px] text-slate-700">
                                  {asg.technicalDetails || '-'}
                                  {asg.serialOrCertNo && (
                                    <div className="text-slate-500">
                                      Seri/CE: {asg.serialOrCertNo}
                                    </div>
                                  )}
                                </td>
                                <td className="p-1 border-r border-slate-300 text-center">
                                  {asg.brandModel || 'Standart'}
                                </td>
                                <td className="p-1 border-r border-slate-300 text-center font-semibold">
                                  {asg.size}
                                </td>
                                <td className="p-1 border-r border-slate-300 text-center font-bold">
                                  {asg.quantity}
                                </td>
                                <td className="p-1 border-r border-slate-300 text-center">
                                  {formatDateTR(asg.deliveryDate)}
                                </td>
                                <td className="p-1 border-r border-slate-300 text-center">
                                  {formatDateTR(asg.renewalDate)}
                                </td>
                                <td className="p-1 text-center font-mono text-[8px]">
                                  [ &nbsp;&nbsp;&nbsp;&nbsp; ]
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Standart ve Kod Açıklamaları Eki (İsteğe bağlı veya detaylı form seçeneği) */}
                    {showDetailedSpecs && empAsgs.length > 0 && (
                      <div className="p-2.5 rounded border border-slate-300 bg-slate-50/80 text-[8px] leading-relaxed">
                        <div className="font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-amber-600 inline" />
                          Zimmetlenen KKD Standart ve Teknik Kod Açıklamaları (Bilgilendirme Notu):
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                          {empAsgs.map((asg) => {
                            const cat = catalog.find((c) => c.name === asg.ppeName);
                            if (!cat) return null;
                            return (
                              <div key={asg.id} className="border-b border-slate-200 pb-1">
                                <span className="font-bold text-slate-900">
                                  • {asg.ppeName} ({asg.standard}):
                                </span>{' '}
                                <span className="text-slate-700">
                                  {cat.technicalSpecsExplained.slice(0, 3).join(' | ')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bölüm 3: Çalışanın Yasal Taahhütnamesi */}
                    <div>
                      <div className="bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1 tracking-wider uppercase rounded-t">
                        BÖLÜM 3 – ÇALIŞANIN KULLANIM VE MUHAFAZA TAAHHÜTNAMESİ
                      </div>
                      <div className="p-2.5 border border-slate-300 rounded-b text-[8.5px] leading-relaxed text-slate-800 text-justify bg-white">
                        {company.customCommitmentText ||
                          'Yukarıda cinsi, adedi ve standardı belirtilen kişisel koruyucu donanımları eksiksiz ve sağlam olarak teslim aldığımı beyan ederim. 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik kapsamında; bana verilen KKD\'lerin kullanımı, bakımı ve saklanması konusunda bilgilendirildiğimi, işyerinde zorunlu olan çalışma alanlarında bu donanımları eksiksiz ve talimatlara uygun şekilde kullanacağımı, kendi isteğimle değiştirmeyeceğimi, amacı dışında kullanmayacağımı ve işyeri dışına çıkarmayacağımı, hasar, kayıp veya kullanım ömrünün bitmesi durumunda gecikmeden amirime ve İSG birimine bildireceğimi, işten ayrılmam hâlinde donanımları iade edeceğimi, kasıt veya ihmalim sonucu kaybolması/zarar görmesi durumunda şirket prosedürlerinin uygulanacağını kabul ve taahhüt ederim.'}
                      </div>
                    </div>

                    {/* Bölüm 4: Eğitim / Bilgilendirme Kaydı */}
                    <div className="border border-slate-300 rounded p-2 text-[9px] bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border border-slate-900 flex items-center justify-center font-bold text-[9px]">
                          ✓
                        </div>
                        <span className="font-semibold text-slate-800">
                          KKD'nin doğru kullanımı, bakımı, saklanması ve sınırları hakkında eğitim ve
                          bilgilendirme aldım.
                        </span>
                      </div>
                      <div className="text-right text-slate-600 space-x-3">
                        <span>
                          <strong>Eğitim Tarihi:</strong> {formatDateTR(new Date().toISOString().slice(0, 10))}
                        </span>
                        <span>
                          <strong>Eğitici:</strong> {company.authorized.isgExpertName} (İSG Uzmanı)
                        </span>
                      </div>
                    </div>

                    {/* Bölüm 5: İmzalar (4 Blok) */}
                    <div>
                      <div className="bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1 tracking-wider uppercase rounded-t">
                        BÖLÜM 5 – İMZA VE ONAY
                      </div>
                      <div className="grid grid-cols-3 border border-slate-300 rounded-b text-[9px]">
                        {/* 1: Teslim Alan Çalışan */}
                        <div className="p-2 border-r border-slate-300 flex flex-col justify-between h-28">
                          <div>
                            <div className="font-bold text-slate-900 uppercase">
                              TESLİM ALAN ÇALIŞAN
                            </div>
                            <div className="mt-0.5">{emp.fullName}</div>
                            <div className="text-[8px] text-slate-500">
                              Tarih: {formatDateTR(new Date().toISOString().slice(0, 10))}
                            </div>
                          </div>
                          <div className="text-center">
                            {useDigitalSignature && employeeSignature ? (
                              <img
                                src={employeeSignature}
                                alt="İmza"
                                className="h-10 mx-auto object-contain"
                              />
                            ) : (
                              <div className="text-slate-400 text-[8px] italic">
                                (İmza / Kaşe)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2: Teslim Eden / İSG Uzmanı */}
                        <div className="p-2 border-r border-slate-300 flex flex-col justify-between h-28">
                          <div>
                            <div className="font-bold text-slate-900 uppercase">
                              TESLİM EDEN / İSG UZMANI
                            </div>
                            <div className="mt-0.5">{company.authorized.isgExpertName}</div>
                            <div className="text-[8px] text-slate-500">
                              {company.authorized.isgExpertCertNo || 'Belge No Belirtilmedi'}
                            </div>
                          </div>
                          <div className="text-center">
                            {useDigitalSignature && isgSignature ? (
                              <img
                                src={isgSignature}
                                alt="İSG İmza"
                                className="h-10 mx-auto object-contain"
                              />
                            ) : (
                              <div className="text-slate-400 text-[8px] italic">
                                (İmza / Kaşe)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3: İşveren / İşveren Vekili */}
                        <div className="p-2 flex flex-col justify-between h-28">
                          <div>
                            <div className="font-bold text-slate-900 uppercase">
                              İŞVEREN / İŞVEREN VEKİLİ
                            </div>
                            <div className="mt-0.5">
                              {company.authorized.employerName || 'Şirket Yetkilisi'}
                            </div>
                            <div className="text-[8px] text-slate-500">
                              {company.authorized.employerTitle}
                            </div>
                          </div>
                          <div className="text-center text-slate-400 text-[8px] italic">
                            (İmza / Kaşe)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Notes & Page Indicator */}
                  <div className="pt-3 border-t border-slate-300 text-[8px] text-slate-500 flex items-center justify-between mt-4">
                    <span>
                      Bu form 2 (iki) nüsha olarak düzenlenir; 1 nüsha çalışanda, 1 nüsha İSG özlük
                      dosyasında saklanır.
                    </span>
                    <span>
                      Sayfa: {empIdx + 1} / {printableEmployees.length}
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
