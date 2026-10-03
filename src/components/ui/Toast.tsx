import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer = ({ toasts, onDismiss }: ToastProps) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

        // Desaturated, earthy artisan palette
        const colorClasses =
          toast.type === 'success'
            ? 'bg-[#EDF3EC] border-[#C3D5C0] text-[#3B2314]'
            : toast.type === 'error'
            ? 'bg-[#FAF0EF] border-[#E8C2BF] text-[#3B2314]'
            : 'bg-[#FFFDF9] border-[#D8CEC4] text-[#3B2314]';

        const iconColor =
          toast.type === 'success'
            ? 'text-[#526A50]'
            : toast.type === 'error'
            ? 'text-[#8F423B]'
            : 'text-[#9E5A38]';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 border shadow-luxury backdrop-blur-md transition-all duration-300 rounded-none font-serif ${colorClasses}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs uppercase tracking-wider">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-[#3B2314]/80 mt-0.5 line-clamp-2 font-sans font-light">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#3B2314]/50 hover:text-[#3B2314] transition-colors p-1 -mr-1 -mt-1"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
