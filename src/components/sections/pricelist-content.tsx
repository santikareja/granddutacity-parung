"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Info,
  Home,
  CreditCard,
  FileText,
  Banknote,
  ArrowLeft,
  Clock,
  Calculator,
  Sparkles,
  ShieldCheck,
  Wallet,
  TrendingUp,
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
  blocks?: string;
  units?: number;
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
  { kavling: "J.23 No. 11, 16, 17, 18", type: "Verona 39/60", lb: 39, lt: 60, tunaiKeras: 695052700, kpr: 800000000, dp10: 80000000, bookingFee: 5000000, plafond: 715000000, blocks: "J.23", units: 4 },
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
  blocks: "J.23",
  units: 2,
};

const laderaMalta: PriceRow[] = [
  { kavling: "J.17 No. 3, 5, 6", type: "Malta 47/72", lb: 47, lt: 72, tunaiKeras: 888750000, kpr: 1021929900, dp10: 102192990, bookingFee: 5000000, plafond: 914736910, blocks: "J.17", units: 3 },
  { kavling: "J.17 No. 9, 10, 11, 12, 15; J.18 No. 2, 3, 5, 6; J.19 No. 16, 17, 18, 19, 21, 28, 29, 30, 31", type: "Malta 47/72", lb: 47, lt: 72, tunaiKeras: 870750000, kpr: 1000877200, dp10: 100087720, bookingFee: 5000000, plafond: 895789480, blocks: "J.17, J.18, J.19", units: 18 },
  { kavling: "J.19 No. 5, 6, 7, 9", type: "Malta 47/72", lb: 47, lt: 72, tunaiKeras: 852750000, kpr: 979824600, dp10: 97982460, bookingFee: 5000000, plafond: 876842140, blocks: "J.19", units: 4 },
  { kavling: "J.20 No. 15, 23, 28, 30, 32, 35, 36, 38", type: "Malta 47/72", lb: 47, lt: 72, tunaiKeras: 845550000, kpr: 971403600, dp10: 97140360, bookingFee: 5000000, plafond: 869263240, blocks: "J.20", units: 8 },
];

const laderaMaltaHook: HookSummary = {
  kavling: "J.11 No. 19; J.17 No. 1, 7, 8, 16; J.18 No. 1, 10; J.19 No. 22; J.20 No. 20, 21, 40",
  cashRange: "Rp 1.018.753.500 – Rp 1.197.427.500",
  landRange: "107,79 – 131,79 m²",
};

