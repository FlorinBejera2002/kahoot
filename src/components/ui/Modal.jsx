export default function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-md animate-scale-in">
        {title && <h3 className="text-xl font-bold font-display mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
