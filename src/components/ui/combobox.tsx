import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find(o => o.value === value)?.label || "";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent",
            className
          )}
          onClick={() => setOpen(true)}
        >
          <span>{selectedLabel || placeholder}</span>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </Popover.Trigger>
      <Popover.Content className="w-full min-w-[200px] bg-popover border rounded-md shadow-lg p-2" align="start">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-full mb-2 px-2 py-1 rounded border text-sm focus:outline-none"
          autoFocus
        />
        <div className="max-h-48 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-1 text-sm text-muted">Nenhuma opção encontrada</div>
          ) : (
            filteredOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "w-full text-left px-2 py-1 rounded hover:bg-accent focus:bg-accent text-sm",
                  value === option.value && "bg-accent text-accent-foreground"
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
};
