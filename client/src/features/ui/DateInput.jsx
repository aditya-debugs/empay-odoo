import { useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * DateInput — native <input type="date"> wrapped with a clickable Calendar icon on the left.
 * Clicking anywhere on the field opens the browser's native date picker via showPicker().
 *
 * Props mirror the admin CreateEmployeePage inline version:
 *   label, value, onChange, required, name, min, max, className
 */
export function DateInput({ label, value, onChange, required, name, min, max, className = '' }) {
  const inputRef = useRef(null);

  function openPicker() {
    if (inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch {
        inputRef.current.focus();
      }
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[13px] font-medium text-ink-muted">{label}</label>
      )}
      <div
        className="relative flex items-center rounded-lg border border-border-strong bg-white transition-all duration-150 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/15 cursor-pointer"
        onClick={openPicker}
      >
        <span className="pl-3 text-ink-soft shrink-0">
          <Calendar className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          className="h-10 w-full bg-transparent pl-2 pr-3 text-sm text-ink cursor-pointer focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </div>
    </div>
  );
}
