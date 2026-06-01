interface TopBarProps {
  title: string;
  subtitle: string;
  dataSource: string;
}

export function TopBar({ title, subtitle, dataSource }: TopBarProps) {
  return (
    <header className="glass-card mb-4 flex items-center justify-between rounded-lg px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-cyan-accent">{title}</h1>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Data source</p>
        <p className="mt-0.5 rounded-md border border-slate-border px-3 py-1 text-xs text-slate-300">{dataSource}</p>
      </div>
    </header>
  );
}
