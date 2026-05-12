export type RevenueLine = {
  name: string;
  revenue: number;
};

export type Segment = RevenueLine & {
  color: string;
  children: RevenueLine[];
};

export type QuarterData = {
  totalRevenue: number;
  segments: Segment[];
};

export type Company = {
  id: string;
  name: string;
  ticker: string;
  accentColor: string;
  quarters: Record<string, QuarterData>;
};

type ChildTemplate = {
  name: string;
  share: number;
};

type SegmentTemplate = {
  name: string;
  share: number;
  color: string;
  children: ChildTemplate[];
};

export const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'] as const;

const roundB = (value: number) => Math.round(value * 10) / 10;

const buildChildren = (segmentRevenue: number, children: ChildTemplate[]) => {
  const lines = children.map((child) => ({
    name: child.name,
    revenue: roundB(segmentRevenue * child.share),
  }));

  const delta = roundB(segmentRevenue - lines.reduce((sum, child) => sum + child.revenue, 0));
  if (lines.length > 0 && Math.abs(delta) >= 0.1) {
    lines[lines.length - 1].revenue = roundB(lines[lines.length - 1].revenue + delta);
  }

  return lines;
};

const buildQuarter = (totalRevenue: number, segments: SegmentTemplate[]): QuarterData => {
  const builtSegments = segments.map((segment) => {
    const revenue = roundB(totalRevenue * segment.share);
    return {
      name: segment.name,
      revenue,
      color: segment.color,
      children: buildChildren(revenue, segment.children),
    };
  });

  const delta = roundB(
    totalRevenue - builtSegments.reduce((sum, segment) => sum + segment.revenue, 0),
  );
  if (builtSegments.length > 0 && Math.abs(delta) >= 0.1) {
    const lastSegment = builtSegments[builtSegments.length - 1];
    lastSegment.revenue = roundB(lastSegment.revenue + delta);
    lastSegment.children = buildChildren(
      lastSegment.revenue,
      segments[segments.length - 1].children,
    );
  }

  return {
    totalRevenue: roundB(builtSegments.reduce((sum, segment) => sum + segment.revenue, 0)),
    segments: builtSegments,
  };
};

// Mock quarterly totals and segment shares are intentionally centralized here.
// Replace these templates with SEC/company filing data later without touching the UI.
const buildCompany = (
  id: string,
  name: string,
  ticker: string,
  accentColor: string,
  quarterlyTotals: number[],
  segments: SegmentTemplate[],
): Company => ({
  id,
  name,
  ticker,
  accentColor,
  quarters: Object.fromEntries(
    quarters.map((quarter, index) => [quarter, buildQuarter(quarterlyTotals[index], segments)]),
  ),
});

const appleSegments: SegmentTemplate[] = [
  {
    name: 'iPhone',
    share: 0.49,
    color: '#6b7280',
    children: [
      { name: 'iPhone Pro', share: 0.46 },
      { name: 'iPhone Standard', share: 0.35 },
      { name: 'Carrier and channel incentives', share: 0.19 },
    ],
  },
  {
    name: 'Mac',
    share: 0.09,
    color: '#8b5cf6',
    children: [
      { name: 'MacBook Pro', share: 0.43 },
      { name: 'MacBook Air', share: 0.39 },
      { name: 'Desktop Mac', share: 0.18 },
    ],
  },
  {
    name: 'iPad',
    share: 0.07,
    color: '#0ea5e9',
    children: [
      { name: 'iPad Pro', share: 0.37 },
      { name: 'iPad Air', share: 0.33 },
      { name: 'iPad and Mini', share: 0.3 },
    ],
  },
  {
    name: 'Wearables, Home, and Accessories',
    share: 0.1,
    color: '#14b8a6',
    children: [
      { name: 'Apple Watch', share: 0.42 },
      { name: 'AirPods', share: 0.38 },
      { name: 'Home and accessories', share: 0.2 },
    ],
  },
  {
    name: 'Services',
    share: 0.25,
    color: '#f59e0b',
    children: [
      { name: 'App Store', share: 0.32 },
      { name: 'Subscriptions', share: 0.29 },
      { name: 'Licensing and payments', share: 0.23 },
      { name: 'AppleCare and cloud', share: 0.16 },
    ],
  },
];

