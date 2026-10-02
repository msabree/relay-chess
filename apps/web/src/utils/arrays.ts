export const isUnique = (arr: string[]) => {
  return arr.length === new Set(arr).size;
};

export const uniqueBy = (arr: any[], key: string) => {
  const seen = new Set();
  return arr.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};