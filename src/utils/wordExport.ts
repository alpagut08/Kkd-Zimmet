import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeightRule,
  PageBreak,
} from 'docx';
import { Company, Employee, PPEAssignment } from '../types';
import { formatDateTR, generateFormNo, maskTCKN } from './turkish';

// Styling Constants
const FONT_FAMILY = 'Calibri';
const COLOR_DARK = '0F172A'; // Slate 900
const COLOR_HEADER_BG = '1E293B'; // Slate 800
const COLOR_LABEL_BG = 'F8FAFC'; // Slate 50
const COLOR_TH_BG = 'F1F5F9'; // Slate 100
const COLOR_BORDER = '94A3B8'; // Slate 400
const COLOR_BORDER_LIGHT = 'CBD5E1'; // Slate 300
const COLOR_MUTED = '64748B'; // Slate 500
const COLOR_AMBER = '92400E'; // Amber 800

const standardBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: COLOR_BORDER_LIGHT,
};

const cellBorders = {
  top: standardBorder,
  bottom: standardBorder,
  left: standardBorder,
  right: standardBorder,
};

const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
};

/**
 * Creates section header banner (e.g. BÖLÜM 1 – ...)
 */
function createSectionBanner(title: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_HEADER_BG },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            borders: noBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 16, // 8pt
                    color: 'FFFFFF',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Generates elements for one employee's form
 */
