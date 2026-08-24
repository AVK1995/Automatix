/**
 * Utility to convert array of objects/rows to CSV and trigger browser download
 * @param {string} filename - e.g. "urgent_actions_2026-08-24.csv"
 * @param {Array<{ key: string, label: string }>} columns - Column definitions
 * @param {Array<object>} data - Row objects
 */
export function exportToCsv(filename, columns, data) {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      str = str.replace(/"/g, '""');
    }
    return `"${str}"`;
  };

  const headerRow = columns.map(c => escapeCsv(c.label)).join(',');
  const bodyRows = data.map(row => {
    return columns.map(c => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.key];
      return escapeCsv(val);
    }).join(',');
  });

  const csvContent = [headerRow, ...bodyRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
