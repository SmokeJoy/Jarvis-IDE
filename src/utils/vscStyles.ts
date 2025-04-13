export const hexToRGB = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return { r: 0, g: 0, b: 0 }; // Fallback al nero
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return { r: 0, g: 0, b: 0 }; // Fallback al nero
  }

  return { r, g, b };
};

// ... existing code ...
