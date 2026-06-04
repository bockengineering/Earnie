import type { Company, FinancialLine, QuarterData, Segment } from '../data/earningsData';
import { FlowNode } from './FlowNode';
import type { ValueMode } from '../types';

type EarningsFlowProps = {
  company: Company;
  quarterData: QuarterData;
  selectedSegmentName: string;
  valueMode: ValueMode;
  onSelectSegment: (segmentName: string) => void;
};

type PositionedNode<T> = T & {
  x: number;
  y: number;
  height: number;
};

const chartWidth = 1260;
const nodeWidth = 190;
const segmentX = 32;
const revenueX = 286;
const marginX = 534;
const incomeX = 782;
const expenseX = 1032;
const topPadding = 78;
const verticalGap = 14;

const flowColors = {
  grossProfit: '#2dd4bf',
  costOfRevenue: '#eab65f',
  earnings: '#14b8a6',
  expenses: '#b98b4c',
};

const curvePath = (startX: number, startY: number, endX: number, endY: number) => {
  const bend = Math.max(110, (endX - startX) * 0.56);
  return `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`;
};

const stackHeight = (count: number, nodeHeight: number) =>
  count * nodeHeight + Math.max(0, count - 1) * verticalGap;

const stackStartY = (chartHeight: number, blockHeight: number) =>
  topPadding + (chartHeight - 146 - blockHeight) / 2;

const bandWidth = (value: number, total: number, max = 58, min = 7) =>
  Math.max(min, Math.min(max, (value / total) * 86));

