
export function statusStr(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.toLowerCase();
  if (typeof value === 'object') {
    const name = value.name ?? value.label ?? '';
    return String(name).toLowerCase();
  }
  return String(value || '').toLowerCase();
}


export function statusName(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value.name ?? value.label ?? '';
  return '';
}