const microsoftSegments: SegmentTemplate[] = [
  {
    name: 'Productivity and Business Processes',
    share: 0.37,
    color: '#2563eb',
    children: [
      { name: 'Office Commercial', share: 0.43 },
      { name: 'LinkedIn', share: 0.2 },
      { name: 'Dynamics', share: 0.16 },
      { name: 'Office Consumer', share: 0.21 },
    ],
  },
  {
    name: 'Intelligent Cloud',
    share: 0.39,
    color: '#06b6d4',
    children: [
      { name: 'Azure and cloud services', share: 0.68 },
      { name: 'Server products', share: 0.23 },
      { name: 'Enterprise services', share: 0.09 },
    ],
  },
  {
    name: 'More Personal Computing',
    share: 0.24,
    color: '#22c55e',
    children: [
      { name: 'Windows', share: 0.31 },
      { name: 'Gaming', share: 0.3 },
      { name: 'Search and news ads', share: 0.22 },
      { name: 'Devices', share: 0.17 },
    ],
  },
];

const alphabetSegments: SegmentTemplate[] = [
  {
    name: 'Google Search',
    share: 0.56,
    color: '#2563eb',
    children: [
      { name: 'Retail and commerce', share: 0.32 },
      { name: 'Travel and local', share: 0.24 },
      { name: 'Finance and services', share: 0.21 },
      { name: 'Other search ads', share: 0.23 },
    ],
  },
  {
    name: 'YouTube Ads',
    share: 0.11,
    color: '#ef4444',
    children: [
      { name: 'Brand campaigns', share: 0.42 },
      { name: 'Performance ads', share: 0.39 },
      { name: 'Shorts monetization', share: 0.19 },
    ],
  },
  {
    name: 'Google Network',
    share: 0.08,
    color: '#f59e0b',
    children: [
      { name: 'AdSense', share: 0.46 },
      { name: 'AdMob', share: 0.31 },
      { name: 'Publisher platforms', share: 0.23 },
    ],
  },
  {
    name: 'Google Cloud',
    share: 0.14,
    color: '#22c55e',
    children: [
      { name: 'GCP', share: 0.58 },
      { name: 'Workspace', share: 0.3 },
      { name: 'Cloud security and AI', share: 0.12 },
    ],
  },
  {
    name: 'Other Bets',
    share: 0.11,
    color: '#8b5cf6',
    children: [
      { name: 'Waymo', share: 0.34 },
      { name: 'Verily', share: 0.28 },
      { name: 'Other investments', share: 0.38 },
    ],
  },
];

const amazonSegments: SegmentTemplate[] = [
  {
    name: 'North America',
    share: 0.48,
    color: '#f97316',
    children: [
      { name: 'Online stores', share: 0.43 },
      { name: 'Third-party seller services', share: 0.27 },
      { name: 'Physical stores', share: 0.1 },
      { name: 'Other commerce', share: 0.2 },
    ],
  },
  {
    name: 'International',
    share: 0.21,
    color: '#06b6d4',
    children: [
      { name: 'Europe', share: 0.44 },
      { name: 'Asia Pacific', share: 0.33 },
      { name: 'Rest of world', share: 0.23 },
    ],
  },
  {
    name: 'AWS',
    share: 0.17,
    color: '#2563eb',
    children: [
      { name: 'Compute', share: 0.37 },
      { name: 'Storage and database', share: 0.33 },
      { name: 'AI and analytics', share: 0.3 },
    ],
  },
  {
    name: 'Advertising',
    share: 0.08,
    color: '#8b5cf6',
    children: [
      { name: 'Sponsored products', share: 0.54 },
      { name: 'Display and video', share: 0.31 },
      { name: 'Measurement services', share: 0.15 },
    ],
  },
  {
    name: 'Subscriptions',
    share: 0.06,
    color: '#22c55e',
    children: [
      { name: 'Prime memberships', share: 0.68 },
      { name: 'Digital media', share: 0.21 },
      { name: 'Other subscriptions', share: 0.11 },
    ],
  },
];

