"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Phone,
  Info,
  Home,
  Building2,
  CreditCard,
  FileText,
  Banknote,
  ArrowLeft,
  Clock,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BankSlider } from "@/components/ui/bank-slider";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Reveal } from "@/components/ui/reveal";

// --- TYPES ---------------------------------------------------------------
interface PriceRow {
  kavling: string;
  type: string;
  lb: number;
  lt: number;
  tunaiKeras: number;
  kpr: number;
  dp10: number;
  bookingFee: number;
  plafond: number;
  isHook?: boolean;
}

type ClusterKey = "ladera" | "cascada";

interface SimulationOption {
  id: string;
  cluster: ClusterKey;
  group: string;
  label: string;
  row: PriceRow;
}

// --- FORMATTERS ----------------------------------------------------------
const fmt = (n: number) =>
  "Rp " + n.toLocaleString("id-ID");

const fmtPercent = (n: number) =>
  `${n.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;

// --- LADERA DATA ----------------------------------------------------------
interface HookSummary {
  kavling: string;
  cashRange: string;
  landRange: string;
}

const laderaVerona: PriceRow[] = [
  { kavling: "J.23 No. 11, 16, 17, 18", type: "Verona 39/60", lb: 39, lt: 60, tunaiKeras: 695052700, kpr: 800000000, dp10: 80000000, bookingFee: 5000000, plafond: 715000000 },
];

const laderaVeronaHook: PriceRow = {
  kavling: "J.23 No. 12 dan 15",
  type: "Verona 39/60 Hook",
  lb: 39,
  lt: 60,
  tunaiKeras: 665052700,
  kpr: 764912300,
  dp10: 76491230,
  bookingFee: 5000000,
  plafond: 683421070,
  isHook: true,
};

const laderaMalta: PriceRow[] = [
  { kavling: "J.17 No. 3, 5, 6", type: "Malta 47/72", lb: 47, lt: 72, tunaiKeras: 888750000, kpr: 1021929900, dp10: 102192990, bookingFee: 5000000, plafond: 914736910 },
  { kavling: "J.17 No. 9, 10, 11, 12, 15; J.18 No. 2, 3, 5, 6; J.19 No. 16, 17, 18, 19, 21, 28, 29, 30, 31", type: "Malta 47/72", lb: 47, lt: 72, tunaiKeras: 870750000, kpr: 1000877200, dp10: 100087720, bookingFee: 5000000, plafond: 895789480 },
  { kavling: "J.19 No. 5, 6, 7, 9", type: "Malta 47/72", lb: 47, lt: 72, tunaiKeras: 852750000, kpr: 979824600, dp10: 97982460, bookingFee: 5000000, plafond: 876842140 },
  { kavling: "J.20 No. 15, 23, 28, 30, 32, 35, 36, 38", type: "Malta 47/72", lb: 47, lt: 72, tunaiKeras: 845550000, kpr: 971403600, dp10: 97140360, bookingFee: 5000000, plafond: 869263240 },
];

const laderaMaltaHook: HookSummary = {
  kavling: "J.11 No. 19; J.17 No. 1, 7, 8, 16; J.18 No. 1, 10; J.19 No. 22; J.20 No. 20, 21, 40",
  cashRange: "Rp 1.018.753.500 – Rp 1.197.427.500",
  landRange: "107,79 – 131,79 m²",
};

const laderaTuscan: PriceRow[] = [
  { kavling: "J.7 No. 2, 3, 5, 6, 10, 20, 21; J.8 No. 3", type: "Tuscan 66/72", lb: 66, lt: 72, tunaiKeras: 1129800000, kpr: 1303859700, dp10: 130385970, bookingFee: 5000000, plafond: 1168473730 },
  { kavling: "J.8 No. 11, 12, 15, 16, 17, 18", type: "Tuscan 66/72", lb: 66, lt: 72, tunaiKeras: 1147800000, kpr: 1324912300, dp10: 132491230, bookingFee: 5000000, plafond: 1187421070 },
  { kavling: "J.13 No. 3, 5", type: "Tuscan 66/72", lb: 66, lt: 72, tunaiKeras: 1111500000, kpr: 1282456200, dp10: 128245620, bookingFee: 5000000, plafond: 1149210580 },
];

const laderaTuscanHook: HookSummary = {
  kavling: "J.7 No. 1, 22; J.8 No. 1, 19",
  cashRange: "Rp 1.323.640.000 – Rp 1.471.185.000",
  landRange: "98,48 – 124,14 m²",
};

const laderaFrontera = {
  type: "Frontera 89/90",
  status: "Segera Hadir",
  description: "Pricelist resmi belum dirilis.",
};

// --- CASCADA DATA ----------------------------------------------------------
const cascadaData: { group: string; image: string; rows: PriceRow[] }[] = [
  {
    group: "T-39",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    rows: [
      { kavling: "H.11/20, H.11/21", type: "T-39", lb: 39, lt: 65, tunaiKeras: 778463200, kpr: 892631600, dp10: 89263160, bookingFee: 5000000, plafond: 798368440 },
      { kavling: "H.13/3", type: "T-39", lb: 39, lt: 69, tunaiKeras: 795809200, kpr: 912919300, dp10: 91291930, bookingFee: 5000000, plafond: 816627370 },
    ],
  },
  {
    group: "T-42",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    rows: [
      { kavling: "H.18/20,22,23,27, H.19/3,6,7,10–12,16,19,20", type: "T-42", lb: 42, lt: 60, tunaiKeras: 822668500, kpr: 942760300, dp10: 94276030, bookingFee: 5000000, plafond: 843484270 },
      { kavling: "H.18/16", type: "T-42 HK", lb: 42, lt: 117.6, tunaiKeras: 1103918500, kpr: 1271707700, dp10: 127170770, bookingFee: 5000000, plafond: 1139536930, isHook: true },
    ],
  },
  {
    group: "T-47",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Malta_tkq7di.webp",
    rows: [
      { kavling: "H.10/33A", type: "T-47", lb: 47, lt: 72, tunaiKeras: 849373200, kpr: 975567300, dp10: 97556730, bookingFee: 5000000, plafond: 873010570 },
      { kavling: "H.11/3", type: "T-47", lb: 47, lt: 78, tunaiKeras: 874153200, kpr: 1004549800, dp10: 100454980, bookingFee: 5000000, plafond: 899094820 },
    ],
  },
  {
    group: "T-58",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
    rows: [
      { kavling: "H.15/3, H.16/19,20,22, H.18/6", type: "T-58", lb: 58, lt: 60, tunaiKeras: 929815800, kpr: 1068421100, dp10: 106842110, bookingFee: 5000000, plafond: 956578990 },
    ],
  },
  {
    group: "T-62",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
    rows: [
      { kavling: "H.18/1", type: "T-62 HK", lb: 62, lt: 112.8, tunaiKeras: 1226065800, kpr: 1414912300, dp10: 141491230, bookingFee: 5000000, plafond: 1268421070, isHook: true },
    ],
  },
  {
    group: "T-69",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Victoria_scolcc.webp",
    rows: [
      { kavling: "H.14/9,11,12,17–20", type: "T-69", lb: 69, lt: 74, tunaiKeras: 1183660600, kpr: 1363263200, dp10: 136326320, bookingFee: 5000000, plafond: 1221936880 },
      { kavling: "H.14/21,22", type: "T-69", lb: 69, lt: 74, tunaiKeras: 1165160600, kpr: 1341625800, dp10: 134162580, bookingFee: 5000000, plafond: 1202463220 },
      { kavling: "H.14/28,31", type: "T-69", lb: 69, lt: 73, tunaiKeras: 1159660600, kpr: 1335193000, dp10: 133519300, bookingFee: 5000000, plafond: 1196673700 },
    ],
  },
  {
    group: "T-88",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Alexandra_hhvq3f.webp",
    rows: [
      { kavling: "H.1/12,15–20", type: "T-88", lb: 88, lt: 105, tunaiKeras: 1636618500, kpr: 1893859700, dp10: 189385970, bookingFee: 5000000, plafond: 1699473730 },
      { kavling: "H.1/21,22,23", type: "T-88", lb: 88, lt: 106, tunaiKeras: 1643868500, kpr: 1902339200, dp10: 190233920, bookingFee: 5000000, plafond: 1707105280 },
      { kavling: "H.1/25,27,29,31", type: "T-88", lb: 88, lt: 107, tunaiKeras: 1651118500, kpr: 1910818800, dp10: 191081880, bookingFee: 5000000, plafond: 1714736920 },
      { kavling: "H.3/10", type: "T-88", lb: 88, lt: 105, tunaiKeras: 1365768500, kpr: 1577076100, dp10: 157707610, bookingFee: 5000000, plafond: 1414368490 },
    ],
  },
];

const createSimulationOptions = (
  cluster: ClusterKey,
  group: string,
  rows: PriceRow[]
): SimulationOption[] =>
  rows.map((row, index) => ({
    id: `${cluster}-${group.toLowerCase()}-${index}`,
    cluster,
    group,
    label: `${row.type} | LT ${row.lt} m2 | Kav. ${row.kavling}`,
    row,
  }));

const SIMULATION_OPTIONS: SimulationOption[] = [
  ...createSimulationOptions("ladera", "Verona 39/60", [...laderaVerona, laderaVeronaHook]),
  ...createSimulationOptions("ladera", "Malta 47/72", laderaMalta),
  ...createSimulationOptions("ladera", "Tuscan 66/72", laderaTuscan),
  ...cascadaData.flatMap((group) => createSimulationOptions("cascada", group.group, group.rows)),
];

const DEFAULT_SIMULATION_ID = SIMULATION_OPTIONS[0]?.id ?? "";

// --- STATIC CONTENT --------------------------------------------------------
const PAYMENT_METHODS = [
  {
    icon: <Banknote className="w-5 h-5" />,
    title: "A. Tunai Keras",
    steps: [
      "Booking Fee Rp 5.000.000 — dibayar hari ke-1",
      "Down Payment = 50% - Booking Fee — dibayar hari ke-15 setelah BF",
      "Pelunasan 50% — dibayar hari ke-30 setelah BF",
    ],
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "B. KPR Bank",
    steps: [
      "Booking Fee Rp 5.000.000 — dibayar hari ke-1",
      "Down Payment — dibayar hari ke-15 setelah BF",
      "Akad Kredit (KPR) — dilakukan hari ke-30 setelah BF",
      "Unit hook: DP minimum 5%",
    ],
  },
];

const INCLUSIONS = [
  "Free PPN / Subsidi PPN (selisih perubahan PPN wajib dibayar pembeli)",
  "Izin Mendirikan Bangunan (IMB)",
  "Biaya penyambungan daya listrik 2.200 W",
  "Biaya pemasangan PDAM",
];

const EXCLUSIONS = [
  "Biaya BPHTB dan AJB",
  "Biaya Balik Nama Sertifikat HGB",
  "Perabot, elektronik, dan biaya penyambungan telepon",
];

const NOTES = [
  "Nama, blok, dan nomor yang tercantum saat tanda jadi sudah pasti dan tidak dapat diganti.",
  "Cara pembayaran KPR wajib melalui proses KPR Bank.",
  "Hasil pengajuan KPR, termasuk DP dan suku bunga, merupakan kewenangan penuh pihak bank.",
  "Jika pembeli membatalkan secara sepihak, Booking Fee tidak dapat dikembalikan.",
  "Surat Pesanan Unit dan SPJB wajib ditandatangani segera setelah pembayaran Booking Fee.",
  "Serah terima hanya dapat dilakukan setelah pembayaran lunas atau setelah akad kredit.",
  "Harga dan ketentuan sewaktu-waktu dapat berubah tanpa pemberitahuan terlebih dahulu.",
];

function calculateMonthlyInstallment(
  principal: number,
  annualInterestRate: number,
  totalMonths: number
) {
  if (principal <= 0 || totalMonths <= 0) {
    return 0;
  }

  const monthlyInterestRate = annualInterestRate / 100 / 12;

  if (monthlyInterestRate === 0) {
    return principal / totalMonths;
  }

  return (
    principal *
    (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -totalMonths)))
  );
}

function parseNumericInput(value: string, fallback: number) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

// --- PRICE TABLE COMPONENT -------------------------------------------------
function PriceTable({ rows }: { rows: PriceRow[] }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <article
            key={`${row.type}-${row.kavling}`}
            className={cn(
              "rounded-2xl border p-4 shadow-sm",
              row.isHook
                ? "border-[#F5A524]/35 bg-[#F5A524]/10"
                : index % 2 === 0
                  ? "border-[#0b120c]/10 bg-white"
                  : "border-[#0b120c]/10 bg-[#F5F1E8]"
            )}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#0b120c]/10 pb-3">
              <div className="min-w-0">
                <p className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-[#0b120c]/45">Kavling</p>
                <p className="mt-1 text-sm leading-relaxed text-[#0b120c]">{row.kavling}</p>
              </div>
              <span className={cn(
                "shrink-0 rounded px-2 py-1 font-mono text-xs font-bold",
                row.isHook ? "bg-[#F5A524]/20 text-[#c47a2a]" : "bg-[#F5A524]/10 text-[#b86d0e]"
              )}>
                {row.type}
              </span>
            </div>
            <p className="mt-3 text-xs text-[#0b120c]/60">LB {row.lb} m² · LT {row.lt} m²</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
              {[
                { label: "Tunai keras", value: fmt(row.tunaiKeras), accent: false },
                { label: "Harga KPR", value: fmt(row.kpr), accent: true },
                { label: "DP 10%", value: fmt(row.dp10), accent: false },
                { label: "Plafond KPR", value: fmt(row.plafond), accent: false },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[10px] font-sans uppercase tracking-[0.12em] text-[#0b120c]/45">{item.label}</dt>
                  <dd className={cn("mt-1 break-words font-mono text-xs font-semibold", item.accent ? "text-red-600" : "text-[#0b120c]")}>{item.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-[#0b120c]/10 pt-3 text-xs text-[#0b120c]/55">Booking fee: <span className="font-mono text-[#0b120c]">{fmt(row.bookingFee)}</span></p>
          </article>
        ))}
      </div>

      <div className="hidden w-full overflow-x-auto rounded-xl border border-[#0b120c]/10 shadow-sm md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-[#0b120c] text-[#F5F1E8]">
              <th className="px-4 py-3 text-left font-sans text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">Kavling</th>
              <th className="px-4 py-3 text-left font-sans text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">Tipe</th>
              <th className="px-4 py-3 text-center font-sans text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">LB / LT</th>
              <th className="px-4 py-3 text-right font-sans text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">Tunai Keras</th>
              <th className="px-4 py-3 text-right font-sans text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">KPR</th>
              <th className="px-4 py-3 text-right font-sans text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">DP 10%</th>
              <th className="px-4 py-3 text-right font-sans text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">Booking Fee</th>
              <th className="px-4 py-3 text-right font-sans text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">Plafond KPR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.type}-${row.kavling}`}
                className={cn(
                  "border-t border-[#0b120c]/5 transition-colors duration-200 hover:bg-[#F5A524]/5",
                  row.isHook ? "bg-[#F5A524]/5" : index % 2 === 0 ? "bg-[#F5F1E8]" : "bg-[#F5F1E8]/50"
                )}
              >
                <td className="px-4 py-3 text-[#0b120c]/80 font-sans text-xs leading-snug">{row.kavling}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded font-mono text-xs font-bold",
                    row.isHook ? "bg-[#F5A524]/20 text-[#c47a2a]" : "bg-[#F5A524]/10 text-[#b86d0e]"
                  )}>
                    {row.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs text-[#0b120c]/70 whitespace-nowrap">{row.lb} / {row.lt} m²</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[#0b120c] whitespace-nowrap">{fmt(row.tunaiKeras)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-red-600 whitespace-nowrap">{fmt(row.kpr)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[#0b120c]/70 whitespace-nowrap">{fmt(row.dp10)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[#0b120c]/50 whitespace-nowrap">{fmt(row.bookingFee)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[#0b120c] whitespace-nowrap">{fmt(row.plafond)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- ACCORDIAN -------------------------------------------------------------
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#0b120c]/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 bg-[#F5F1E8] hover:bg-[#F5F1E8] transition-colors duration-200 text-left"
      >
        <span className="font-serif text-lg md:text-xl font-semibold text-[#0b120c]">{title}</span>
        <ChevronDown className={cn("w-5 h-5 text-[#F5A524] shrink-0 transition-transform duration-300", open && "rotate-180")} />
      </button>
      {/* Akordeon CSS: grid-template-rows 0fr→1fr tanpa JS */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out overflow-hidden"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-6 pb-6 pt-2 bg-[#F5F1E8]">{children}</div>
      </div>
    </div>
  );
}

function KprSimulator({ activeTab }: { activeTab: ClusterKey }) {
  const [selectedId, setSelectedId] = useState(DEFAULT_SIMULATION_ID);
  const [downPaymentPercent, setDownPaymentPercent] = useState(10);
  const [annualInterestRate, setAnnualInterestRate] = useState(7.5);
  const [tenorYears, setTenorYears] = useState(20);

  const availableOptions = useMemo(
    () => SIMULATION_OPTIONS.filter((option) => option.cluster === activeTab),
    [activeTab]
  );

  const selectedOption =
    availableOptions.find((option) => option.id === selectedId) ?? availableOptions[0];

  const groupedOptions = useMemo(() => {
    return availableOptions.reduce<Record<string, SimulationOption[]>>((acc, option) => {
      if (!acc[option.group]) {
        acc[option.group] = [];
      }
      acc[option.group].push(option);
      return acc;
    }, {});
  }, [availableOptions]);

  if (!selectedOption) {
    return null;
  }

  const minimumDownPaymentPercent = selectedOption.row.isHook ? 5 : 10;
  const safeDownPaymentPercent = Math.min(Math.max(downPaymentPercent, minimumDownPaymentPercent), 90);
  const safeAnnualInterestRate = Math.min(Math.max(annualInterestRate, 0), 25);
  const safeTenorYears = Math.min(Math.max(tenorYears, 1), 30);
  const totalMonths = safeTenorYears * 12;
  const downPaymentAmount = Math.round((selectedOption.row.kpr * safeDownPaymentPercent) / 100);
  const estimatedPrincipal = Math.max(
    selectedOption.row.kpr - downPaymentAmount - selectedOption.row.bookingFee,
    0
  );
  const monthlyInstallment = calculateMonthlyInstallment(
    estimatedPrincipal,
    safeAnnualInterestRate,
    totalMonths
  );
  const totalInstallment = monthlyInstallment * totalMonths;
  const firstCashNeeded = selectedOption.row.bookingFee + downPaymentAmount;
  const whatsappText = encodeURIComponent(
    [
      "Halo Marketing Grand Duta City Parung,",
      "",
      "Saya ingin konsultasi simulasi KPR untuk unit berikut:",
      `- Cluster: ${activeTab === "ladera" ? "Ladera" : "Cascada"}`,
      `- Tipe: ${selectedOption.row.type}`,
      `- Kavling: ${selectedOption.row.kavling}`,
      `- Harga KPR: ${fmt(selectedOption.row.kpr)}`,
      `- DP: ${fmt(downPaymentAmount)} (${fmtPercent(safeDownPaymentPercent)})`,
      `- Bunga: ${fmtPercent(safeAnnualInterestRate)} per tahun`,
      `- Tenor: ${safeTenorYears} tahun`,
      `- Estimasi cicilan: ${fmt(Math.round(monthlyInstallment))} / bulan`,
    ].join("\n")
  );

  return (
    <Reveal as="section" className="mt-20 mb-16">
      <div className="mb-10">
        <p className="text-[#F5A524] text-[10px] tracking-[0.5em] uppercase font-sans font-semibold mb-4">
          Simulasi KPR
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#0b120c]">
              Hitung estimasi cicilan
            </h2>
            <p className="text-[#0b120c]/60 text-sm font-light max-w-2xl leading-relaxed mt-3">
              Pilih unit dari pricelist aktif, lalu atur DP, bunga, dan tenor untuk melihat
              estimasi cicilan bulanan. Simulasi ini memakai harga KPR yang tampil di halaman
              dan hasil akhir tetap mengikuti persetujuan bank.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-[#0b120c]/10 bg-[#0b120c] px-5 py-3 text-[#F5F1E8]">
            <Calculator className="h-4 w-4 text-[#F5A524]" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-sans">
              Estimasi real-time
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="rounded-[28px] border border-[#0b120c]/10 bg-[#F5F1E8] p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label
                htmlFor="simulator-unit"
                className="mb-2 block text-[10px] font-sans font-semibold uppercase tracking-[0.3em] text-[#0b120c]/50"
              >
                Pilih unit
              </label>
              <select
                id="simulator-unit"
                value={selectedOption.id}
                onChange={(event) => setSelectedId(event.target.value)}
                className="w-full rounded-2xl border border-[#0b120c]/10 bg-white px-4 py-4 text-sm text-[#0b120c] outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20"
              >
                {Object.entries(groupedOptions).map(([group, options]) => (
                  <optgroup key={group} label={`${activeTab === "ladera" ? "Ladera" : "Cascada"} - ${group}`}>
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="simulator-dp"
                className="mb-2 block text-[10px] font-sans font-semibold uppercase tracking-[0.3em] text-[#0b120c]/50"
              >
                Down payment (%)
              </label>
              <input
                id="simulator-dp"
                type="number"
                inputMode="decimal"
                min={minimumDownPaymentPercent}
                max={90}
                step={0.1}
                value={downPaymentPercent}
                onChange={(event) =>
                  setDownPaymentPercent(parseNumericInput(event.target.value, minimumDownPaymentPercent))
                }
                className="w-full rounded-2xl border border-[#0b120c]/10 bg-white px-4 py-4 text-sm text-[#0b120c] outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20"
              />
              <p className="mt-2 text-xs text-[#0b120c]/50">
                Minimum DP untuk unit ini: {minimumDownPaymentPercent}%.
              </p>
            </div>

            <div>
              <label
                htmlFor="simulator-bunga"
                className="mb-2 block text-[10px] font-sans font-semibold uppercase tracking-[0.3em] text-[#0b120c]/50"
              >
                Bunga efektif (% / tahun)
              </label>
              <input
                id="simulator-bunga"
                type="number"
                inputMode="decimal"
                min={0}
                max={25}
                step={0.1}
                value={annualInterestRate}
                onChange={(event) =>
                  setAnnualInterestRate(parseNumericInput(event.target.value, safeAnnualInterestRate))
                }
                className="w-full rounded-2xl border border-[#0b120c]/10 bg-white px-4 py-4 text-sm text-[#0b120c] outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20"
              />
              <p className="mt-2 text-xs text-[#0b120c]/50">
                Ubah sesuai penawaran bunga bank yang Anda dapatkan.
              </p>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="simulator-tenor"
                className="mb-2 block text-[10px] font-sans font-semibold uppercase tracking-[0.3em] text-[#0b120c]/50"
              >
                Tenor (tahun)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                <input
                  id="simulator-tenor"
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={safeTenorYears}
                  onChange={(event) =>
                    setTenorYears(parseNumericInput(event.target.value, safeTenorYears))
                  }
                  className="w-full accent-[#F5A524]"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={30}
                  step={1}
                  value={tenorYears}
                  onChange={(event) =>
                    setTenorYears(parseNumericInput(event.target.value, safeTenorYears))
                  }
                  className="w-full rounded-2xl border border-[#0b120c]/10 bg-white px-4 py-3 text-sm text-[#0b120c] outline-none transition focus:border-[#F5A524] focus:ring-2 focus:ring-[#F5A524]/20 md:w-28"
                />
              </div>
              <p className="mt-2 text-xs text-[#0b120c]/50">
                Estimasi dihitung dengan skema anuitas untuk {totalMonths} bulan.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#0b120c]/10 bg-[#0b120c] p-6 md:p-8 text-[#F5F1E8] shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#F5F1E8]/45 font-sans mb-4">
            Ringkasan simulasi
          </p>
          <div className="border-b border-[#F5F1E8]/10 pb-5 mb-5">
            <h3 className="font-serif text-2xl font-semibold">{selectedOption.row.type}</h3>
            <p className="text-sm text-[#F5F1E8]/65 mt-2 leading-relaxed">
              {activeTab === "ladera" ? "Cluster Ladera" : "Cluster Cascada"} - LB {selectedOption.row.lb} m2 / LT{" "}
              {selectedOption.row.lt} m2
            </p>
            <p className="text-xs text-[#F5F1E8]/45 mt-2 leading-relaxed">
              Kavling: {selectedOption.row.kavling}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#F5F1E8]/45 font-sans">
                Harga KPR
              </p>
              <p className="mt-2 font-mono text-lg font-semibold">{fmt(selectedOption.row.kpr)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#F5F1E8]/45 font-sans">
                Estimasi plafon
              </p>
              <p className="mt-2 font-mono text-lg font-semibold">{fmt(estimatedPrincipal)}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#F5A524] px-5 py-6 text-[#0b120c] mb-6">
            <p className="text-[10px] uppercase tracking-[0.3em] font-sans font-semibold text-[#0b120c]/60">
              Estimasi cicilan / bulan
            </p>
            <p className="mt-3 font-mono text-3xl md:text-4xl font-bold">
              {fmt(Math.round(monthlyInstallment))}
            </p>
            <p className="mt-3 text-sm text-[#0b120c]/70">
              Bunga {fmtPercent(safeAnnualInterestRate)} - tenor {safeTenorYears} tahun
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "Booking fee", value: fmt(selectedOption.row.bookingFee) },
              { label: "DP simulasi", value: `${fmt(downPaymentAmount)} (${fmtPercent(safeDownPaymentPercent)})` },
              { label: "Dana awal dibutuhkan", value: fmt(firstCashNeeded) },
              { label: "Total cicilan selama tenor", value: fmt(Math.round(totalInstallment)) },
              { label: "Plafon pricelist saat DP 10%", value: fmt(selectedOption.row.plafond) },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-4 border-b border-[#F5F1E8]/10 pb-3 text-sm"
              >
                <span className="text-[#F5F1E8]/55">{item.label}</span>
                <span className="text-right font-mono text-[#F5F1E8]">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[#F5A524]/20 bg-white/5 p-4 text-xs leading-relaxed text-[#F5F1E8]/65">
            Simulasi ini adalah estimasi awal. Nilai akhir cicilan, plafon, biaya provisi, asuransi,
            dan suku bunga mengikuti hasil analisa bank saat proses KPR.
          </div>

          <a
            href={`https://wa.me/628131742034?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#F5F1E8] px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#0b120c] transition hover:bg-[#F5A524]"
          >
            Konsultasikan simulasi ini
          </a>
        </div>
      </div>
    </Reveal>
  );
}

// --- MAIN COMPONENT --------------------------------------------------------
export default function PricelistPage() {
  const [activeTab, setActiveTab] = useState<ClusterKey>("ladera");

  return (
    <>
      {/* -- HERO -- */}
      <div className="relative w-full h-[70vh] min-h-[560px] overflow-hidden bg-[#0b120c] flex items-center justify-center">
        <Image
          src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671249/Cluster_Ladera_Gate_t1vylp.webp"
          alt="Cluster Ladera Grand Duta City Parung Bogor"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b120c]/60 via-transparent to-[#0b120c]" />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="absolute top-24 left-0 right-0 px-6 md:px-14 lg:px-20 z-20"
        >
          <ol className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#F5F1E8]/50 font-sans">
            <li><Link href="/" className="hover:text-[#F5F1E8] transition-colors">Home</Link></li>
            <li><ChevronRight className="w-3 h-3" /></li>
            <li className="text-[#F5A524]">Pricelist</li>
          </ol>
        </nav>

        <div className="relative z-10 text-center px-6 max-w-4xl pt-16 flex flex-col items-center">
          <div
            className="flex flex-col items-center"
            style={{ animation: "heroFadeUp 0.8s ease-out both" }}
          >
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Pricelist Harga" }
              ]} />
            </div>
            <p className="text-[#F5A524] text-[10px] md:text-xs tracking-[0.5em] uppercase font-sans font-semibold mb-5 drop-shadow-md">
              Grand Duta City Parung · South of Jakarta
            </p>
            {/* H1 — unique, no cannibalisation with homepage/cluster pages */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F1E8] mb-5 drop-shadow-xl">
              Pricelist Grand Duta City SOJ Parung Bogor<br />
              <span className="italic font-normal text-[#F5A524]">| Harga Ladera & Cascada Terbaru.</span>
            </h1>
            <p className="text-[#F5F1E8]/80 text-sm md:text-base font-light max-w-2xl mx-auto leading-relaxed">
              Pricelist{" "}
              <Link href="/" className="font-medium text-[#F5A524] hover:underline">Grand Duta City Parung</Link>{" "}
              terbaru untuk Cluster Ladera dan Cascada, lengkap dengan kisaran harga, tipe unit, dan informasi awal simulasi KPR. Untuk konfirmasi harga dan unit tersedia, hubungi marketing.
            </p>
            <div className="mt-8 text-[#F5F1E8]/50 font-sans text-xs flex justify-center items-center gap-2">
              <Clock className="w-4 h-4 text-[#F5A524]" /> Tanggal update: 9 Maret 2026
            </div>
          </div>
        </div>
      </div>

      {/* -- INTRO STATS BAR -- */}
      <div className="bg-[#0b120c] border-t border-[#F5F1E8]/5">
        <div className="max-w-screen-xl mx-auto px-6 md:px-14 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-[#F5F1E8] text-center">
          {[
            { label: "Cluster", value: "2" },
            { label: "Tipe Unit", value: "8+" },
            { label: "Booking Fee", value: "Rp 5 Jt" },
            { label: "DP Mulai", value: "10%" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-serif text-2xl md:text-3xl font-bold text-[#F5A524]">{s.value}</p>
              <p className="text-[#F5F1E8]/50 text-[10px] tracking-[0.3em] uppercase font-sans mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* -- MAIN CONTENT -- */}
      <div className="bg-[#F5F1E8] relative">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#0b120c_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

        <div className="max-w-screen-xl mx-auto px-6 md:px-14 lg:px-20 py-20 relative z-10">

          {/* -- SECTION LABEL -- */}
          <Reveal className="mb-12">
            <p className="text-[#F5A524] text-[10px] tracking-[0.5em] uppercase font-sans font-semibold mb-4">
              Daftar Harga Terbaru
            </p>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0b120c] leading-tight">
                Pilih Cluster<br />
                <span className="italic font-normal text-[#0b120c]/50">untuk melihat detail harga</span>
              </h2>
              <p className="text-[#0b120c]/60 text-sm font-light max-w-sm leading-relaxed">
                Semua harga sudah termasuk subsidi PPN, IMB, listrik 2.200 W, dan PDAM. Harga sewaktu-waktu dapat berubah.
              </p>
            </div>
          </Reveal>

          {/* -- TAB SWITCHER -- */}
          <div className="flex gap-3 mb-10 flex-wrap">
            {(["ladera", "cascada"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-3 text-[11px] tracking-[0.3em] uppercase font-bold font-sans transition-all duration-300 rounded-none border",
                  activeTab === tab
                    ? "bg-[#0b120c] text-[#F5F1E8] border-[#0b120c]"
                    : "bg-[#F5F1E8] text-[#0b120c]/60 border-[#0b120c]/15 hover:border-[#F5A524] hover:text-[#F5A524]"
                )}
              >
                {tab === "ladera" ? "Cluster Ladera" : "Cluster Cascada"}
              </button>
            ))}
          </div>

          {/* -- LADERA -- */}
          {activeTab === "ladera" && (
            <div
              key="ladera"
              className="space-y-6"
              style={{ animation: "heroFadeUp 0.4s ease-out both" }}
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                <div className="relative h-60 overflow-hidden rounded-xl shadow-md lg:col-span-2 lg:h-auto">
                  <Image
                    src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671249/Cluster_Ladera_Gate_t1vylp.webp"
                    alt="Cluster Ladera Grand Duta City"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b120c]/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="font-serif text-xl font-bold text-[#F5F1E8] drop-shadow">Cluster Ladera</span>
                    <p className="mt-1 font-sans text-xs text-[#F5F1E8]/70">American Classic Modern</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-4 lg:col-span-3">
                  <h3 className="font-serif text-2xl font-semibold text-[#0b120c] md:text-3xl">
                    Pilihan hunian Ladera<br />
                    <span className="font-normal italic text-[#0b120c]/50">per tipe, harga, dan posisi unit</span>
                  </h3>
                  <p className="text-sm font-light leading-relaxed text-[#0b120c]/70">
                    Pilih tipe untuk melihat kelompok harga unit standar. Unit hook ditampilkan terpisah karena luas tanah dan harganya berbeda.
                  </p>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#F5A524]/30 bg-[#F5A524]/10 px-4 py-2 text-xs text-[#0b120c]/70">
                    <Clock className="h-3.5 w-3.5 text-[#b86d0e]" />
                    <span>Terakhir diperbarui: <strong className="font-semibold text-[#0b120c]">27 Agustus 2026</strong></span>
                  </div>
                </div>
              </div>

              <Accordion title="Verona 39/60" defaultOpen>
                <div className="mb-4 flex items-center gap-2 text-xs text-[#0b120c]/60">
                  <Home className="h-4 w-4 text-[#F5A524]" />
                  <span>Unit standar dan hook tersedia pada Blok J.23.</span>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0b120c]/50">Unit standar</p>
                    <PriceTable rows={laderaVerona} />
                  </div>
                  <div className="rounded-2xl border border-[#F5A524]/35 bg-[#F5A524]/10 p-4 md:p-5">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b86d0e]">Unit hook — harga berbeda</p>
                    <PriceTable rows={[laderaVeronaHook]} />
                  </div>
                </div>
              </Accordion>

              <Accordion title="Malta 47/72">
                <div className="mb-4 flex items-center gap-2 text-xs text-[#0b120c]/60">
                  <Home className="h-4 w-4 text-[#F5A524]" />
                  <span>Unit standar terdiri dari empat kelompok harga berdasarkan blok.</span>
                </div>
                <div className="space-y-5">
                  <PriceTable rows={laderaMalta} />
                  <div className="rounded-2xl border border-[#F5A524]/35 bg-[#F5A524]/10 p-5">
                    <div className="flex flex-col gap-2 border-b border-[#0b120c]/10 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b86d0e]">Unit hook — 11 unit</p>
                      <p className="font-mono text-sm font-semibold text-[#0b120c]">{laderaMaltaHook.cashRange}</p>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[#0b120c]/75">{laderaMaltaHook.kavling}</p>
                    <p className="mt-3 text-xs text-[#0b120c]/60">Luas tanah bervariasi: <strong className="font-medium text-[#0b120c]">{laderaMaltaHook.landRange}</strong>. Harga cash keras mengikuti luas tanah unit.</p>
                  </div>
                </div>
              </Accordion>

              <Accordion title="Tuscan 66/72">
                <div className="mb-4 flex items-center gap-2 text-xs text-[#0b120c]/60">
                  <Home className="h-4 w-4 text-[#F5A524]" />
                  <span>Unit standar terdiri dari tiga kelompok harga berdasarkan blok.</span>
                </div>
                <div className="space-y-5">
                  <PriceTable rows={laderaTuscan} />
                  <div className="rounded-2xl border border-[#F5A524]/35 bg-[#F5A524]/10 p-5">
                    <div className="flex flex-col gap-2 border-b border-[#0b120c]/10 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b86d0e]">Unit hook — 4 unit</p>
                      <p className="font-mono text-sm font-semibold text-[#0b120c]">{laderaTuscanHook.cashRange}</p>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[#0b120c]/75">{laderaTuscanHook.kavling}</p>
                    <p className="mt-3 text-xs text-[#0b120c]/60">Luas tanah bervariasi: <strong className="font-medium text-[#0b120c]">{laderaTuscanHook.landRange}</strong>. Harga cash keras mengikuti luas tanah unit.</p>
                  </div>
                </div>
              </Accordion>

              <Accordion title="Frontera 89/90">
                <div className="rounded-2xl border border-dashed border-[#F5A524]/50 bg-[#F5A524]/10 p-6 text-center sm:p-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b86d0e]">{laderaFrontera.status}</p>
                  <h4 className="mt-3 font-serif text-2xl font-semibold text-[#0b120c]">{laderaFrontera.type}</h4>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#0b120c]/65">{laderaFrontera.description}</p>
                </div>
              </Accordion>
            </div>
          )}

            {/* -- CASCADA -- */}
            {activeTab === "cascada" && (
              <div
                key="cascada"
                className="space-y-8"
                style={{ animation: "heroFadeUp 0.4s ease-out both" }}
              >
                {/* Hero image + intro */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-4">
                  <div className="lg:col-span-2 relative h-60 lg:h-auto rounded-xl overflow-hidden shadow-md">
                    <Image
                      src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671246/cluster_cascada_gate_ecyykh.webp"
                      alt="Cluster Cascada Grand Duta City"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b120c]/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="text-[#F5F1E8] font-serif text-xl font-bold drop-shadow">Cluster Cascada</span>
                      <p className="text-[#F5F1E8]/70 text-xs mt-1 font-sans">Modern Tropical Minimalist</p>
                    </div>
                  </div>
                  <div className="lg:col-span-3 flex flex-col justify-center gap-4">
                    <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#0b120c]">
                      Pilihan Lengkap<br />
                      <span className="italic font-normal text-[#0b120c]/50">T-39 hingga T-88</span>
                    </h3>
                    <p className="text-[#0b120c]/70 text-sm leading-relaxed font-light">
                      Cluster Cascada menyediakan pilihan terlengkap dari tipe compact T-39 hingga tipe premium T-88,
                      cocok untuk berbagai kebutuhan keluarga dan preferensi investasi.
                    </p>
                  </div>
                </div>

                {cascadaData.map((group) => (
                  <Accordion key={group.group} title={`Pricelist ${group.group} — Cluster Cascada`} defaultOpen={group.group === "T-88"}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                      <div className="relative h-48 rounded-lg overflow-hidden shadow-sm md:col-span-1">
                        <Image src={group.image} alt={`Tipe ${group.group} Cluster Cascada Grand Duta City`} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
                      </div>
                      <div className="md:col-span-3">
                        <PriceTable rows={group.rows} />
                      </div>
                    </div>
                  </Accordion>
                ))}
              </div>
            )}

          <KprSimulator activeTab={activeTab} />

          {/* -- PAYMENT METHODS -- */}
          <Reveal className="mt-20 mb-6">
            <p className="text-[#F5A524] text-[10px] tracking-[0.5em] uppercase font-sans font-semibold mb-4">
              Cara Pembayaran
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#0b120c] mb-10">
              Ketentuan &amp; Cara Bayar
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {PAYMENT_METHODS.map((m) => (
              <Reveal
                key={m.title}
                className="bg-[#F5F1E8] rounded-xl border border-[#0b120c]/10 p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 border border-[#F5A524]/30 flex items-center justify-center text-[#F5A524]">
                    {m.icon}
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#0b120c]">{m.title}</h3>
                </div>
                <ol className="space-y-3">
                  {m.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#F5A524]/10 text-[#F5A524] text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-[#0b120c]/70 font-light leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </Reveal>
            ))}
          </div>

          <BankSlider className="mb-14" />

          {/* -- INCLUDES / EXCLUDES -- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-[#F5A524]/5 border border-[#F5A524]/20 rounded-xl p-7">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-4 h-4 text-[#F5A524]" />
                <h3 className="font-serif text-lg font-semibold text-[#0b120c]">Sudah Termasuk</h3>
              </div>
              <ul className="space-y-3">
                {INCLUSIONS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#0b120c]/70 font-light">
                    <span className="text-[#F5A524] mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-7">
              <div className="flex items-center gap-2 mb-5">
                <Info className="w-4 h-4 text-red-400" />
                <h3 className="font-serif text-lg font-semibold text-[#0b120c]">Tidak Termasuk</h3>
              </div>
              <ul className="space-y-3">
                {EXCLUSIONS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#0b120c]/70 font-light">
                    <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* -- NOTES -- */}
          <div className="bg-[#F5F1E8] border border-[#0b120c]/10 rounded-xl p-7 mb-14">
            <h3 className="font-serif text-lg font-semibold text-[#0b120c] mb-5 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#F5A524]" /> Catatan Penting
            </h3>
            <ul className="space-y-3">
              {NOTES.map((note, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#0b120c]/70 font-light">
                  <span className="text-[#F5A524] mt-0.5 shrink-0 font-bold text-xs">{i + 1}.</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* -- REKENING -- */}
          <div className="bg-[#0b120c] rounded-xl p-8 mb-14 text-[#F5F1E8]">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-5 h-5 text-[#F5A524]" />
              <h3 className="font-serif text-xl font-semibold">Rekening Booking Fee</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-[#F5F1E8]/40 text-[9px] tracking-[0.3em] uppercase mb-2">Atas Nama</p>
                <p className="font-semibold text-[#F5F1E8]">PT. DUTA PUTRA MAHKOTA</p>
              </div>
              <div>
                <p className="text-[#F5F1E8]/40 text-[9px] tracking-[0.3em] uppercase mb-2">Bank</p>
                <p className="font-semibold text-[#F5F1E8]">BCA Cab. Duta Merlin</p>
              </div>
              <div>
                <p className="text-[#F5F1E8]/40 text-[9px] tracking-[0.3em] uppercase mb-2">Nomor Rekening</p>
                <p className="font-mono font-bold text-[#F5A524] text-xl tracking-wider">308-322-6699</p>
              </div>
            </div>
          </div>

          {/* -- CTA -- */}
          <Reveal className="text-center py-6">
            <p className="text-[#0b120c]/40 text-[9px] tracking-[0.4em] uppercase font-sans mb-6">
              Ada pertanyaan seputar harga?
            </p>
            <a
              href="https://wa.me/628131742034?text=Halo%2C%20saya%20ingin%20bertanya%20seputar%20pricelist%20Grand%20Duta%20City%20Parung."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#F5A524] hover:bg-[#2a5530] text-[#F5F1E8] px-12 py-4 text-[10px] tracking-[0.4em] uppercase font-bold transition-all duration-500 shadow-lg hover:shadow-xl rounded-full"
            >
              <Phone className="w-4 h-4" />
              Hubungi Marketing Kami
            </a>
          </Reveal>

          {/* -- INTERNAL LINKS -- */}
          <div className="mt-16 pt-10 border-t border-[#0b120c]/10 text-center">
            <h3 className="font-serif text-2xl font-semibold text-[#0b120c] mb-6">Informasi Terkait</h3>
            <div className="flex flex-wrap justify-center gap-3">
               <Link href="/cluster-ladera" className="px-5 py-2.5 rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8] hover:bg-[#F5F1E8] text-[#0b120c]/70 hover:text-[#F5A524] hover:border-[#F5A524]/30 transition-all text-xs font-semibold uppercase tracking-wider">lihat detail Cluster Ladera</Link>
               <Link href="/cluster-cascada" className="px-5 py-2.5 rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8] hover:bg-[#F5F1E8] text-[#0b120c]/70 hover:text-[#F5A524] hover:border-[#F5A524]/30 transition-all text-xs font-semibold uppercase tracking-wider">lihat detail Cluster Cascada</Link>
               <Link href="/update-stok-siteplan-grand-duta-city-parung" className="px-5 py-2.5 rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8] hover:bg-[#F5F1E8] text-[#0b120c]/70 hover:text-[#F5A524] hover:border-[#F5A524]/30 transition-all text-xs font-semibold uppercase tracking-wider">cek stok dan siteplan terbaru</Link>
               <a href="https://wa.me/628131742034" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8] hover:bg-[#F5F1E8] text-[#0b120c]/70 hover:text-[#F5A524] hover:border-[#F5A524]/30 transition-all text-xs font-semibold uppercase tracking-wider">hubungi marketing untuk harga terbaru</a>
            </div>
          </div>

          {/* -- BACK LINK -- */}
          <div className="mt-10 flex justify-center border-t border-[#0b120c]/10 pt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-3 border border-[#F5A524] text-[#F5A524] px-8 py-3 rounded-full font-sans text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#F5A524] hover:text-[#F5F1E8] transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
