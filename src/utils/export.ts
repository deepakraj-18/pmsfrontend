export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T | string, header: string }[]
) {
    if (!data || !data.length) {
        return;
    }

    let headers: string[] = [];
    let keys: (keyof T | string)[] = [];

    if (columns && columns.length > 0) {
        headers = columns.map(col => col.header);
        keys = columns.map(col => col.key);
    } else {
        keys = Object.keys(data[0]);
        headers = keys as string[];
    }

    const csvRows = [];

    csvRows.push(headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(','));

    for (const row of data) {
        const values = keys.map(key => {
            const keyString = String(key);
            let val = row[keyString];

            if (keyString.includes('.') && !val) {
                const parts = keyString.split('.');
                val = row;
                for (const part of parts) {
                    if (val) val = val[part];
                    else break;
                }
            }

            const escaped = String(val !== null && val !== undefined ? val : '').replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
