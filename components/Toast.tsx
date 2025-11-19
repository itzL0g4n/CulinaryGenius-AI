import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const Toast: React.FC<{ toast: ToastMessage; remove: () => void }> = ({ toast, remove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      remove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [remove]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`${bgColors[toast.type]} text-white px-6 py-3 rounded-lg shadow-lg mb-3 flex items-center animate-fade-in transition-all transform hover:scale-102`}>
      <span>{toast.message}</span>
      <button onClick={remove} className="ml-4 font-bold opacity-70 hover:opacity-100">×</button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} remove={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
};