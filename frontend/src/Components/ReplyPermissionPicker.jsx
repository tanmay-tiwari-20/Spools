import { useEffect, useRef, useState } from "react";
import { FiAtSign, FiCheck, FiChevronDown, FiGlobe, FiUsers } from "react-icons/fi";

const permissions = [
  { value: "everyone", label: "Everyone", description: "Anyone can reply", Icon: FiGlobe },
  { value: "followers", label: "Followers", description: "Your followers can reply", Icon: FiUsers },
  { value: "mentioned", label: "Mentioned", description: "People you mention can reply", Icon: FiAtSign },
];

const ReplyPermissionPicker = ({ value, onChange, className = "" }) => {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const selected = permissions.find((permission) => permission.value === value) || permissions[0];
  const SelectedIcon = selected.Icon;

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={`Who can reply? ${selected.description}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        <SelectedIcon className="shrink-0 text-zinc-500 dark:text-zinc-400" size={15} aria-hidden="true" />
        <span className="whitespace-nowrap">{selected.label}</span>
        <FiChevronDown className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} size={14} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Who can reply?"
          className="absolute left-0 top-full z-50 mt-2 w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/30"
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">Reply access</p>
          {permissions.map(({ value: permissionValue, label, description, Icon }) => (
            <button
              key={permissionValue}
              type="button"
              role="option"
              aria-selected={selected.value === permissionValue}
              onClick={() => {
                onChange(permissionValue);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-100">{label}</span>
                <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">{description}</span>
              </span>
              {selected.value === permissionValue && <FiCheck className="shrink-0 text-zinc-700 dark:text-zinc-200" size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplyPermissionPicker;
