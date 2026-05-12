export const formatRevenue = (value: number) => `$${value.toFixed(1)}B`;

export const formatPercent = (value: number, total: number) => {
  if (total === 0) {
    return '0.0%';
  }

  return `${((value / total) * 100).toFixed(1)}%`;
};