const metaSegments: SegmentTemplate[] = [
  {
    name: 'Family of Apps',
    share: 0.97,
    color: '#2563eb',
    children: [
      { name: 'Facebook', share: 0.33 },
      { name: 'Instagram', share: 0.39 },
      { name: 'WhatsApp and Messenger', share: 0.14 },
      { name: 'Other ad products', share: 0.14 },
    ],
  },
  {
    name: 'Reality Labs',
    share: 0.03,
    color: '#8b5cf6',
    children: [
      { name: 'Quest hardware', share: 0.54 },
      { name: 'Horizon software', share: 0.25 },
      { name: 'Other Reality Labs', share: 0.21 },
    ],
  },
];

const nvidiaSegments: SegmentTemplate[] = [
  {
    name: 'Data Center',
    share: 0.79,
    color: '#16a34a',
    children: [
      { name: 'AI accelerators', share: 0.61 },
      { name: 'Networking', share: 0.21 },
      { name: 'Cloud and enterprise software', share: 0.18 },
    ],
  },
  {
    name: 'Gaming',
    share: 0.11,
    color: '#f59e0b',
    children: [
      { name: 'GeForce GPUs', share: 0.65 },
      { name: 'Gaming laptops', share: 0.22 },
      { name: 'Game streaming', share: 0.13 },
    ],
  },
  {
    name: 'Professional Visualization',
    share: 0.03,
    color: '#06b6d4',
    children: [
      { name: 'Workstation GPUs', share: 0.61 },
      { name: 'Omniverse software', share: 0.39 },
    ],
  },
  {
    name: 'Automotive',
    share: 0.04,
    color: '#8b5cf6',
    children: [
      { name: 'Drive platforms', share: 0.72 },
      { name: 'Infotainment', share: 0.28 },
    ],
  },
  {
    name: 'OEM and Other',
    share: 0.03,
    color: '#64748b',
    children: [
      { name: 'OEM boards', share: 0.58 },
      { name: 'Other revenue', share: 0.42 },
    ],
  },
];

const teslaSegments: SegmentTemplate[] = [
  {
    name: 'Automotive',
    share: 0.78,
    color: '#ef4444',
    children: [
      { name: 'Model 3/Y', share: 0.63 },
      { name: 'Model S/X and Cybertruck', share: 0.18 },
      { name: 'Leasing and credits', share: 0.19 },
    ],
  },
  {
    name: 'Energy Generation and Storage',
    share: 0.11,
    color: '#f59e0b',
    children: [
      { name: 'Megapack', share: 0.56 },
      { name: 'Powerwall', share: 0.28 },
      { name: 'Solar', share: 0.16 },
    ],
  },
  {
    name: 'Services and Other',
    share: 0.11,
    color: '#06b6d4',
    children: [
      { name: 'Paid charging', share: 0.35 },
      { name: 'Service centers', share: 0.33 },
      { name: 'Used vehicles and other', share: 0.32 },
    ],
  },
];

const netflixSegments: SegmentTemplate[] = [
  {
    name: 'UCAN',
    share: 0.45,
    color: '#ef4444',
    children: [
      { name: 'Standard plans', share: 0.45 },
      { name: 'Premium plans', share: 0.35 },
      { name: 'Ads plan', share: 0.2 },
    ],
  },
  {
    name: 'EMEA',
    share: 0.31,
    color: '#8b5cf6',
    children: [
      { name: 'Western Europe', share: 0.47 },
      { name: 'Nordics and UK', share: 0.26 },
      { name: 'Middle East and Africa', share: 0.27 },
    ],
  },
  {
    name: 'LATAM',
    share: 0.12,
    color: '#f59e0b',
    children: [
      { name: 'Brazil', share: 0.39 },
      { name: 'Mexico', share: 0.31 },
      { name: 'Rest of LATAM', share: 0.3 },
    ],
  },
  {
    name: 'APAC',
    share: 0.12,
    color: '#06b6d4',
    children: [
      { name: 'Japan and Korea', share: 0.38 },
      { name: 'India', share: 0.24 },
      { name: 'Rest of APAC', share: 0.38 },
    ],
  },
];

