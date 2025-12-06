import React, { useCallback, useRef } from "react";
import Link from "next/link";
import styles from "./OneOnOneDashboard.module.css";
import { detectionEvent } from "../data/reportData";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

type NavItem = {
  label: string;
  abbr: string;
  href: string;
  key: "overview" | "prompts";
};

type ResultRow = {
  id: number;
  partner: {
    name: string;
    role: string;
    initials: string;
  };
  content: string;
  contentType: string;
  author: {
    initials: string;
    variant: "teal" | "pink";
  };
  date: string;
};

type FilterField = {
  label: string;
  placeholder: string;
  icon: "search" | "filter" | "calendar";
};

type ChartCard = {
  title: string;
  value: string;
  detail: string;
  percent: number;
  accent: string;
};

export const navItems: NavItem[] = [
  { label: "Overview", abbr: "O", href: "/", key: "overview" },
  { label: "Prompts Monitoring", abbr: "OD", href: "/prompts-monitoring", key: "prompts" },
];

const filterFields: FilterField[] = [
  { label: "People", placeholder: "Search for a person", icon: "search" },
  { label: "Content type", placeholder: "Select a content type", icon: "filter" },
  { label: "Start date", placeholder: "Start date", icon: "calendar" },
  { label: "End date", placeholder: "End date", icon: "calendar" },
];

const results: ResultRow[] = [
  {
    id: 1,
    partner: { name: "John Smith", role: "Product Designer", initials: "JS" },
    content: "How did you feel at work since your last Check-in?",
    contentType: "Talking point",
    author: { initials: "JD", variant: "pink" },
    date: "Not scheduled",
  },
  {
    id: 2,
    partner: { name: "John Smith", role: "Product Designer", initials: "JS" },
    content: "How did you feel at work since your last Check-in?",
    contentType: "Talking point",
    author: { initials: "JD", variant: "pink" },
    date: "11 Dec 2023",
  },
  {
    id: 3,
    partner: { name: "John Smith", role: "Product Designer", initials: "JS" },
    content: "What are some of the challenges you foresee in the future?",
    contentType: "Talking point",
    author: { initials: "JS", variant: "teal" },
    date: "Not scheduled",
  },
  {
    id: 4,
    partner: { name: "John Smith", role: "Product Designer", initials: "JS" },
    content: "What are some of the challenges you foresee in the future?",
    contentType: "Talking point",
    author: { initials: "JS", variant: "teal" },
    date: "11 Dec 2023",
  },
];

const typeCounts = detectionEvent.findings.reduce<Record<string, number>>((acc, finding) => {
  acc[finding.type] = (acc[finding.type] ?? 0) + 1;
  return acc;
}, {});

const totalFindings = detectionEvent.findings.length;

const percent = (count: number) => (totalFindings ? Math.round((count / totalFindings) * 100) : 0);

const chartCards: ChartCard[] = [
  {
    title: "Email detections",
    value: `${percent(typeCounts.EMAIL ?? 0)}%`,
    detail: `${typeCounts.EMAIL ?? 0} of ${totalFindings} fragments`,
    percent: percent(typeCounts.EMAIL ?? 0),
    accent: "#a855f7",
  },
  {
    title: "Credit card detections",
    value: `${percent(typeCounts.CREDIT_CARD ?? 0)}%`,
    detail: `${typeCounts.CREDIT_CARD ?? 0} of ${totalFindings} fragments`,
    percent: percent(typeCounts.CREDIT_CARD ?? 0),
    accent: "#0ea5e9",
  },
  {
    title: "Blocked actions",
    value: detectionEvent.allowed ? "0%" : "100%",
    detail: `Last action ${detectionEvent.actionTaken}`,
    percent: detectionEvent.allowed ? 0 : 100,
    accent: "#ef4444",
  },
  {
    title: "Severity critical",
    value: detectionEvent.severity === "critical" ? "100%" : "0%",
    detail: `${detectionEvent.severity} alert`,
    percent: detectionEvent.severity === "critical" ? 100 : 0,
    accent: "#f97316",
  },
];

const overviewStats = [
  {
    label: "Total prompts processed",
    value: "128",
    change: "+12% vs last week",
  },
  {
    label: "Blocked prompts",
    value: "42",
    change: "33% of total",
  },
  {
    label: "Masked prompts",
    value: "61",
    change: "48% masked",
  },
];

const severityDistribution = [
  { label: "Critical", value: 40, color: "#ef4444" },
  { label: "High", value: 28, color: "#f97316" },
  { label: "Medium", value: 20, color: "#fbbf24" },
  { label: "Low", value: 12, color: "#34d399" },
];

const decisionBreakdown = [
  { label: "Blocked", value: 60, color: "#a855f7" },
  { label: "Allowed", value: 25, color: "#0ea5e9" },
  { label: "Escalated", value: 15, color: "#c084fc" },
];

const sensitivityTypes = [
  { label: "Email", value: 62 },
  { label: "Credit card", value: 28 },
  { label: "SSN", value: 15 },
  { label: "API key", value: 10 },
];

