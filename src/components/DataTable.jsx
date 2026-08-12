import { SYSTEM_STATUS } from '@/constants';

export default function DataTable({ data, columns, renderMobileCard }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full border border-border-subtle rounded-sm bg-card p-8 text-center text-sm text-text-secondary">
        No records found.
      </div>
    );
  }

  return (
    <>
      {renderMobileCard && (
        <div className="md:hidden flex flex-col gap-4">
          {data.map((row, i) => renderMobileCard(row, i))}
        </div>
      )}
      <div className={`w-full overflow-x-auto border border-border-subtle rounded-sm bg-card ${renderMobileCard ? 'hidden md:block' : ''}`}>
        <table className="w-full text-center text-sm whitespace-nowrap">
          <thead className="bg-background border-b border-border-subtle text-text-secondary">
            <tr>
            {columns.map((col, i) => (
              <th key={i} className={`px-4 py-3 font-medium tracking-wide ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle text-foreground">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-background/50 transition-colors">
              {columns.map((col, j) => {
                const cellValue = col.accessor(row);
                
                let displayValue = cellValue;
                if (col.isStatus) {
                  const valStr = String(cellValue).toUpperCase();
                  const isSuccess = valStr === 'COMPLETED' || valStr === 'ACTIVE';
                  const isFail = valStr === 'FAILED' || valStr === 'CANCELLED';
                  const isInactive = valStr === 'INACTIVE';
                  
                  displayValue = (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${
                      isSuccess ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      isFail ? 'bg-red-400/10 text-red-400 border-red-400/20' : 
                      isInactive ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
                      'bg-border-subtle text-text-secondary border-border-subtle'
                    }`}>
                      {cellValue}
                    </span>
                  );
                }

                return (
                  <td key={j} className={`px-4 py-3 ${col.className || ''}`}>
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
