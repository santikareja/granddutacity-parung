export default function Loading() {
  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#090D0A] relative overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Memuat halaman"
    >
      {/* Soft ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D49A3D]/[0.03] blur-[100px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center gap-5">
        {/* Brand text */}
        <div className="text-center">
          <p className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#F8F6F0] leading-tight">
            Grand Duta City Parung
          </p>
          <p className="text-[#D49A3D] text-[10px] tracking-[0.3em] uppercase font-sans mt-2 font-medium">
            South of Jakarta
          </p>
        </div>

        {/* Minimalist loading bar */}
        <div className="w-32 h-px bg-white/10 overflow-hidden rounded-full mt-1">
          <div
            className="h-full w-full bg-gradient-to-r from-transparent via-[#D49A3D] to-transparent rounded-full"
            style={{
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