const volumeTrend = [12, 18, 20, 17, 23, 29, 26, 31];

const providerComparison = [
  { provider: "OpenAI", blocked: "18", allowed: "6" },
  { provider: "Anthropic", blocked: "11", allowed: "5" },
  { provider: "Google", blocked: "8", allowed: "4" },
];

const createConicGradient = (data: { value: number; color: string }[]) => {
  let start = 0;
  const segments: string[] = [];
  data.forEach((item) => {
    const end = start + item.value;
    segments.push(`${item.color} ${start}% ${end}%`);
    start = end;
  });
  return { background: `conic-gradient(${segments.join(", ")})` };
};

// const promptRows = [
//   {
//     id: 1,
//     user: "John Smith",
//     prompt: detectionEvent.redactedText,
//     severity: detectionEvent.severity,
//   },
//   {
//     id: 2,
//     user: "Alice Green",
//     prompt: "Share the monthly report to finance@example.com",
//     severity: "high",
//   },
//   {
//     id: 3,
//     user: "Marcus Lee",
//     prompt: "Send credentials to admin@example.com",
//     severity: "critical",
//   },
// ];

const iconMap: Record<FilterField["icon"], React.ReactNode> = {
  search: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16l-6 7v5l-4 2v-7z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  ),
};

export const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 5 1.5 6.5 1.5 6.5H5s1.5-1.5 1.5-6.5" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const GridIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="4" width="5" height="5" />
    <rect x="10.5" y="4" width="5" height="5" />
    <rect x="4" y="10.5" width="5" height="5" />
    <rect x="10.5" y="10.5" width="5" height="5" />
  </svg>
);

export const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.5-2-3.5-2.4 1a7.3 7.3 0 0 0-2-1.2l-.3-2.6h-4l-.3 2.6a7.3 7.3 0 0 0-2 1.2l-2.4-1-2 3.5 2.1 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2.1 1.5 2 3.5 2.4-1a7.3 7.3 0 0 0 2 1.2l.3 2.6h4l.3-2.6a7.3 7.3 0 0 0 2-1.2l2.4 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1.2z" />
  </svg>
);

export type DashboardSection = "overview" | "prompts";

interface OneOnOneDashboardProps {
  activeSection?: DashboardSection;
}