const laderaTuscan: PriceRow[] = [
  { kavling: "J.7 No. 2, 3, 5, 6, 10, 20, 21; J.8 No. 3", type: "Tuscan 66/72", lb: 66, lt: 72, tunaiKeras: 1129800000, kpr: 1303859700, dp10: 130385970, bookingFee: 5000000, plafond: 1168473730, blocks: "J.7, J.8", units: 8 },
  { kavling: "J.8 No. 11, 12, 15, 16, 17, 18", type: "Tuscan 66/72", lb: 66, lt: 72, tunaiKeras: 1147800000, kpr: 1324912300, dp10: 132491230, bookingFee: 5000000, plafond: 1187421070, blocks: "J.8", units: 6 },
  { kavling: "J.13 No. 3, 5", type: "Tuscan 66/72", lb: 66, lt: 72, tunaiKeras: 1111500000, kpr: 1282456200, dp10: 128245620, bookingFee: 5000000, plafond: 1149210580, blocks: "J.13", units: 2 },
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
type CascadaEntry =
  | { kind: "table"; group: string; name?: string; image: string; rows: PriceRow[]; note?: string }
  | { kind: "range"; group: string; name?: string; image: string; lb: number; ltInfo: string; cashRange: string; note?: string };

const cascadaData: CascadaEntry[] = [
  {
    kind: "range",
    group: "T-39",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    lb: 39,
    ltInfo: "65 m² & 69 m²",
    cashRange: "Rp 773.200.000 – Rp 790.546.000",
    note: "Tidak ada unit hook untuk tipe ini.",
  },
  {
    kind: "table",
    group: "T-42",
    name: "Aira",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    rows: [
      { kavling: "H.18/20,22,27; H.19/3,6,7,11,12,16,19,20", type: "T-42", lb: 42, lt: 60, tunaiKeras: 790500000, kpr: 907017600, dp10: 90701760, bookingFee: 5000000, plafond: 811315840, blocks: "H.18, H.19", units: 11 },
    ],
    note: "11 unit standar. Tidak ada unit hook untuk tipe ini.",
  },
  {
    kind: "range",
    group: "T-47",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Malta_tkq7di.webp",
    lb: 47,
    ltInfo: "72 m² & 78 m²",
    cashRange: "Rp 844.110.000 – Rp 868.890.000",
    note: "Tidak ada unit hook untuk tipe ini.",
  },
  {
    kind: "table",
    group: "T-58",
    name: "Manoa",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
    rows: [
      { kavling: "H.15/3; H.16/19,20,22; H.18/6", type: "T-58", lb: 58, lt: 60, tunaiKeras: 903500000, kpr: 1039181300, dp10: 103918130, bookingFee: 5000000, plafond: 930263170, blocks: "H.15, H.16, H.18", units: 5 },
    ],
    note: "5 unit standar. Tidak ada unit hook untuk tipe ini.",
  },
  {
    kind: "table",
    group: "T-62",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
    rows: [
      { kavling: "H.18/1", type: "T-62 HK", lb: 62, lt: 112.8, tunaiKeras: 1199750000, kpr: 1385672600, dp10: 138567260, bookingFee: 5000000, plafond: 1242105340, isHook: true, blocks: "H.18", units: 1 },
    ],
    note: "Satu-satunya unit hook (HK) di Cluster Cascada.",
  },
  {
    kind: "table",
    group: "T-69",
    name: "Victoria",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Victoria_scolcc.webp",
    rows: [
      { kavling: "H.14/9,12,17,18,19", type: "T-69", lb: 69, lt: 74, tunaiKeras: 1122250000, kpr: 1295029300, dp10: 129502930, bookingFee: 5000000, plafond: 1160526370, blocks: "H.14", units: 5 },
      { kavling: "H.14/22 (harga khusus)", type: "T-69", lb: 69, lt: 74, tunaiKeras: 1103750000, kpr: 1273391900, dp10: 127339190, bookingFee: 5000000, plafond: 1141052710, blocks: "H.14", units: 1 },
    ],
    note: "5 unit standar + 1 unit dengan harga khusus (H.14/22).",
  },
  {
    kind: "table",
    group: "T-88",
    name: "Alexandra",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Alexandra_hhvq3f.webp",
    rows: [
      { kavling: "H.1/20; H.11/2,5,6,7,8,9", type: "T-88", lb: 88, lt: 105, tunaiKeras: 1610302700, kpr: 1864619900, dp10: 186461990, bookingFee: 5000000, plafond: 1673157910, blocks: "H.1, H.11", units: 7 },
      { kavling: "H.1/21,22,23", type: "T-88", lb: 88, lt: 106, tunaiKeras: 1617552700, kpr: 1873099500, dp10: 187309950, bookingFee: 5000000, plafond: 1680789550, blocks: "H.1", units: 3 },
      { kavling: "H.1/25,29", type: "T-88", lb: 88, lt: 107, tunaiKeras: 1624802700, kpr: 1881579000, dp10: 188157900, bookingFee: 5000000, plafond: 1688421100, blocks: "H.1", units: 2 },
      { kavling: "H.3/10 (harga khusus)", type: "T-88", lb: 88, lt: 105, tunaiKeras: 1339452700, kpr: 1547836300, dp10: 154783630, bookingFee: 5000000, plafond: 1388052670, blocks: "H.3", units: 1 },
    ],
    note: "3 tingkat harga sesuai luas tanah + 1 unit dengan harga khusus (H.3/10).",
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
  ...cascadaData.flatMap((group) =>
    group.kind === "table" ? createSimulationOptions("cascada", group.group, group.rows) : []
  ),
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
  {
    icon: <Wallet className="w-5 h-5" />,
    title: "C. Cash Bertahap 12 Bulan",
    steps: [
      "Booking Fee Rp 5.000.000 — dibayar di awal",
      "Down Payment 20% dari harga unit",
      "Sisa 80% diangsur bertahap dalam 12 kali angsuran",
    ],
  },
];

// Promo yang mengikuti Program Pemerintah (berlaku selama program berjalan).
const GOVERNMENT_PROMOS = [
  { title: "Free AJB", desc: "Biaya Akta Jual Beli ditanggung." },
  { title: "Free SHM", desc: "Sertifikat Hak Milik atas nama pembeli." },
  { title: "Free BPHTB", desc: "Bea perolehan hak atas tanah & bangunan." },
  { title: "PPN DTP 100%", desc: "PPN sepenuhnya ditanggung pemerintah." },
];

// Subsidi tambahan langsung dari developer.
const DEVELOPER_SUBSIDIES = [
  {
    icon: <Wallet className="h-5 w-5" />,
    title: "Subsidi DP 10%",
    desc: "Bantuan uang muka 10% langsung dari developer.",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Subsidi KPR s.d. Rp 35 Juta",
    desc: "Potongan biaya KPR hingga Rp 35 juta.",
  },
];

const INCLUSIONS = [
  "Izin Mendirikan Bangunan (IMB)",
  "Penyambungan daya listrik 2.200 W",
  "Pemasangan jaringan air PDAM",
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
    <div className={cn("grid grid-cols-1 gap-4", rows.length > 1 && "sm:grid-cols-2")}>
      {rows.map((row) => (
        <article
          key={`${row.type}-${row.kavling}`}
          className={cn(
            "rounded-2xl border p-5 shadow-sm",
            row.isHook ? "border-[#F5A524]/40 bg-[#F5A524]/10" : "border-[#0b120c]/10 bg-white"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "rounded px-2 py-1 font-mono text-xs font-bold",
              row.isHook ? "bg-[#F5A524]/25 text-[#c47a2a]" : "bg-[#F5A524]/15 text-[#b86d0e]"
            )}>
              {row.type}
            </span>
            {row.isHook && (
              <span className="rounded-full bg-[#c47a2a]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#c47a2a]">Hook</span>
            )}
            {typeof row.units === "number" && (
              <span className="ml-auto text-[11px] font-medium text-[#0b120c]/55">{row.units} unit</span>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#0b120c]/75">Blok {row.blocks ?? row.kavling}</p>
          <p className="mt-1 text-xs text-[#0b120c]/50">LB {row.lb} m² · LT {row.lt} m²</p>

          <div className="mt-4 rounded-xl bg-[#F5F1E8] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0b120c]/45">Harga KPR</p>
            <p className="mt-1 font-mono text-lg font-bold text-red-600 sm:text-xl">{fmt(row.kpr)}</p>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { label: "Tunai Keras", value: fmt(row.tunaiKeras) },
              { label: "DP 10%", value: fmt(row.dp10) },
              { label: "Plafond KPR", value: fmt(row.plafond) },
              { label: "Booking Fee", value: fmt(row.bookingFee) },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[10px] font-sans uppercase tracking-[0.1em] text-[#0b120c]/45">{item.label}</dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold text-[#0b120c]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
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
              <Clock className="w-4 h-4 text-[#F5A524]" /> Tanggal update: 27 Agustus 2026
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

              <section aria-labelledby="ladera-verona" className="overflow-hidden rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8]">
                <header className="border-b border-[#0b120c]/10 px-5 py-5 md:px-6">
                  <h3 id="ladera-verona" className="font-serif text-lg font-semibold text-[#0b120c] md:text-xl">Verona 39/60</h3>
                </header>
                <div className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                  <div className="flex items-center gap-2 text-xs text-[#0b120c]/60">
                    <Home className="h-4 w-4 text-[#F5A524]" />
                    <span>Unit standar dan hook tersedia pada Blok J.23.</span>
                  </div>
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0b120c]/50">Unit standar</p>
                    <PriceTable rows={laderaVerona} />
                  </div>
                  <div className="rounded-2xl border border-[#F5A524]/35 bg-[#F5A524]/10 p-4 md:p-5">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b86d0e]">Unit hook — harga berbeda</p>
                    <PriceTable rows={[laderaVeronaHook]} />
                  </div>
                </div>
              </section>

              <section aria-labelledby="ladera-malta" className="overflow-hidden rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8]">
                <header className="border-b border-[#0b120c]/10 px-5 py-5 md:px-6">
                  <h3 id="ladera-malta" className="font-serif text-lg font-semibold text-[#0b120c] md:text-xl">Malta 47/72</h3>
                </header>
                <div className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                  <div className="flex items-center gap-2 text-xs text-[#0b120c]/60">
                    <Home className="h-4 w-4 text-[#F5A524]" />
                    <span>Unit standar terdiri dari empat kelompok harga berdasarkan blok.</span>
                  </div>
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
              </section>

              <section aria-labelledby="ladera-tuscan" className="overflow-hidden rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8]">
                <header className="border-b border-[#0b120c]/10 px-5 py-5 md:px-6">
                  <h3 id="ladera-tuscan" className="font-serif text-lg font-semibold text-[#0b120c] md:text-xl">Tuscan 66/72</h3>
                </header>
                <div className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                  <div className="flex items-center gap-2 text-xs text-[#0b120c]/60">
                    <Home className="h-4 w-4 text-[#F5A524]" />
                    <span>Unit standar terdiri dari tiga kelompok harga berdasarkan blok.</span>
                  </div>
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
              </section>

              <section aria-labelledby="ladera-frontera" className="overflow-hidden rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8]">
                <header className="border-b border-[#0b120c]/10 px-5 py-5 md:px-6">
                  <h3 id="ladera-frontera" className="font-serif text-lg font-semibold text-[#0b120c] md:text-xl">Frontera 89/90</h3>
                </header>
                <div className="p-5 md:p-6">
                  <div className="rounded-2xl border border-dashed border-[#F5A524]/50 bg-[#F5A524]/10 p-6 text-center sm:p-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b86d0e]">{laderaFrontera.status}</p>
                    <h4 className="mt-3 font-serif text-2xl font-semibold text-[#0b120c]">{laderaFrontera.type}</h4>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#0b120c]/65">{laderaFrontera.description}</p>
                  </div>
                </div>
              </section>
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

                {cascadaData.map((group) => {
                  const typeNumber = group.group.replace("T-", "");
                  const title = group.name ? `${group.name} · Tipe ${typeNumber}` : `Tipe ${typeNumber}`;
                  return (
                    <section
                      key={group.group}
                      aria-label={title}
                      className="overflow-hidden rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8]"
                    >
                      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0b120c]/10 px-5 py-4 md:px-6">
                        <h3 className="font-serif text-lg font-semibold text-[#0b120c] md:text-xl">{title}</h3>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0b120c]/45">Cluster Cascada</span>
                      </header>
                      <div className="px-5 py-5 md:px-6 md:py-6">
                        {group.kind === "table" ? (
                          <PriceTable rows={group.rows} />
                        ) : (
                          <div className="rounded-2xl border border-[#0b120c]/10 bg-white p-5 sm:p-6">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0b120c]/50">Cash Keras</p>
                            <p className="mt-2 font-mono text-lg font-semibold text-[#0b120c] sm:text-xl">{group.cashRange}</p>
                            <p className="mt-3 text-sm text-[#0b120c]/70">LB {group.lb} m² · pilihan luas tanah {group.ltInfo}.</p>
                            <p className="mt-3 text-xs leading-relaxed text-[#0b120c]/55">Estimasi KPR dan simulasi cicilan untuk tipe ini tersedia melalui marketing.</p>
                          </div>
                        )}
                        {group.note && (
                          <p className="mt-4 text-xs text-[#0b120c]/60">{group.note}</p>
                        )}
                      </div>
                    </section>
                  );
                })}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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

          {/* -- PROMO & BENEFIT -- */}
          <Reveal className="mb-6">
            <p className="text-[#F5A524] text-[10px] tracking-[0.5em] uppercase font-sans font-semibold mb-4">
              Promo Berjalan
            </p>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#0b120c] leading-tight">
                Untung Lebih<br />
                <span className="italic font-normal text-[#0b120c]/50">saat beli sekarang</span>
              </h2>
              <p className="text-[#0b120c]/60 text-sm font-light max-w-sm leading-relaxed">
                Manfaatkan program pemerintah dan subsidi developer agar biaya awal jauh lebih ringan.
              </p>
            </div>
          </Reveal>

          {/* Promo program pemerintah */}
          <Reveal className="mb-6 overflow-hidden rounded-2xl bg-[#0b120c] text-[#F5F1E8]">
            <div className="flex items-center gap-2 px-6 pt-6 pb-4 md:px-8">
              <Sparkles className="h-4 w-4 text-[#F5A524]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5F1E8]/70">
                Gratis Biaya — Program Pemerintah
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-[#F5F1E8]/10 lg:grid-cols-4">
              {GOVERNMENT_PROMOS.map((promo) => (
                <div key={promo.title} className="bg-[#0b120c] p-6 md:p-8">
                  <p className="font-serif text-xl font-semibold text-[#F5A524] md:text-2xl">{promo.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#F5F1E8]/60">{promo.desc}</p>
                </div>
              ))}
            </div>
            <p className="px-6 pt-4 pb-6 text-[11px] leading-relaxed text-[#F5F1E8]/45 md:px-8">
              *Berlaku selama Program Pemerintah masih berjalan dan sesuai ketentuan yang ditetapkan.
            </p>
          </Reveal>

          {/* Subsidi developer + sudah termasuk */}
          <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {DEVELOPER_SUBSIDIES.map((subsidy) => (
              <Reveal key={subsidy.title} className="rounded-2xl border border-[#F5A524]/25 bg-[#F5A524]/10 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5A524]/20 text-[#b86d0e]">
                  {subsidy.icon}
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-[#0b120c]">{subsidy.title}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-[#0b120c]/65">{subsidy.desc}</p>
              </Reveal>
            ))}
            <Reveal className="rounded-2xl border border-[#0b120c]/10 bg-white p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#F5A524]" />
                <h3 className="font-serif text-lg font-semibold text-[#0b120c]">Sudah Termasuk Harga</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {INCLUSIONS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-light text-[#0b120c]/70">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F5A524]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
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
