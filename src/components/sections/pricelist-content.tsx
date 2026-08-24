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

// â”€â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ FORMATTERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmt = (n: number) =>
  "Rp " + n.toLocaleString("id-ID");

const fmtPercent = (n: number) =>
  `${n.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;

// â”€â”€â”€ LADERA DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const laderaT66: PriceRow[] = [
  { kavling: "J.6/19â€“21, J.7/2â€“3,5â€“10,20â€“21, J.8/2â€“3", type: "T-66", lb: 66, lt: 72, tunaiKeras: 1191210600, kpr: 1372093600, dp10: 137209360, bookingFee: 5000000, plafond: 1229884240 },
  { kavling: "J.7/1", type: "T-66 HK", lb: 66, lt: 99.75, tunaiKeras: 1392353100, kpr: 1607348000, dp10: 160734800, bookingFee: 5000000, plafond: 1441613200, isHook: true },
  { kavling: "J.7/22", type: "T-66 HK", lb: 66, lt: 98.48, tunaiKeras: 1385050600, kpr: 1598807100, dp10: 159880710, bookingFee: 5000000, plafond: 1433926390, isHook: true },
  { kavling: "J.8/1", type: "T-66 HK", lb: 66, lt: 124.14, tunaiKeras: 1532595600, kpr: 1771374300, dp10: 177137430, bookingFee: 5000000, plafond: 1589236870, isHook: true },
  { kavling: "J.8/10", type: "T-66 HK", lb: 66, lt: 107.79, tunaiKeras: 1465530600, kpr: 1692935700, dp10: 169293570, bookingFee: 5000000, plafond: 1518642130, isHook: true },
  { kavling: "J.8/11,12,15â€“18", type: "T-66", lb: 66, lt: 72, tunaiKeras: 1209210600, kpr: 1393146200, dp10: 139314620, bookingFee: 5000000, plafond: 1248831580 },
  { kavling: "J.8/19", type: "T-66 HK", lb: 66, lt: 104.85, tunaiKeras: 1447890600, kpr: 1672304100, dp10: 167230410, bookingFee: 5000000, plafond: 1500073690, isHook: true },
  { kavling: "J.10/6", type: "T-66", lb: 66, lt: 108, tunaiKeras: 1425210600, kpr: 1645777800, dp10: 164577780, bookingFee: 5000000, plafond: 1476200020 },
  { kavling: "J.13/1", type: "T-66 HK", lb: 66, lt: 114, tunaiKeras: 1462860600, kpr: 1689812900, dp10: 168981290, bookingFee: 5000000, plafond: 1515831610, isHook: true },
  { kavling: "J.13/2,3,5,6", type: "T-66", lb: 66, lt: 72, tunaiKeras: 1172910600, kpr: 1350690100, dp10: 135069010, bookingFee: 5000000, plafond: 1210621090 },
  { kavling: "J.13/9", type: "T-66 HK", lb: 66, lt: 108, tunaiKeras: 1385790600, kpr: 1599672600, dp10: 159967260, bookingFee: 5000000, plafond: 1434705340, isHook: true },
  { kavling: "J.13/16", type: "T-66", lb: 66, lt: 72, tunaiKeras: 1155210600, kpr: 1329988400, dp10: 132998840, bookingFee: 5000000, plafond: 1191989560 },
  { kavling: "J.14/8", type: "T-66", lb: 66, lt: 78, tunaiKeras: 1206210600, kpr: 1389637500, dp10: 138963750, bookingFee: 5000000, plafond: 1245673750 },
  { kavling: "J.15/5", type: "T-66", lb: 66, lt: 72, tunaiKeras: 1173210600, kpr: 1351041000, dp10: 135104100, bookingFee: 5000000, plafond: 1210936900 },
];

const laderaT47: PriceRow[] = [
  { kavling: "J.17/1", type: "T-47 HK", lb: 47, lt: 127.85, tunaiKeras: 1183975700, kpr: 1366915300, dp10: 136691530, bookingFee: 5000000, plafond: 1225223770, isHook: true },
  { kavling: "J.17/2,3,5,6", type: "T-47", lb: 47, lt: 72, tunaiKeras: 894013200, kpr: 1027777800, dp10: 102777780, bookingFee: 5000000, plafond: 920000020 },
  { kavling: "J.17/7", type: "T-47 HK", lb: 47, lt: 131.79, tunaiKeras: 1202690700, kpr: 1388804100, dp10: 138880410, bookingFee: 5000000, plafond: 1244923690, isHook: true },
  { kavling: "J.17/8, J.18/1", type: "T-47 HK", lb: 47, lt: 107.79, tunaiKeras: 1061743200, kpr: 1223953300, dp10: 122395330, bookingFee: 5000000, plafond: 1096557970, isHook: true },
  { kavling: "J.17/9â€“12,15, J.18/2,3,5â€“7, J.19/15â€“21,25â€“31", type: "T-47", lb: 47, lt: 72, tunaiKeras: 876013200, kpr: 1006725200, dp10: 100672520, bookingFee: 5000000, plafond: 901052680 },
  { kavling: "J.17/16", type: "T-47 HK", lb: 47, lt: 116.73, tunaiKeras: 1101973200, kpr: 1271005900, dp10: 127100590, bookingFee: 5000000, plafond: 1138905310, isHook: true },
  { kavling: "J.18/10", type: "T-47 HK", lb: 47, lt: 131.79, tunaiKeras: 1136795700, kpr: 1311734000, dp10: 131173400, bookingFee: 5000000, plafond: 1175560600, isHook: true },
  { kavling: "J.18/19", type: "T-47 HK", lb: 47, lt: 120.63, tunaiKeras: 1089365700, kpr: 1256260300, dp10: 125626030, bookingFee: 5000000, plafond: 1125634270, isHook: true },
  { kavling: "J.19/5,6,7,9", type: "T-47", lb: 47, lt: 72, tunaiKeras: 858013200, kpr: 985672600, dp10: 98567260, bookingFee: 5000000, plafond: 882105340 },
  { kavling: "J.19/22", type: "T-47 HK", lb: 47, lt: 120.11, tunaiKeras: 1117183200, kpr: 1288795400, dp10: 128879540, bookingFee: 5000000, plafond: 1154915860, isHook: true },
  { kavling: "J.20/3,9,10,15,17,22â€“23,25â€“26,28â€“33,35â€“38", type: "T-47", lb: 47, lt: 72, tunaiKeras: 850813200, kpr: 977251500, dp10: 97725150, bookingFee: 5000000, plafond: 874526350 },
  { kavling: "J.20/20", type: "T-47 HK", lb: 47, lt: 129.13, tunaiKeras: 1112577700, kpr: 1283408800, dp10: 128340880, bookingFee: 5000000, plafond: 1150067920, isHook: true },
  { kavling: "J.20/21", type: "T-47 HK", lb: 47, lt: 117.76, tunaiKeras: 1065392200, kpr: 1228221100, dp10: 122822110, bookingFee: 5000000, plafond: 1100398990, isHook: true },
  { kavling: "J.20/40", type: "T-47 HK", lb: 47, lt: 107.79, tunaiKeras: 1024016700, kpr: 1179828700, dp10: 117982870, bookingFee: 5000000, plafond: 1056845830, isHook: true },
  { kavling: "J.21/1, J.11/19", type: "T-47 HK", lb: 47, lt: 119.78, tunaiKeras: 1115698200, kpr: 1287058500, dp10: 128705850, bookingFee: 5000000, plafond: 1153352650, isHook: true },
  { kavling: "J.21/9", type: "T-47 HK", lb: 47, lt: 117.9, tunaiKeras: 1107238200, kpr: 1277163800, dp10: 127716380, bookingFee: 5000000, plafond: 1144447420, isHook: true },
  { kavling: "J.21/10", type: "T-47 HK", lb: 47, lt: 142.75, tunaiKeras: 1219063200, kpr: 1407953300, dp10: 140795330, bookingFee: 5000000, plafond: 1262157970, isHook: true },
  { kavling: "J.21/19", type: "T-47 HK", lb: 47, lt: 131.78, tunaiKeras: 1169698200, kpr: 1350216400, dp10: 135021640, bookingFee: 5000000, plafond: 1210194760, isHook: true },
  { kavling: "J.11/1", type: "T-47 HK", lb: 47, lt: 118.06, tunaiKeras: 1107958200, kpr: 1278005900, dp10: 127800590, bookingFee: 5000000, plafond: 1145205310, isHook: true },
];

// â”€â”€â”€ CASCADA DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      { kavling: "H.18/20,22,23,27, H.19/3,6,7,10â€“12,16,19,20", type: "T-42", lb: 42, lt: 60, tunaiKeras: 822668500, kpr: 942760300, dp10: 94276030, bookingFee: 5000000, plafond: 843484270 },
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
      { kavling: "H.14/9,11,12,17â€“20", type: "T-69", lb: 69, lt: 74, tunaiKeras: 1183660600, kpr: 1363263200, dp10: 136326320, bookingFee: 5000000, plafond: 1221936880 },
      { kavling: "H.14/21,22", type: "T-69", lb: 69, lt: 74, tunaiKeras: 1165160600, kpr: 1341625800, dp10: 134162580, bookingFee: 5000000, plafond: 1202463220 },
      { kavling: "H.14/28,31", type: "T-69", lb: 69, lt: 73, tunaiKeras: 1159660600, kpr: 1335193000, dp10: 133519300, bookingFee: 5000000, plafond: 1196673700 },
    ],
  },
  {
    group: "T-88",
    image: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Alexandra_hhvq3f.webp",
    rows: [
      { kavling: "H.1/12,15â€“20", type: "T-88", lb: 88, lt: 105, tunaiKeras: 1636618500, kpr: 1893859700, dp10: 189385970, bookingFee: 5000000, plafond: 1699473730 },
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
  ...createSimulationOptions("ladera", "T-66", laderaT66),
  ...createSimulationOptions("ladera", "T-47", laderaT47),
  ...cascadaData.flatMap((group) => createSimulationOptions("cascada", group.group, group.rows)),
];

const DEFAULT_SIMULATION_ID = SIMULATION_OPTIONS[0]?.id ?? "";

// â”€â”€â”€ STATIC CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PAYMENT_METHODS = [
  {
    icon: <Banknote className="w-5 h-5" />,
    title: "A. Tunai Keras",
    steps: [
      "Booking Fee Rp 5.000.000 â€” dibayar hari ke-1",
      "Down Payment = 50% âˆ’ Booking Fee â€” dibayar hari ke-15 setelah BF",
      "Pelunasan 50% â€” dibayar hari ke-30 setelah BF",
    ],
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "B. KPR Bank",
    steps: [
      "Booking Fee Rp 5.000.000 â€” dibayar hari ke-1",
      "Down Payment â€” dibayar hari ke-15 setelah BF",
      "Akad Kredit (KPR) â€” dilakukan hari ke-30 setelah BF",
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

// â”€â”€â”€ PRICE TABLE COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PriceTable({ rows }: { rows: PriceRow[] }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#0b120c]/10 shadow-sm">
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
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-t border-[#0b120c]/5 transition-colors duration-200 hover:bg-[#F5A524]/5",
                row.isHook ? "bg-[#F5A524]/5" : i % 2 === 0 ? "bg-[#F5F1E8]" : "bg-[#F5F1E8]/50"
              )}
            >
              <td className="px-4 py-3 text-[#0b120c]/80 font-sans text-xs leading-snug">{row.kavling}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={cn(
                  "inline-block px-2 py-0.5 rounded font-mono text-xs font-bold",
                  row.isHook
                    ? "bg-[#F5A524]/20 text-[#c47a2a]"
                    : "bg-[#F5A524]/10 text-[#F5A524]"
                )}>
                  {row.type}
                </span>
              </td>
              <td className="px-4 py-3 text-center font-mono text-xs text-[#0b120c]/70 whitespace-nowrap">
                {row.lb} / {row.lt} mÂ²
              </td>
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
  );
}

// â”€â”€â”€ ACCORDIAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      {/* Akordeon CSS: grid-template-rows 0frâ†’1fr tanpa JS */}
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

// â”€â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PricelistPage() {
  const [activeTab, setActiveTab] = useState<ClusterKey>("ladera");

  return (
    <>
      {/* â”€â”€ HERO â”€â”€ */}
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
              Grand Duta City Parung Â· South of Jakarta
            </p>
            {/* H1 â€” unique, no cannibalisation with homepage/cluster pages */}
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

      {/* â”€â”€ INTRO STATS BAR â”€â”€ */}
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

      {/* â”€â”€ MAIN CONTENT â”€â”€ */}
      <div className="bg-[#F5F1E8] relative">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#0b120c_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

        <div className="max-w-screen-xl mx-auto px-6 md:px-14 lg:px-20 py-20 relative z-10">

          {/* â”€â”€ SECTION LABEL â”€â”€ */}
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

          {/* â”€â”€ TAB SWITCHER â”€â”€ */}
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

          {/* â”€â”€ LADERA â”€â”€ */}
          {activeTab === "ladera" && (
            <div
              key="ladera"
              className="space-y-8"
              style={{ animation: "heroFadeUp 0.4s ease-out both" }}
            >
                {/* Hero image + intro */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-4">
                  <div className="lg:col-span-2 relative h-60 lg:h-auto rounded-xl overflow-hidden shadow-md">
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
                      <span className="text-[#F5F1E8] font-serif text-xl font-bold drop-shadow">Cluster Ladera</span>
                      <p className="text-[#F5F1E8]/70 text-xs mt-1 font-sans">American Classic Modern</p>
                    </div>
                  </div>
                  <div className="lg:col-span-3 flex flex-col justify-center gap-4">
                    <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#0b120c]">
                      Hunian Bergaya<br />
                      <span className="italic font-normal text-[#0b120c]/50">American Classic Modern</span>
                    </h3>
                    <p className="text-[#0b120c]/70 text-sm leading-relaxed font-light">
                      Cluster Ladera menawarkan tipe T-66 dan T-47 dengan pilihan kavling reguler maupun hook (HK).
                      Kavling hook memiliki luas tanah lebih besar dan posisi strategis di sudut kavling dengan harga berbeda.
                    </p>
                    <div className="flex gap-4 flex-wrap mt-2">
                      <div className="flex items-center gap-2 text-xs font-sans">
                        <span className="w-3 h-3 rounded-sm bg-[#F5A524]/20 border border-[#F5A524]/30 inline-block" />
                        <span className="text-[#0b120c]/60">Unit Reguler</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-sans">
                        <span className="w-3 h-3 rounded-sm bg-[#F5A524]/20 border border-[#F5A524]/40 inline-block" />
                        <span className="text-[#0b120c]/60">Unit Hook (HK) â€” LT lebih luas</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Accordion title="Pricelist T-66 â€” Cluster Ladera" defaultOpen>
                  <div className="mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#F5A524]" />
                    <span className="text-xs text-[#0b120c]/60 font-sans">LB 66 mÂ², LT bervariasi (72â€“124 mÂ²)</span>
                  </div>
                  <PriceTable rows={laderaT66} />
                </Accordion>

                <Accordion title="Pricelist T-47 â€” Cluster Ladera">
                  <div className="mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#F5A524]" />
                    <span className="text-xs text-[#0b120c]/60 font-sans">LB 47 mÂ², LT bervariasi (72â€“142 mÂ²)</span>
                  </div>
                  <PriceTable rows={laderaT47} />
                </Accordion>
            </div>
          )}

            {/* â”€â”€ CASCADA â”€â”€ */}
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
                  <Accordion key={group.group} title={`Pricelist ${group.group} â€” Cluster Cascada`} defaultOpen={group.group === "T-88"}>
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

          {/* â”€â”€ PAYMENT METHODS â”€â”€ */}
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

          {/* â”€â”€ INCLUDES / EXCLUDES â”€â”€ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-[#F5A524]/5 border border-[#F5A524]/20 rounded-xl p-7">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-4 h-4 text-[#F5A524]" />
                <h3 className="font-serif text-lg font-semibold text-[#0b120c]">Sudah Termasuk</h3>
              </div>
              <ul className="space-y-3">
                {INCLUSIONS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#0b120c]/70 font-light">
                    <span className="text-[#F5A524] mt-0.5 shrink-0">âœ“</span>
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
                    <span className="text-red-400 mt-0.5 shrink-0">âœ•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* â”€â”€ NOTES â”€â”€ */}
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

          {/* â”€â”€ REKENING â”€â”€ */}
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

          {/* â”€â”€ CTA â”€â”€ */}
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

          {/* â”€â”€ INTERNAL LINKS â”€â”€ */}
          <div className="mt-16 pt-10 border-t border-[#0b120c]/10 text-center">
            <h3 className="font-serif text-2xl font-semibold text-[#0b120c] mb-6">Informasi Terkait</h3>
            <div className="flex flex-wrap justify-center gap-3">
               <Link href="/cluster-ladera" className="px-5 py-2.5 rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8] hover:bg-[#F5F1E8] text-[#0b120c]/70 hover:text-[#F5A524] hover:border-[#F5A524]/30 transition-all text-xs font-semibold uppercase tracking-wider">lihat detail Cluster Ladera</Link>
               <Link href="/cluster-cascada" className="px-5 py-2.5 rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8] hover:bg-[#F5F1E8] text-[#0b120c]/70 hover:text-[#F5A524] hover:border-[#F5A524]/30 transition-all text-xs font-semibold uppercase tracking-wider">lihat detail Cluster Cascada</Link>
               <Link href="/update-stok-siteplan-grand-duta-city-parung" className="px-5 py-2.5 rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8] hover:bg-[#F5F1E8] text-[#0b120c]/70 hover:text-[#F5A524] hover:border-[#F5A524]/30 transition-all text-xs font-semibold uppercase tracking-wider">cek stok dan siteplan terbaru</Link>
               <a href="https://wa.me/628131742034" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl border border-[#0b120c]/10 bg-[#F5F1E8] hover:bg-[#F5F1E8] text-[#0b120c]/70 hover:text-[#F5A524] hover:border-[#F5A524]/30 transition-all text-xs font-semibold uppercase tracking-wider">hubungi marketing untuk harga terbaru</a>
            </div>
          </div>

          {/* â”€â”€ BACK LINK â”€â”€ */}
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
