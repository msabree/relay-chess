export const isUnique = (arr: string[]) => {
  return arr.length === new Set(arr).size;
};
