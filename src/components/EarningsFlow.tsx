import type { Company, QuarterData } from '../data/earningsData';
import { FlowNode } from './FlowNode';
import type { ValueMode } from '../types';

type EarningsFlowProps = {
  company: Company;
  quarterData: QuarterData;
  selectedSegmentName: string;
  valueMode: ValueMode;
  onSelectSegment: (segmentName: string) => void;
};

const chartWidth = 980;
const nodeWidth = 220;
const leftX = 34;
const middleX = 372;
const rightX = 724;
const topPadding = 78;
const verticalGap = 18;

const curvePath = (startX: number, startY: number, endX: number, endY: number) => {
  const bend = Math.max(140, (endX - startX) * 0.52);
  return `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`;
};

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

  const segmentHeight = 138;
  const childHeight = 116;
  const segmentBlockHeight =
    quarterData.segments.length * segmentHeight + (quarterData.segments.length - 1) * verticalGap;
  const childBlockHeight =
    selectedSegment.children.length * childHeight +
    (selectedSegment.children.length - 1) * verticalGap;
  const chartHeight = Math.max(580, Math.max(segmentBlockHeight, childBlockHeight) + 160);
  const centerY = chartHeight / 2 - 48;
  const segmentStartY = topPadding + (chartHeight - 160 - segmentBlockHeight) / 2;
  const childStartY = topPadding + (chartHeight - 160 - childBlockHeight) / 2;

  const segmentNodes = quarterData.segments.map((segment, index) => ({
    ...segment,
    x: middleX,
    y: segmentStartY + index * (segmentHeight + verticalGap),
    height: segmentHeight,
    isSelected: segment.name === selectedSegment.name,
  }));

  const childNodes = selectedSegment.children.map((child, index) => ({
    ...child,
    x: rightX,
    y: childStartY + index * (childHeight + verticalGap),
    height: childHeight,
  }));

  return (
    <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Revenue Flow
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {company.name} earnings breakdown
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
          className="relative mx-auto min-w-[980px]"
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
                <feDropShadow dx="0" dy="8" floodColor="#0f172a" floodOpacity="0.08" stdDeviation="9" />
              </filter>
            </defs>

            {[leftX, middleX, rightX].map((x) => (
              <rect
                key={x}
                fill="#f8fafc"
                height={chartHeight - 98}
                opacity="0.72"
                rx="8"
                stroke="#e2e8f0"
                strokeWidth="1"
                width={nodeWidth + 28}
                x={x - 14}
                y="64"
              />
            ))}

            <text x={leftX} y="42" className="fill-slate-400 text-xs font-bold uppercase tracking-wide">
              Company total
            </text>
            <text x={middleX} y="42" className="fill-slate-400 text-xs font-bold uppercase tracking-wide">
              Business segments
            </text>
            <text x={rightX} y="42" className="fill-slate-400 text-xs font-bold uppercase tracking-wide">
              Selected segment lines
            </text>

            {segmentNodes.map((segment) => {
              const strokeWidth = Math.max(
                10,
                Math.min(58, (segment.revenue / quarterData.totalRevenue) * 92),
              );
              const path = curvePath(
                leftX + nodeWidth,
                centerY + 54,
                middleX,
                segment.y + segment.height / 2,
              );

              return (
                <path
                  key={segment.name}
                  d={path}
                  fill="none"
                  filter={segment.isSelected ? 'url(#flowShadow)' : undefined}
                  opacity={segment.isSelected ? 0.52 : 0.18}
                  stroke={segment.color}
                  strokeLinecap="round"
                  strokeWidth={strokeWidth}
                />
              );
            })}

            {childNodes.map((child) => {
              const strokeWidth = Math.max(
                8,
                Math.min(42, (child.revenue / selectedSegment.revenue) * 54),
              );
              const path = curvePath(
                middleX + nodeWidth,
                (segmentNodes.find((segment) => segment.name === selectedSegment.name)?.y ?? 0) +
                  segmentHeight / 2,
                rightX,
                child.y + child.height / 2,
              );

              return (
                <path
                  key={child.name}
                  d={path}
                  fill="none"
                  filter="url(#flowShadow)"
                  opacity={0.34}
                  stroke={selectedSegment.color}
                  strokeLinecap="round"
                  strokeWidth={strokeWidth}
                />
              );
            })}
          </svg>

          <FlowNode
            color={company.accentColor}
            name="Total company revenue"
            revenue={quarterData.totalRevenue}
            totalRevenue={quarterData.totalRevenue}
            valueMode={valueMode}
            height={110}
            width={nodeWidth}
            x={leftX}
            y={centerY}
          />

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

          {childNodes.map((child) => (
            <FlowNode
              key={child.name}
              color={selectedSegment.color}
              name={child.name}
              revenue={child.revenue}
              totalRevenue={quarterData.totalRevenue}
              valueMode={valueMode}
              height={child.height}
              width={nodeWidth}
              x={child.x}
              y={child.y}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
