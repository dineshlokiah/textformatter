export function deepSortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(deepSortKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc: any, k) => {
      acc[k] = deepSortKeys(obj[k]);
      return acc;
    }, {});
  }
  return obj;
}
