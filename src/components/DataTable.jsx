import { SYSTEM_STATUS } from '@/constants';

export default function DataTable({ data, columns }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full border border-border-subtle rounded-sm bg-card p-8 text-center text-sm text-text-secondary">
        No records found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-border-subtle rounded-sm bg-card">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-background border-b border-border-subtle text-text-secondary">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 font-medium tracking-wide">
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
                  const isSuccess = cellValue === SYSTEM_STATUS.COMPLETED || cellValue === SYSTEM_STATUS.ACTIVE;
                  const isFail = cellValue === SYSTEM_STATUS.FAILED || cellValue === SYSTEM_STATUS.CANCELLED;
                  displayValue = (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${
                      isSuccess ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' : 
                      isFail ? 'bg-red-400/10 text-red-400 border-red-400/20' : 
                      'bg-border-subtle text-text-secondary border-border-subtle'
                    }`}>
                      {cellValue}
                    </span>
                  );
                }

                return (
                  <td key={j} className="px-4 py-3">
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
