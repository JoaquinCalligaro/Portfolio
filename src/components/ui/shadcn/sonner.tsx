import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'admin-root !rounded-xl !border-white/10 !bg-gray-900 !text-gray-100',
          description: '!text-gray-300',
        },
      }}
    />
  );
}
