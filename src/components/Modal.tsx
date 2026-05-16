export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#15171E] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="font-semibold text-lg text-[#E0E0E6]">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 shift-anim-colors text-xs font-bold uppercase ls-wide">
            Hide
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
