// SCALE 3D to REAL WORLD 1 = 0.5m
export const convertValue = (value: number | string) => {
  const inputValue = typeof value === "string" ? parseFloat(value) : value;
  return inputValue * 0.5;
};
