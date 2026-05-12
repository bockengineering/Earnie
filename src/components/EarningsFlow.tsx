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

const chartWidth = 940;
const nodeWidth = 214;
const leftX = 32;
const middleX = 356;
const rightX = 694;
const topPadding = 82;
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
    <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Revenue flow
          </p>
          <h2 className="text-2xl font-bold text-slate-950">
            {company.name} earnings breakdown
          </h2>
        </div>
        <div className="rounded-[8px] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          Click any middle segment to explore its revenue lines
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width: chartWidth, height: chartHeight }}>
          <svg
            aria-hidden="true"
            className="absolute inset-0"
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            width={chartWidth}
          >
            <defs>
              <filter id="flowShadow" colorInterpolationFilters="sRGB">
                <feDropShadow dx="0" dy="8" floodColor="#0f172a" floodOpacity="0.08" stdDeviation="9" />
              </filter>
            </defs>

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