export const OneOnOneDashboard: React.FC<OneOnOneDashboardProps> = ({
  activeSection = "overview",
}) => {
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const exportOverview = useCallback(async () => {
    if (!overviewRef.current) return;
    const canvas = await html2canvas(overviewRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF("p", "mm", "a4");
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    doc.save("overview.pdf");
  }, []);
  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoBlock}>
            <img
              src="/logo.jpeg"
              alt="VantaPrompt logo"
              className={styles.logoImage}
            />
            <span className={styles.userName}>Prompt Sentinel</span>
          </div>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li
                key={item.label}
                className={`${styles.navItem} ${
                  item.key === activeSection ? styles.navItemActive : ""
                }`}
                aria-current={item.key === activeSection ? "page" : undefined}
              >
              <Link href={item.href} className={styles.navLink}>
                <span className={styles.navIcon}>{item.abbr}</span>
                <span>{item.label}</span>
              </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.sidebarFooter}>
        </div>
      </aside>
      <section className={styles.contentArea}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.pageTitle}>
              {activeSection === "overview" ? "Overview" : "Prompts Monitoring"}
            </h1>
            {/* <div className={styles.subNav}>
              <button
                type="button"
                className={`${styles.subNavButton} ${styles.subNavButtonActive}`}
              >
                My 1-on-1s
              </button>
              <button type="button" className={styles.subNavButton}>
                Search
              </button>
            </div> */}
          </div>
          <div className={styles.headerActions}>
            <div className={styles.headerIdentity}>
              <div className={styles.headerAvatar}>JD</div>
              <span className={styles.headerName}>Jane</span>
            </div>
            <button className={styles.iconButton} type="button" aria-label="Notifications">
              <BellIcon />
            </button>
            <button className={styles.iconButton} type="button" aria-label="Grid view">
              <GridIcon />
            </button>
            <button className={styles.iconButton} type="button" aria-label="Settings">
              <SettingsIcon />
            </button>
          </div>
        </header>

        {activeSection === "overview" ? (
          <section ref={overviewRef} className={styles.overviewHighlight}>
            <div className={styles.overviewHero}>
              <div className={styles.overviewHeader}>
                <span className={styles.sectionLabel}>Detection insights</span>
                <h2 className={styles.chartPanelTitle}>Overview metrics</h2>
              </div>
              <div className={styles.statGrid}>
                {overviewStats.map((stat) => (
                  <article key={stat.label} className={styles.statCard}>
                    <p className={styles.statLabel}>{stat.label}</p>
                    <p className={styles.statValue}>{stat.value}</p>
                    <p className={styles.statChange}>{stat.change}</p>
                  </article>
                ))}
              </div>
              <div className={styles.overviewExportRow}>
                <button className={styles.overviewExportBtn} onClick={exportOverview}>
                  Export / download
                </button>
              </div>
            </div>

            <div className={styles.chartSection}>
              <article className={styles.pieCard}>
                <header className={styles.pieCardHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Severity Analysis</p>
                    <h3>Severity distribution</h3>
                  </div>
                  <span className={styles.chartBadgeSmall}>Pie chart</span>
                </header>
                <div className={styles.pieBody}>
                  <div
                    className={styles.pieCircle}
                    style={createConicGradient(severityDistribution)}
                  />
                  <ul className={styles.pieLegend}>
                    {severityDistribution.map((item) => (
                      <li key={item.label}>
                        <span className={styles.legendSwatch} style={{ background: item.color }} />
                        <strong>{item.value}%</strong>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className={styles.pieCard}>
                <header className={styles.pieCardHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Decision Analysis</p>
                    <h3>Decision breakdown</h3>
                  </div>
                  <span className={styles.chartBadgeSmall}>Pie chart</span>
                </header>
                <div className={styles.pieBody}>
                  <div
                    className={styles.pieCircle}
                    style={createConicGradient(decisionBreakdown)}
                  />
                  <ul className={styles.pieLegend}>
                    {decisionBreakdown.map((item) => (
                      <li key={item.label}>
                        <span className={styles.legendSwatch} style={{ background: item.color }} />
                        <strong>{item.value}%</strong>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </div>

            <div className={styles.chartSectionSecondary}>
              <article className={styles.barChartCard}>
                <header className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Sensitive Data Insights</p>
                    <h3>Detected sensitive types</h3>
                  </div>
                  <span className={styles.chartBadgeSmall}>Bar chart</span>
                </header>
                <div className={styles.barTracks}>
                  {sensitivityTypes.map((type) => (
                    <div key={type.label} className={styles.barRow}>
                      <span>{type.label}</span>
                      <div className={styles.barTrack}>
                        <span style={{ width: `${type.value}%` }} />
                      </div>
                      <strong>{type.value}%</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.lineChartCard}>
                <header className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Sensitive Data Insights</p>
                    <h3>Prompt volume over time</h3>
                  </div>
                  <span className={styles.chartBadgeSmall}>Line chart</span>
                </header>
                <div className={styles.lineWrapper}>
                  {volumeTrend.map((point, idx) => (
                    <span key={idx} style={{ height: `${point * 2}px` }} />
                  ))}
                </div>
              </article>
            </div>

            <div className={styles.chartSectionSecondary}>
              <article className={styles.areaChartCard}>
                <header className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Operational Trends</p>
                    <h3>Actions trend over time</h3>
                  </div>
                  <span className={styles.chartBadgeSmall}>Stacked area</span>
                </header>
                <div className={styles.areaGraph}>
                  <span />
                  <span />
                  <span />
                </div>
              </article>

              <article className={styles.providerCard}>
                <header className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Provider comparison</p>
                    <h3>Response coverage</h3>
                  </div>
                  <span className={styles.chartBadgeSmall}>Table</span>
                </header>
                <div className={styles.providerList}>
                  {providerComparison.map((provider) => (
                    <div key={provider.provider} className={styles.providerRow}>
                      <strong>{provider.provider}</strong>
                      <span>Blocked: {provider.blocked}</span>
                      <span>Allowed: {provider.allowed}</span>
                    </div>
                  ))}
                </div>
          </article>
        </div>
      </section>
    ) : null}

    {activeSection === "prompts" && (
          <>
            <div className={styles.searchBarRow}>
              <div className={styles.searchInput}>
                <span className={styles.searchIcon}>{iconMap.search}</span>
                <div className={styles.searchTag}>
                  performance
                  <button className={styles.tagDismiss} type="button" aria-label="Remove performance keyword">
                    x
                  </button>
                </div>
              </div>
            </div>

            <section className={styles.filterPanel}>
              <div className={styles.filterHeader}>
                <button className={styles.resetButton} type="button">
                  Reset to default
                </button>
              </div>
              <div className={styles.filterGrid}>
                {filterFields.map((field) => (
                  <label key={field.label} className={styles.filterField}>
                    {field.label}
                    <span className={styles.inputLike}>
                      <span className={styles.inputIcon}>{iconMap[field.icon]}</span>
                      <span>{field.placeholder}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className={styles.resultsCard}>
              <div className={styles.resultsMeta}>
                4 results for <strong>"performance"</strong>
                <button className={styles.clearKeyword} type="button">
                  Clear keyword
                </button>
              </div>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Prompt</th>
                    <th>Severity</th>
                    <th>Date</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className={styles.personCell}>
                          <div className={`${styles.avatar} ${styles.tealAvatar}`}>
                            {row.partner.initials}
                          </div>
                          <div>
                            <div className={styles.personName}>{row.partner.name}</div>
                            <div className={styles.personRole}>{row.partner.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.contentCell}>{row.content}</td>
                      <td className={styles.typeCell}>{row.contentType}</td>
                      <td className={styles.dateCell}>{row.date}</td>
                      <td className={styles.actionCell}>
                        <Link href={`/report/${row.id}`} className={styles.viewButton}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </section>
    </div>
  );
};
