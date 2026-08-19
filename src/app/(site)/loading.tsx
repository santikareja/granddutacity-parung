export default function Loading() {
  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#090D0A] text-[#F8F6F0] relative overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Memuat halaman"
    >
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#f5a524_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D49A3D]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Brand mark with breathing ring */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1C261E] to-[#090D0A] border border-[#D49A3D]/30 flex items-center justify-center shadow-[0_8px_30px_rgba(212,154,61,0.18)]">
          <span className="font-serif text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#F5A524] to-[#D49A3D] leading-none">
            G
          </span>
          <span className="absolute inset-0 rounded-2xl bg-[#D49A3D]/10 animate-ping" />
        </div>

        <div className="text-center">
          <p className="font-serif text-lg font-semibold tracking-tight text-[#F8F6F0]">
            Grand Duta City Parung
          </p>
          <p className="text-[#F8F6F0]/50 text-[10px] tracking-[0.24em] uppercase font-sans mt-1.5">
            South of Jakarta
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-44 h-0.5 bg-white/10 overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-[#F5A524] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
