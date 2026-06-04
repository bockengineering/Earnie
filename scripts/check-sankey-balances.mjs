import { createServer } from 'vite';

const tolerance = 0.11;

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'error',
});

try {
  const { earningsData, quarters } = await server.ssrLoadModule('/src/data/earningsData.ts');
  const errors = [];

  for (const company of earningsData) {
    for (const quarter of quarters) {
      const quarterData = company.quarters[quarter];
      const segmentSum = quarterData.segments.reduce(
        (sum, segment) => sum + segment.revenue,
        0,
      );
      const expenseLineSum = quarterData.financials.expenseLines.reduce(
        (sum, line) => sum + line.amount,
        0,
      );
      const checks = [
        ['segments', segmentSum, quarterData.totalRevenue],
        [
          'gross bridge',
          quarterData.financials.grossProfit + quarterData.financials.costOfRevenue,
          quarterData.totalRevenue,
        ],
        [
          'income bridge',
          quarterData.financials.earnings + quarterData.financials.expenses,
          quarterData.financials.grossProfit,
        ],
        ['expense lines', expenseLineSum, quarterData.financials.expenses],
      ];

      for (const segment of quarterData.segments) {
        const childSum = segment.children.reduce((sum, child) => sum + child.revenue, 0);
        checks.push([`${segment.name} child lines`, childSum, segment.revenue]);
      }

      for (const [label, actual, expected] of checks) {
        if (Math.abs(actual - expected) > tolerance) {
          errors.push(
            `${company.id} ${quarter} ${label}: ${actual.toFixed(2)} != ${expected.toFixed(2)}`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${earningsData.length * quarters.length} company-quarter Sankey balances.`);
  }
} finally {
  await server.close();
}
