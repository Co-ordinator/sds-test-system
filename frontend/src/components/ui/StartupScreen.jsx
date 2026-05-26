import { LOGO_ALT } from '../../theme/government';

export default function StartupScreen({ message = 'Loading SDS Test System...' }) {
  return (
    <div className="min-h-screen bg-[#eef5fb] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[2px] border-[#cfe3f2]" />
          <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-[#2d8bc4] border-r-[#ffeb3b] border-b-[#f44336] animate-[sdsStartupSpin_1s_linear_infinite]" />
          <img
            src="/letterhead.png"
            alt={LOGO_ALT}
            className="relative h-12 w-16 object-contain"
          />
        </div>
        <p className="mt-5 text-sm font-bold text-[#111827]">{message}</p>
        <p className="mt-1 text-xs font-medium text-[#6b7280]">Please wait while we prepare your session.</p>
      </div>
    </div>
  );
}