const adobeSegments: SegmentTemplate[] = [
  {
    name: 'Digital Media',
    share: 0.44,
    color: '#ef4444',
    children: [
      { name: 'Creative platform', share: 0.68 },
      { name: 'Document Cloud', share: 0.32 },
    ],
  },
  {
    name: 'Creative',
    share: 0.21,
    color: '#8b5cf6',
    children: [
      { name: 'Creative Cloud subscriptions', share: 0.74 },
      { name: 'Stock and marketplace', share: 0.16 },
      { name: 'Enterprise creative', share: 0.1 },
    ],
  },
  {
    name: 'Document Cloud',
    share: 0.13,
    color: '#06b6d4',
    children: [
      { name: 'Acrobat subscriptions', share: 0.56 },
      { name: 'PDF services', share: 0.28 },
      { name: 'Sign', share: 0.16 },
    ],
  },
  {
    name: 'Digital Experience',
    share: 0.22,
    color: '#f59e0b',
    children: [
      { name: 'Experience Cloud', share: 0.58 },
      { name: 'Analytics and Journey Optimizer', share: 0.27 },
      { name: 'Commerce and Marketo', share: 0.15 },
    ],
  },
];

const salesforceSegments: SegmentTemplate[] = [
  {
    name: 'Subscription and Support',
    share: 0.94,
    color: '#0ea5e9',
    children: [
      { name: 'Sales Cloud', share: 0.22 },
      { name: 'Service Cloud', share: 0.24 },
      { name: 'Platform and Other', share: 0.28 },
      { name: 'Data Cloud and Marketing', share: 0.26 },
    ],
  },
  {
    name: 'Professional Services',
    share: 0.06,
    color: '#64748b',
    children: [
      { name: 'Implementation services', share: 0.61 },
      { name: 'Training and advisory', share: 0.39 },
    ],
  },
];

export const earningsData: Company[] = [
  buildCompany('apple', 'Apple', 'AAPL', '#111827', [95.8, 101.4, 108.6, 122.2], appleSegments),
  buildCompany('microsoft', 'Microsoft', 'MSFT', '#2563eb', [61.9, 64.7, 67.8, 70.1], microsoftSegments),
  buildCompany('alphabet', 'Alphabet', 'GOOGL', '#4285f4', [80.5, 84.2, 88.1, 92.6], alphabetSegments),
  buildCompany('amazon', 'Amazon', 'AMZN', '#ff9900', [143.3, 148.0, 154.7, 169.8], amazonSegments),
  buildCompany('meta', 'Meta', 'META', '#2563eb', [36.5, 39.1, 41.9, 45.2], metaSegments),
  buildCompany('nvidia', 'Nvidia', 'NVDA', '#76b900', [26.0, 28.4, 31.2, 34.6], nvidiaSegments),
  buildCompany('tesla', 'Tesla', 'TSLA', '#ef4444', [21.3, 23.0, 24.7, 26.4], teslaSegments),
  buildCompany('netflix', 'Netflix', 'NFLX', '#e50914', [9.4, 9.8, 10.2, 10.9], netflixSegments),
  buildCompany('adobe', 'Adobe', 'ADBE', '#ef4444', [5.2, 5.4, 5.7, 6.0], adobeSegments),
  buildCompany('salesforce', 'Salesforce', 'CRM', '#0ea5e9', [9.1, 9.5, 9.9, 10.4], salesforceSegments),
];