function generateEmployeeFormElements(
  company: Company,
  emp: Employee,
  assignments: PPEAssignment[],
  empIdx: number,
  maskTC: boolean
): (Paragraph | Table)[] {
  const empAsgs = assignments.filter((a) => a.employeeId === emp.id && a.status === 'Aktif');
  const todayStr = formatDateTR(new Date().toISOString().slice(0, 10));

  const elements: (Paragraph | Table)[] = [];

  // 1. Header Table (Company Title & Meta Info)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      top: noBorder,
      left: noBorder,
      right: noBorder,
    },
    rows: [
      new TableRow({
        children: [
          // Left: Company Info & Document Title
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 40, bottom: 80, left: 0, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: company.title.toUpperCase(),
                    bold: true,
                    size: 20, // 10pt
                    font: FONT_FAMILY,
                    color: COLOR_DARK,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new TextRun({
                    text: 'KİŞİSEL KORUYUCU DONANIM (KKD) ZİMMET TUTANAĞI VE TAAHHÜTNAMESİ',
                    bold: true,
                    size: 18, // 9pt
                    font: FONT_FAMILY,
                    color: COLOR_AMBER,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '6331 Sayılı İSG Kanunu & Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik',
                    size: 14, // 7pt
                    font: FONT_FAMILY,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
          // Right: Form Meta Box
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            borders: cellBorders,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Form No: ', bold: true, size: 14, font: FONT_FAMILY }),
                  new TextRun({ text: generateFormNo(empIdx + 1), size: 14, font: FONT_FAMILY }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Tarih: ', bold: true, size: 14, font: FONT_FAMILY }),
                  new TextRun({ text: todayStr, size: 14, font: FONT_FAMILY }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Revizyon: ', bold: true, size: 14, font: FONT_FAMILY }),
                  new TextRun({ text: '01', size: 14, font: FONT_FAMILY }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Tehlike: ', bold: true, size: 14, font: FONT_FAMILY }),
                  new TextRun({ text: company.dangerClass, size: 14, font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  elements.push(headerTable);

  // Spacing
  elements.push(new Paragraph({ spacing: { before: 80, after: 0 } }));

  // 2. BÖLÜM 1 – ÇALIŞAN KİMLİK VE İŞ BİLGİLERİ
  elements.push(createSectionBanner('BÖLÜM 1 – ÇALIŞAN KİMLİK VE İŞ BİLGİLERİ'));

  const empTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    rows: [
      // Row 1: Ad Soyad & TCKN
      new TableRow({
        children: [
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Adı Soyadı:', bold: true, size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: emp.fullName, bold: true, size: 16, font: FONT_FAMILY, color: COLOR_DARK }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'T.C. Kimlik No:', bold: true, size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: maskTC ? maskTCKN(emp.tcKimlikNo) : emp.tcKimlikNo || 'Belirtilmedi',
                    size: 16,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Row 2: Sicil No & İşe Giriş Tarihi
      new TableRow({
        children: [
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Sicil No:', bold: true, size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: emp.sicilNo, size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'İşe Giriş Tarihi:', bold: true, size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: formatDateTR(emp.startDate), size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
      // Row 3: Departman & Görev
      new TableRow({
        children: [
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Departman:', bold: true, size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: emp.department, size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Görev / Unvan:', bold: true, size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: emp.jobTitles.join(', '), size: 16, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  elements.push(empTable);

  // Spacing
  elements.push(new Paragraph({ spacing: { before: 80, after: 0 } }));

  // 3. BÖLÜM 2 – ZİMMETLENEN KKD TABLOSU
  elements.push(createSectionBanner('BÖLÜM 2 – ZİMMETLENEN KİŞİSEL KORUYUCU DONANIMLAR (KKD) TABLOSU'));

  // Header Row for KKD Table
  const ppeTableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 4, type: WidthType.PERCENTAGE },
          shading: { fill: COLOR_TH_BG },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'No', bold: true, size: 15, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: COLOR_TH_BG },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 60, right: 60 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'KKD Cinsi & Standardı', bold: true, size: 15, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 23, type: WidthType.PERCENTAGE },
          shading: { fill: COLOR_TH_BG },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 60, right: 60 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Teknik Özellik / Kod', bold: true, size: 15, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: COLOR_TH_BG },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Marka/Model', bold: true, size: 15, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: COLOR_TH_BG },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Beden', bold: true, size: 15, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: COLOR_TH_BG },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Adet', bold: true, size: 15, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: COLOR_TH_BG },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Teslim', bold: true, size: 15, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: COLOR_TH_BG },
          borders: cellBorders,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Yenileme', bold: true, size: 15, font: FONT_FAMILY })],
            }),
          ],
        }),
      ],
    }),
  ];

  if (empAsgs.length === 0) {
    ppeTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnSpan: 8,
            borders: cellBorders,
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Bu personele henüz aktif KKD zimmeti atanmamıştır.',
                    italics: true,
                    size: 15,
                    font: FONT_FAMILY,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    empAsgs.forEach((asg, i) => {
      ppeTableRows.push(
        new TableRow({
          children: [
            // No
            new TableCell({
              width: { size: 4, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: { top: 40, bottom: 40, left: 40, right: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: String(i + 1), bold: true, size: 15, font: FONT_FAMILY })],
                }),
              ],
            }),
            // KKD Cinsi & Standardı
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: asg.ppeName, bold: true, size: 15, font: FONT_FAMILY, color: COLOR_DARK }),
                    new TextRun({ text: ` [${asg.standard}]`, size: 13, font: FONT_FAMILY, color: '1E40AF' }),
                  ],
                }),
              ],
            }),
            // Teknik Özellik / Kod
            new TableCell({
              width: { size: 23, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: asg.technicalDetails || '-',
                      size: 14,
                      font: FONT_FAMILY,
                      color: COLOR_DARK,
                    }),
                    asg.serialOrCertNo
                      ? new TextRun({
                          text: ` (Seri/CE: ${asg.serialOrCertNo})`,
                          size: 12,
                          font: FONT_FAMILY,
                          color: COLOR_MUTED,
                        })
                      : new TextRun(''),
                  ],
                }),
              ],
            }),
            // Marka / Model
            new TableCell({
              width: { size: 11, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: { top: 40, bottom: 40, left: 40, right: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: asg.brandModel || 'Standart', size: 14, font: FONT_FAMILY })],
                }),
              ],
            }),
            // Beden
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: { top: 40, bottom: 40, left: 40, right: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: asg.size || '-', bold: true, size: 15, font: FONT_FAMILY })],
                }),
              ],
            }),
            // Adet
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: { top: 40, bottom: 40, left: 40, right: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: String(asg.quantity), bold: true, size: 15, font: FONT_FAMILY })],
                }),
              ],
            }),
            // Teslim
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: { top: 40, bottom: 40, left: 40, right: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: formatDateTR(asg.deliveryDate), size: 14, font: FONT_FAMILY })],
                }),
              ],
            }),
            // Yenileme
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              borders: cellBorders,
              margins: { top: 40, bottom: 40, left: 40, right: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: formatDateTR(asg.renewalDate), size: 14, font: FONT_FAMILY })],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  elements.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ppeTableRows }));

  // Spacing
  elements.push(new Paragraph({ spacing: { before: 80, after: 0 } }));

  // 4. BÖLÜM 3 – ÇALIŞANIN KULLANIM VE MUHAFAZA TAAHHÜTNAMESİ
  elements.push(createSectionBanner('BÖLÜM 3 – ÇALIŞANIN KULLANIM VE MUHAFAZA TAAHHÜTNAMESİ'));

  const commitmentText =
    company.customCommitmentText ||
    "Yukarıda cinsi, adedi ve standardı belirtilen kişisel koruyucu donanımları eksiksiz ve sağlam olarak teslim aldığımı beyan ederim. 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik kapsamında; tarafıma verilen KKD'lerin kullanımı, bakımı ve saklanması konusunda eğitildiğimi, işyerinde zorunlu çalışma alanlarında bu donanımları eksiksiz ve talimatlara uygun şekilde kullanacağımı, kendi isteğimle değiştirmeyeceğimi, amacı dışında kullanmayacağımı ve işyeri dışına çıkarmayacağımı, hasar, arıza veya kullanım ömrünün bitmesi durumunda amirime ve İSG birimine bildireceğimi, işten ayrılmam hâlinde iade edeceğimi, kasıt veya ihmalim sonucu oluşacak zararlarda şirket prosedürlerinin uygulanacağını kabul ve taahhüt ederim.";

  const commitmentTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: commitmentText,
                    size: 14, // 7pt
                    font: FONT_FAMILY,
                    color: COLOR_DARK,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  elements.push(commitmentTable);

  // Spacing
  elements.push(new Paragraph({ spacing: { before: 80, after: 0 } }));

  // 5. BÖLÜM 4 – EĞİTİM / BİLGİLENDİRME KAYDI
  const trainingTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: '✓ ', bold: true, size: 15, color: '059669', font: FONT_FAMILY }),
                  new TextRun({
                    text: "KKD'lerin doğru kullanımı, bakımı, saklanması ve koruma sınırları hakkında uygulamalı bilgilendirme yapılmıştır.",
                    bold: true,
                    size: 14,
                    font: FONT_FAMILY,
                    color: COLOR_DARK,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_LABEL_BG },
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Eğitim Tarihi: ', bold: true, size: 14, font: FONT_FAMILY }),
                  new TextRun({ text: todayStr, size: 14, font: FONT_FAMILY }),
                  new TextRun({ text: ' | Eğitici: ', bold: true, size: 14, font: FONT_FAMILY }),
                  new TextRun({ text: company.authorized.isgExpertName, size: 14, font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  elements.push(trainingTable);

  // Spacing
  elements.push(new Paragraph({ spacing: { before: 80, after: 0 } }));

  // 6. BÖLÜM 5 – İMZA VE ONAY
  elements.push(createSectionBanner('BÖLÜM 5 – İMZA VE ONAY'));

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    rows: [
      new TableRow({
        height: { value: 1600, rule: HeightRule.ATLEAST }, // Space for wet or stamp signatures
        children: [
          // 1: Teslim Alan Çalışan
          new TableCell({
            width: { size: 33.33, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'TESLİM ALAN ÇALIŞAN', bold: true, size: 14, font: FONT_FAMILY, color: COLOR_DARK }),
                ],
              }),
              new Paragraph({
                spacing: { before: 20 },
                children: [new TextRun({ text: emp.fullName, bold: true, size: 15, font: FONT_FAMILY })],
              }),
              new Paragraph({
                children: [new TextRun({ text: `Tarih: ${todayStr}`, size: 13, font: FONT_FAMILY, color: COLOR_MUTED })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
                children: [new TextRun({ text: '(İmza / Kaşe)', italics: true, size: 13, color: COLOR_MUTED, font: FONT_FAMILY })],
              }),
            ],
          }),
          // 2: Teslim Eden / İSG Uzmanı
          new TableCell({
            width: { size: 33.33, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'TESLİM EDEN / İSG UZMANI',
                    bold: true,
                    size: 14,
                    font: FONT_FAMILY,
                    color: COLOR_DARK,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 20 },
                children: [
                  new TextRun({ text: company.authorized.isgExpertName, bold: true, size: 15, font: FONT_FAMILY }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Belge No: ${company.authorized.isgExpertCertNo || 'Belirtilmedi'}`,
                    size: 13,
                    font: FONT_FAMILY,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
                children: [new TextRun({ text: '(İmza / Kaşe)', italics: true, size: 13, color: COLOR_MUTED, font: FONT_FAMILY })],
              }),
            ],
          }),
          // 3: İşveren / İşveren Vekili
          new TableCell({
            width: { size: 33.34, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'İŞVEREN / İŞVEREN VEKİLİ', bold: true, size: 14, font: FONT_FAMILY, color: COLOR_DARK }),
                ],
              }),
              new Paragraph({
                spacing: { before: 20 },
                children: [
                  new TextRun({
                    text: company.authorized.employerName || 'Şirket Yetkilisi',
                    bold: true,
                    size: 15,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: company.authorized.employerTitle, size: 13, font: FONT_FAMILY, color: COLOR_MUTED }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
                children: [new TextRun({ text: '(İmza / Kaşe)', italics: true, size: 13, color: COLOR_MUTED, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  elements.push(signatureTable);

  // Footer Disclaimer
  elements.push(
    new Paragraph({
      spacing: { before: 80, after: 0 },
      children: [
        new TextRun({
          text: 'Bu tutanak 2 (iki) asıl nüsha düzenlenir; 1 nüsha çalışana teslim edilir, 1 nüsha İSG özlük dosyasında saklanır.',
          size: 13,
          font: FONT_FAMILY,
          color: COLOR_MUTED,
        }),
      ],
    })
  );

  return elements;
}

/**
 * Downloads a Word document (.docx) for a single employee or multiple employees
 */
export async function downloadPPEAssignmentWordDoc(
  company: Company,
  employees: Employee[],
  assignments: PPEAssignment[],
  maskTC: boolean = false
): Promise<void> {
  const sectionsChildren: (Paragraph | Table)[] = [];

  employees.forEach((emp, idx) => {
    if (idx > 0) {
      // Page break between employees
      sectionsChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
    const empElements = generateEmployeeFormElements(company, emp, assignments, idx, maskTC);
    sectionsChildren.push(...empElements);
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 Portrait width in twips (~210mm)
              height: 16838, // A4 Portrait height in twips (~297mm)
            },
            margin: {
              top: 567, // ~10mm
              bottom: 567,
              left: 720, // ~12.7mm
              right: 720,
            },
          },
        },
        children: sectionsChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const dateStr = new Date().toISOString().slice(0, 10);
  if (employees.length === 1) {
    const cleanName = employees[0].fullName.trim().replace(/\s+/g, '_');
    a.download = `KKD_Zimmet_Tutanagi_${cleanName}_${dateStr}.docx`;
  } else {
    a.download = `KKD_Zimmet_Tutanaklari_Toplu_${employees.length}_Kisi_${dateStr}.docx`;
  }

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
