import { forwardRef } from 'react';

const Input = forwardRef(({ icon: Icon, className = '', ...props }, ref) => (
  <div className="relative">
    {Icon && <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />}
    <input ref={ref} className={`input-field ${Icon ? 'pl-10' : ''} ${className}`} {...props} />
  </div>
));

Input.displayName = 'Input';
export default Input;
