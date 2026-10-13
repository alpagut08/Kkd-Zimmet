import React, { useState } from 'react';
import { Printer, X, ShieldAlert, FileText, Building2, CheckCircle2 } from 'lucide-react';
import { Company, DepartmentRiskProfile, Employee, RiskMethod } from '../types';
import { formatDateTR } from '../utils/turkish';
import { calculateRiskScore, evaluateNoiseLevel } from '../utils/riskScoring';

interface RiskReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  departments: DepartmentRiskProfile[];
  employees: Employee[];
  targetDepartment?: DepartmentRiskProfile; // undefined means all departments
  riskMethod: RiskMethod;
}

export const RiskReportPrintModal: React.FC<RiskReportPrintModalProps> = ({
  isOpen,
  onClose,
  company,
  departments,
  employees,
  targetDepartment,
  riskMethod,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    targetDepartment?.id || departments[0]?.id || ''
  );
  const [isBulkAll, setIsBulkAll] = useState(!targetDepartment);

  if (!isOpen) return null;

  const printableDepts = isBulkAll
    ? departments
    : departments.filter((d) => d.id === selectedDeptId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Controls Toolbar (Hidden in print) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Bölüm KKD Risk Belirleme Raporu Önizleme (A4 Dikey)
              </h3>
              <p className="text-xs text-slate-500">
                6331 sayılı İSG Kanunu ve İSG Risk Değerlendirmesi Yönetmeliği standart formatı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-600/30 transition"
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

        {/* Options Toolbar (Hidden in print) */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Rapor Kapsamı:</span>
            <select
              value={isBulkAll ? 'ALL' : selectedDeptId}
              onChange={(e) => {
                if (e.target.value === 'ALL') {
                  setIsBulkAll(true);
                } else {
                  setIsBulkAll(false);
                  setSelectedDeptId(e.target.value);
                }
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">Genel KKD Risk Raporu (Tüm {departments.length} Bölüm)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.riskEntries.length} Tehlike)
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-500 text-[11px]">
            Skorlama Modeli:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {riskMethod === 'FineKinney' ? 'Fine-Kinney Yöntemi' : '5x5 L-Tipi Matris'}
            </strong>
          </div>
        </div>

        {/* Printable Pages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 print:p-0 print:bg-white print:overflow-visible">
          <div className="max-w-[210mm] mx-auto space-y-8 print:space-y-0 print:max-w-none print:w-full">
            {printableDepts.map((dept, deptIdx) => {
              const deptEmployees = employees.filter((e) => e.department === dept.name);
              const noiseEval = evaluateNoiseLevel(dept.noiseLevelDbA);

              // Find top 3 highest risk entries in this department
              const sortedRisks = [...dept.riskEntries].sort(
                (a, b) => b.currentScore - a.currentScore
              );
              const top3Risks = sortedRisks.slice(0, 3);

              // Gather unique recommended PPEs for this department
              const ppeSet = new Map<string, string>();
              dept.riskEntries.forEach((re) => {
                re.recommendedPPE.forEach((ppe) => {
                  ppeSet.set(ppe.ppeName, ppe.standard || 'İlgili EN Standardı');
                });
              });

              return (
                <div
                  key={dept.id}
                  className="a4-page bg-white text-slate-900 shadow-xl print:shadow-none p-8 sm:p-10 border border-slate-300 print:border-none rounded-sm min-h-[297mm] flex flex-col justify-between"
                  style={{
                    pageBreakAfter: deptIdx < printableDepts.length - 1 ? 'always' : 'auto',
                    breakAfter: deptIdx < printableDepts.length - 1 ? 'page' : 'auto',
                  }}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
                      {/* Logo */}
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

                      {/* Title */}
                      <div className="flex-1 text-center">
                        <h1 className="font-extrabold text-sm sm:text-base uppercase tracking-tight text-slate-900">
                          {company.title}
                        </h1>
                        <h2 className="font-black text-xs sm:text-sm uppercase tracking-wide text-amber-800 mt-0.5">
                          BÖLÜM BAZLI KKD RİSK BELİRLEME VE DEĞERLENDİRME RAPORU
                        </h2>
                        <p className="text-[9px] text-slate-600 mt-0.5">
                          6331 Sayılı İSG Kanunu & İSG Risk Değerlendirmesi Yönetmeliği Uyarınca
                        </p>
                      </div>

                      {/* Meta Block */}
                      <div className="w-36 text-right text-[9px] text-slate-700 shrink-0 border border-slate-300 p-1.5 rounded bg-slate-50">
                        <div>
                          <strong>Rapor No:</strong> RİSK-{new Date().getFullYear()}-{String(deptIdx + 1).padStart(3, '0')}
                        </div>
                        <div>
                          <strong>Düzenleme:</strong> {formatDateTR(new Date().toISOString().slice(0, 10))}
                        </div>
                        <div>
                          <strong>Geçerlilik:</strong> {company.dangerClass === 'Çok Tehlikeli' ? '2 Yıl' : company.dangerClass === 'Tehlikeli' ? '4 Yıl' : '6 Yıl'}
                        </div>
                        <div>
                          <strong>Yöntem:</strong> {riskMethod}
                        </div>
                      </div>
                    </div>

                    {/* Department Info Box */}
                    <div>
                      <div className="bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1 tracking-wider uppercase rounded-t">
                        BÖLÜM BİLGİLERİ VE FAALİYET KAPSAMI
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
                        <tbody>
                          <tr className="border-b border-slate-300">
                            <td className="p-1.5 font-bold bg-slate-50 w-32 border-r border-slate-300">
                              Bölüm / Alan Adı:
                            </td>
                            <td className="p-1.5 font-bold text-slate-900 text-xs">{dept.name}</td>
                            <td className="p-1.5 font-bold bg-slate-50 w-32 border-r border-l border-slate-300">
                              Çalışan Sayısı:
                            </td>
                            <td className="p-1.5 font-semibold">{deptEmployees.length} Personel</td>
                          </tr>
                          <tr className="border-b border-slate-300">
                            <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">
                              Faaliyet Açıklaması:
                            </td>
                            <td className="p-1.5" colSpan={3}>
                              {dept.activityDescription}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">
                              Ortam Gürültü Düzeyi:
                            </td>
                            <td className="p-1.5 font-semibold text-slate-800" colSpan={3}>
                              {dept.noiseLevelDbA ? `${dept.noiseLevelDbA} dB(A)` : 'Ölçüm Yapılmadı'}{' '}
                              - <span className="text-amber-800 font-bold">{noiseEval.label}</span> ({noiseEval.recommendation})
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Hierarchy Warning Banner */}
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[8.5px] text-amber-900 flex items-center justify-between">
                      <span>
                        <strong>Kontrol Hiyerarşisi İlkesi:</strong> KKD son çaredir; kaynakta önlem
                        alınamayan veya yetersiz kalan riskler için kullanılır.
                      </span>
                      <span className="font-bold">Öncelik: İkame &gt; Mühendislik &gt; İdari &gt; KKD</span>
                    </div>

                    {/* Hazard & Risk Matrix Table */}
                    <div>
                      <div className="bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1 tracking-wider uppercase rounded-t">
                        TEHLİKE BELİRLEME, RİSK DERECELENDİRME VE GEREKEN KKD TABLOSU
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[8.5px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-center">
                            <th className="p-1 border-r border-slate-300 w-5">#</th>
                            <th className="p-1 border-r border-slate-300 text-left w-36">Tehlike ve Risk / Sonuç</th>
                            <th className="p-1 border-r border-slate-300 w-16">Mevcut Risk (O-Ş-Skor)</th>
                            <th className="p-1 border-r border-slate-300 text-left">KKD Öncesi Önlemler (Mühendislik / İdari)</th>
                            <th className="p-1 border-r border-slate-300 text-left w-44">Gereken KKD'ler & Standardı</th>
                            <th className="p-1 border-r border-slate-300 w-16">Artık Risk (O-Ş-Skor)</th>
                            <th className="p-1 w-20">Sorumlu & Termin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dept.riskEntries.map((re, i) => {
                            const curScore = calculateRiskScore(
                              riskMethod,
                              re.currentProbability,
                              re.currentSeverity,
                              re.currentFrequency
                            );
                            const resScore = calculateRiskScore(
                              riskMethod,
                              re.residualProbability,
                              re.residualSeverity,
                              re.residualFrequency
                            );

                            return (
                              <tr key={re.id} className="border-b border-slate-300">
                                <td className="p-1 text-center font-bold border-r border-slate-300">
                                  {i + 1}
                                </td>
                                <td className="p-1 border-r border-slate-300">
                                  <div className="font-bold text-slate-900">{re.hazard}</div>
                                  <div className="text-slate-600 italic mt-0.5">{re.consequence}</div>
                                  <div className="text-[7.5px] text-amber-700 font-semibold mt-0.5">
                                    [{re.hazardType}]
                                  </div>
                                </td>
                                <td className="p-1 border-r border-slate-300 text-center font-bold">
                                  <div className="text-[10px] text-slate-900">
                                    {re.currentProbability} × {re.currentSeverity} = {curScore.score}
                                  </div>
                                  <span
                                    className={`inline-block px-1 rounded text-[7.5px] font-bold ${curScore.badgeBg} ${curScore.badgeText}`}
                                  >
                                    {curScore.level}
                                  </span>
                                </td>
                                <td className="p-1 border-r border-slate-300 leading-tight text-slate-700">
                                  {re.prePPEControls}
                                </td>
                                <td className="p-1 border-r border-slate-300 leading-tight">
                                  {re.recommendedPPE.map((ppe, pIdx) => (
                                    <div key={pIdx} className="mb-0.5">
                                      <span className="font-bold text-slate-900">• {ppe.ppeName}</span>
                                      {ppe.standard && (
                                        <span className="text-[7.5px] text-blue-700 block">
                                          ({ppe.standard})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </td>
                                <td className="p-1 border-r border-slate-300 text-center font-bold">
                                  <div className="text-[10px] text-slate-900">
                                    {re.residualProbability} × {re.residualSeverity} = {resScore.score}
                                  </div>
                                  <span
                                    className={`inline-block px-1 rounded text-[7.5px] font-bold ${resScore.badgeBg} ${resScore.badgeText}`}
                                  >
                                    {resScore.level}
                                  </span>
                                </td>
                                <td className="p-1 text-center text-slate-600 text-[8px]">
                                  <div>{re.responsiblePerson || 'İSG Birimi'}</div>
                                  <div className="text-slate-400">{re.dueDate || 'Sürekli'}</div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Department Summary & Top 3 High Risks */}
                    <div className="grid grid-cols-2 gap-3 text-[8.5px]">
                      {/* Left: Top 3 Highest Risks */}
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <div className="font-bold text-slate-900 uppercase mb-1">
                          BÖLÜMDEKİ EN YÜKSEK 3 RİSK:
                        </div>
                        <ul className="space-y-1">
                          {top3Risks.map((tr, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="font-bold text-rose-600">{idx + 1}.</span>
                              <div>
                                <span className="font-semibold text-slate-900">{tr.hazard}</span>
                                <span className="text-slate-500"> (Skor: {tr.currentScore})</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Required PPEs Set */}
                      <div className="p-2 border border-slate-300 rounded bg-slate-50">
                        <div className="font-bold text-slate-900 uppercase mb-1">
                          BÖLÜM İÇİN ZORUNLU KILINAN KKD'LER:
                        </div>
                        <div className="space-y-0.5">
                          {Array.from(ppeSet.entries()).map(([name, std], idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">• {name}</span>
                              <span className="text-[7.5px] text-blue-700 font-mono">{std}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment Team 6 Signatures */}
                    <div>
                      <div className="bg-slate-800 text-white font-bold text-[9px] px-2 py-0.5 tracking-wider uppercase rounded-t">
                        RİSK DEĞERLENDİRMESİ VE KKD BELİRLEME EKİBİ İMZA BLOKLARI
                      </div>
                      <div className="grid grid-cols-3 border border-slate-300 rounded-b text-[8px]">
                        {/* 1: İşveren */}
                        <div className="p-1.5 border-r border-b border-slate-300 h-16 flex flex-col justify-between">
                          <div>
                            <span className="font-bold block">1. İŞVEREN / VEKİLİ</span>
                            <span>{company.authorized.employerName}</span>
                          </div>
                          <span className="text-slate-400 italic text-[7.5px]">(İmza)</span>
                        </div>

                        {/* 2: İSG Uzmanı */}
                        <div className="p-1.5 border-r border-b border-slate-300 h-16 flex flex-col justify-between">
                          <div>
                            <span className="font-bold block">2. İSG UZMANI</span>
                            <span>{company.authorized.isgExpertName} ({company.authorized.isgExpertCertNo || 'Belge No Yok'})</span>
                          </div>
                          <span className="text-slate-400 italic text-[7.5px]">(İmza)</span>
                        </div>

                        {/* 3: İşyeri Hekimi */}
                        <div className="p-1.5 border-b border-slate-300 h-16 flex flex-col justify-between">
                          <div>
                            <span className="font-bold block">3. İŞYERİ HEKİMİ</span>
                            <span>{company.authorized.workplaceDoctorName || 'Dr. Belirtilmedi'}</span>
                          </div>
                          <span className="text-slate-400 italic text-[7.5px]">(İmza)</span>
                        </div>

                        {/* 4: Çalışan Temsilcisi */}
                        <div className="p-1.5 border-r border-slate-300 h-16 flex flex-col justify-between">
                          <div>
                            <span className="font-bold block">4. ÇALIŞAN TEMSİLCİSİ</span>
                            <span>{company.authorized.employeeRepName || 'Çalışan Temsilcisi'}</span>
                          </div>
                          <span className="text-slate-400 italic text-[7.5px]">(İmza)</span>
                        </div>

                        {/* 5: Destek Elemanı */}
                        <div className="p-1.5 border-r border-slate-300 h-16 flex flex-col justify-between">
                          <div>
                            <span className="font-bold block">5. DESTEK ELEMANI</span>
                            <span>Yangın / Arama Kurtarma / İlk Yardım</span>
                          </div>
                          <span className="text-slate-400 italic text-[7.5px]">(İmza)</span>
                        </div>

                        {/* 6: Bölüm Sorumlusu */}
                        <div className="p-1.5 h-16 flex flex-col justify-between">
                          <div>
                            <span className="font-bold block">6. BÖLÜM SORUMLUSU</span>
                            <span>{dept.name} Postabaşı / Bilgi Sahibi Çalışan</span>
                          </div>
                          <span className="text-slate-400 italic text-[7.5px]">(İmza)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Disclaimer & Page */}
                  <div className="pt-2 border-t border-slate-300 text-[7.5px] text-slate-500 flex items-center justify-between mt-3">
                    <span className="italic max-w-xl">
                      * Bu matris başlangıç taslağıdır. Risk skorları, KKD seçimi ve önlemler işyerinin gerçek
                      koşullarına, ortam ölçümlerine, SDS'lere ve 6331 sayılı Kanun ile Risk Değerlendirmesi
                      Yönetmeliği kapsamında oluşturulan ekibin kararına göre belirlenmelidir.
                    </span>
                    <span className="font-bold shrink-0">
                      Sayfa: {deptIdx + 1} / {printableDepts.length}
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