export function EarningsFlow({
  company,
  quarterData,
  selectedSegmentName,
  valueMode,
  onSelectSegment,
}: EarningsFlowProps) {
  const selectedSegment =
    quarterData.segments.find((segment) => segment.name === selectedSegmentName) ??
    quarterData.segments[0];
  const { financials } = quarterData;

  const segmentHeight = quarterData.segments.length > 4 ? 96 : 112;
  const expenseLineHeight = 86;
  const statementNodeHeight = 108;
  const segmentBlockHeight = stackHeight(quarterData.segments.length, segmentHeight);
  const expenseBlockHeight = stackHeight(financials.expenseLines.length, expenseLineHeight);
  const chartHeight = Math.max(660, Math.max(segmentBlockHeight, expenseBlockHeight) + 178);
  const centerY = chartHeight / 2 - 44;
  const segmentStartY = stackStartY(chartHeight, segmentBlockHeight);
  const expenseStartY = stackStartY(chartHeight, expenseBlockHeight);

  const segmentNodes: Array<PositionedNode<Segment> & { isSelected: boolean }> =
    quarterData.segments.map((segment, index) => ({
      ...segment,
      x: segmentX,
      y: segmentStartY + index * (segmentHeight + verticalGap),
      height: segmentHeight,
      isSelected: segment.name === selectedSegment.name,
    }));

  const revenueNode = {
    name: 'Revenue',
    amount: quarterData.totalRevenue,
    color: company.accentColor,
    x: revenueX,
    y: centerY,
    height: statementNodeHeight,
  };

  const grossProfitNode = {
    name: 'Gross profit',
    amount: financials.grossProfit,
    color: flowColors.grossProfit,
    x: marginX,
    y: centerY - 122,
    height: statementNodeHeight,
  };

  const costOfRevenueNode = {
    name: 'Cost of revenue',
    amount: financials.costOfRevenue,
    color: flowColors.costOfRevenue,
    x: marginX,
    y: centerY + 58,
    height: statementNodeHeight,
  };

  const earningsNode = {
    name: 'Earnings',
    amount: financials.earnings,
    color: flowColors.earnings,
    x: incomeX,
    y: centerY - 138,
    height: statementNodeHeight,
  };

  const expensesNode = {
    name: 'Expenses',
    amount: financials.expenses,
    color: flowColors.expenses,
    x: incomeX,
    y: centerY + 42,
    height: statementNodeHeight,
  };

  const expenseLineNodes: Array<PositionedNode<FinancialLine>> = financials.expenseLines.map(
    (line, index) => ({
      ...line,
      x: expenseX,
      y: expenseStartY + index * (expenseLineHeight + verticalGap),
      height: expenseLineHeight,
    }),
  );

  return (
    <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Revenue and Expense Flow
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {company.name} income bridge
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-[8px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
          <span
            className="block size-2 rounded-full"
            style={{ backgroundColor: selectedSegment.color }}
          />
          {selectedSegment.name}
        </div>
      </div>

      <div className="overflow-x-auto px-2 pb-2">
        <div
          className="relative mx-auto min-w-[1260px]"
          style={{ width: chartWidth, height: chartHeight }}
        >
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            width={chartWidth}
          >
            <defs>
              <filter id="flowShadow" colorInterpolationFilters="sRGB">
                <feDropShadow
                  dx="0"
                  dy="8"
                  floodColor="#0f172a"
                  floodOpacity="0.08"
                  stdDeviation="9"
                />
              </filter>
            </defs>

            {[segmentX, revenueX, marginX, incomeX, expenseX].map((x) => (
              <rect
                key={x}
                fill="#f8fafc"
                height={chartHeight - 98}
                opacity="0.7"
                rx="8"
                stroke="#e2e8f0"
                strokeWidth="1"
                width={nodeWidth + 22}
                x={x - 11}
                y="64"
              />
            ))}

            <text x={segmentX} y="42" className="fill-slate-400 text-xs font-bold uppercase tracking-wide">
              Business segments
            </text>
            <text x={revenueX} y="42" className="fill-slate-400 text-xs font-bold uppercase tracking-wide">
              Revenue
            </text>
            <text x={marginX} y="42" className="fill-slate-400 text-xs font-bold uppercase tracking-wide">
              Gross margin
            </text>
            <text x={incomeX} y="42" className="fill-slate-400 text-xs font-bold uppercase tracking-wide">
              Earnings bridge
            </text>
            <text x={expenseX} y="42" className="fill-slate-400 text-xs font-bold uppercase tracking-wide">
              Expense lines
            </text>

            {segmentNodes.map((segment) => (
              <path
                key={segment.name}
                d={curvePath(
                  segment.x + nodeWidth,
                  segment.y + segment.height / 2,
                  revenueNode.x,
                  revenueNode.y + revenueNode.height / 2,
                )}
                fill="none"
                filter={segment.isSelected ? 'url(#flowShadow)' : undefined}
                opacity={segment.isSelected ? 0.56 : 0.2}
                stroke={segment.color}
                strokeLinecap="round"
                strokeWidth={bandWidth(segment.revenue, quarterData.totalRevenue, 54)}
              />
            ))}

            <path
              d={curvePath(
                revenueNode.x + nodeWidth,
                revenueNode.y + 42,
                grossProfitNode.x,
                grossProfitNode.y + grossProfitNode.height / 2,
              )}
              fill="none"
              filter="url(#flowShadow)"
              opacity="0.44"
              stroke={flowColors.grossProfit}
              strokeLinecap="round"
              strokeWidth={bandWidth(financials.grossProfit, quarterData.totalRevenue, 66)}
            />
            <path
              d={curvePath(
                revenueNode.x + nodeWidth,
                revenueNode.y + 70,
                costOfRevenueNode.x,
                costOfRevenueNode.y + costOfRevenueNode.height / 2,
              )}
              fill="none"
              opacity="0.42"
              stroke={flowColors.costOfRevenue}
              strokeLinecap="round"
              strokeWidth={bandWidth(financials.costOfRevenue, quarterData.totalRevenue, 66)}
            />
            <path
              d={curvePath(
                grossProfitNode.x + nodeWidth,
                grossProfitNode.y + grossProfitNode.height / 2,
                earningsNode.x,
                earningsNode.y + earningsNode.height / 2,
              )}
              fill="none"
              filter="url(#flowShadow)"
              opacity="0.5"
              stroke={flowColors.earnings}
              strokeLinecap="round"
              strokeWidth={bandWidth(financials.earnings, quarterData.totalRevenue, 56)}
            />
            <path
              d={curvePath(
                grossProfitNode.x + nodeWidth,
                grossProfitNode.y + grossProfitNode.height / 2,
                expensesNode.x,
                expensesNode.y + expensesNode.height / 2,
              )}
              fill="none"
              opacity="0.42"
              stroke={flowColors.expenses}
              strokeLinecap="round"
              strokeWidth={bandWidth(financials.expenses, quarterData.totalRevenue, 58)}
            />

            {expenseLineNodes.map((line) => (
              <path
                key={line.name}
                d={curvePath(
                  expensesNode.x + nodeWidth,
                  expensesNode.y + expensesNode.height / 2,
                  line.x,
                  line.y + line.height / 2,
                )}
                fill="none"
                opacity="0.34"
                stroke={line.color}
                strokeLinecap="round"
                strokeWidth={bandWidth(line.amount, quarterData.totalRevenue, 36, 5)}
              />
            ))}
          </svg>

          {segmentNodes.map((segment) => (
            <FlowNode
              key={segment.name}
              color={segment.color}
              isInteractive
              isSelected={segment.isSelected}
              name={segment.name}
              revenue={segment.revenue}
              totalRevenue={quarterData.totalRevenue}
              valueMode={valueMode}
              height={segment.height}
              width={nodeWidth}
              x={segment.x}
              y={segment.y}
              onClick={() => onSelectSegment(segment.name)}
            />
          ))}

          <FlowNode
            color={revenueNode.color}
            name={revenueNode.name}
            revenue={revenueNode.amount}
            totalRevenue={quarterData.totalRevenue}
            valueMode={valueMode}
            height={revenueNode.height}
            width={nodeWidth}
            x={revenueNode.x}
            y={revenueNode.y}
          />

          {[grossProfitNode, costOfRevenueNode, earningsNode, expensesNode].map((node) => (
            <FlowNode
              key={node.name}
              color={node.color}
              name={node.name}
              revenue={node.amount}
              totalRevenue={quarterData.totalRevenue}
              valueMode={valueMode}
              height={node.height}
              width={nodeWidth}
              x={node.x}
              y={node.y}
            />
          ))}

          {expenseLineNodes.map((line) => (
            <FlowNode
              key={line.name}
              color={line.color}
              name={line.name}
              revenue={line.amount}
              totalRevenue={quarterData.totalRevenue}
              valueMode={valueMode}
              height={line.height}
              width={nodeWidth}
              x={line.x}
              y={line.y}
            />
          ))}

        </div>
      </div>
    </section>
  );
}
