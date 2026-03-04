export default function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button className={`${base} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
