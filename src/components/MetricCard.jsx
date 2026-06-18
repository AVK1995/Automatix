export default function MetricCard({ title, value, description }) {
  return (
    <div className="bg-card border border-border-subtle p-6 rounded-sm shadow-sm flex flex-col justify-between">
      <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-foreground">{value}</span>
      </div>
      {description && <p className="mt-2 text-xs text-text-secondary">{description}</p>}
    </div>
  );
}
