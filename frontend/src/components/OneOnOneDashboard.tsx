import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Link from "next/link";
import styles from "./OneOnOneDashboard.module.css";
import {
  dashboardApi,
  DashboardEvent,
  DashboardRecentEventsResponse,
  DashboardSummaryResponse,
  DashboardTimeseriesResponse,
  SeverityTrendResponse,
  TypeBreakdownResponse
} from "../utils/apiClient";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

type NavItem = {
  label: string;
  abbr: string;
  href: string;
  key: "overview" | "prompts";
};

type FilterField = {
  label: string;
  placeholder: string;
  icon: "search" | "filter" | "calendar";
};

type ChartSlice = {
  label: string;
  value: number;
  count: number;
  color: string;
};

type BarDatum = {
  label: string;
  count: number;
  width: number;
  percentOfTotal: number;
};

type VolumePoint = {
  id: string;
  height: number;
  label: string;
};

type AreaSegment = {
  id: string;
  flex: number;
  opacity: number;
  label: string;
};

const DEFAULT_TIMEFRAME = "24h";

const severityColors = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#fbbf24",
  low: "#34d399"
};

const decisionColors = {
  blocked: "#a855f7",
  allowed: "#0ea5e9"
};

const formatNumber = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "0";

const formatTimestamp = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "No detections recorded";

const formatShortDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "--";

const capitalize = (value?: string) => {
  if (!value) {
    return "Unknown";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const initialsFrom = (value?: string) => {
  if (!value) {
    return "NA";
  }
  const cleaned = value.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
  if (!cleaned) {
    return "NA";
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const percentage = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const createConicGradient = (data: { value: number; color: string }[]) => {
  if (!data.length) {
    return { background: "#f3f4f6" };
  }

  let start = 0;
  const segments: string[] = [];
  data.forEach((item) => {
    const bounded = Math.max(0, Math.min(100 - start, item.value));
    const end = start + bounded;
    segments.push(`${item.color} ${start}% ${end}%`);
    start = end;
  });

  if (start < 100) {
    segments.push(`#ebe9f7 ${start}% 100%`);
  }

  return { background: `conic-gradient(${segments.join(", ")})` };
};

export const navItems: NavItem[] = [
  { label: "Overview", abbr: "O", href: "/", key: "overview" },
  {
    label: "Prompts Monitoring",
    abbr: "OD",
    href: "/prompts-monitoring",
    key: "prompts"
  }
];

const filterFields: FilterField[] = [
  { label: "People", placeholder: "Search for a person", icon: "search" },
  { label: "Content type", placeholder: "Select a content type", icon: "filter" },
  { label: "Start date", placeholder: "Start date", icon: "calendar" },
  { label: "End date", placeholder: "End date", icon: "calendar" }
];

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
  )
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
    <path d="M19 12a7 7 0 0 0?.1-1.2l2.1-1.5-2-3.5-2.4 1a7.3 7.3 0 0 0-2-1.2l?.3-2.6h-4l?.3 2.6a7.3 7.3 0 0 0-2 1.2l-2.4-1-2 3.5 2.1 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2.1 1.5 2 3.5 2.4-1a7.3 7.3 0 0 0 2 1.2l.3 2.6h4l.3-2.6a7.3 7.3 0 0 0 2-1.2l2.4 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1.2z" />
  </svg>
);

export type DashboardSection = "overview" | "prompts";

interface OneOnOneDashboardProps {
  activeSection?: DashboardSection;
}

export const OneOnOneDashboard: React.FC<OneOnOneDashboardProps> = ({
  activeSection = "overview"
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
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [timeseries, setTimeseries] = useState<DashboardTimeseriesResponse | null>(null);
  const [recentEvents, setRecentEvents] = useState<DashboardRecentEventsResponse | null>(null);
  const [typeBreakdown, setTypeBreakdown] = useState<TypeBreakdownResponse | null>(null);
  const [severityTrend, setSeverityTrend] = useState<SeverityTrendResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [
        summaryData,
        timeseriesData,
        recentEventsData,
        typeBreakdownData,
        severityTrendData
      ] = await Promise.all([
        dashboardApi.getSummary({ since: DEFAULT_TIMEFRAME }),
        dashboardApi.getTimeseries({ since: DEFAULT_TIMEFRAME }),
        dashboardApi.getRecentEvents({ since: DEFAULT_TIMEFRAME, limit: 10 }),
        dashboardApi.getTypeBreakdown({ since: DEFAULT_TIMEFRAME }),
        dashboardApi.getSeverityTrend({ since: DEFAULT_TIMEFRAME })
      ]);

      if (!mountedRef.current) {
        return;
      }

      setSummary(summaryData);
      setTimeseries(timeseriesData);
      setRecentEvents(recentEventsData);
      setTypeBreakdown(typeBreakdownData);
      setSeverityTrend(severityTrendData);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data from the backend"
      );
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadDashboard();
    return () => {
      mountedRef.current = false;
    };
  }, [loadDashboard]);

  const overviewStats = useMemo(() => {
    const timeframe = summary?.timeframe ?? DEFAULT_TIMEFRAME;
    const total = summary?.totalEvents ?? 0;
    const blocked = summary?.blockedEvents ?? 0;
    const allowed = summary?.allowedEvents ?? 0;
    const lastEventText = summary?.lastEventTimestamp
      ? `Last detection ${formatTimestamp(summary.lastEventTimestamp)}`
      : `Tracking last ${timeframe}`;

    return [
      {
        label: "Total prompts processed",
        value: formatNumber(total),
        change: lastEventText
      },
      {
        label: "Blocked prompts",
        value: formatNumber(blocked),
        change: total
          ? `${percentage(blocked, total)}% of total`
          : "Waiting for detections"
      },
      {
        label: "Allowed prompts",
        value: formatNumber(allowed),
        change: total
          ? `${percentage(allowed, total)}% of total`
          : "Waiting for detections"
      }
    ];
  }, [summary]);

  const severitySlices: ChartSlice[] = useMemo(() => {
    const counts = summary?.severityCount ?? {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    const total = Object.values(counts).reduce(
      (sum, value) => sum + (value ?? 0),
      0
    );

    return [
      {
        label: "Critical",
        count: counts.critical ?? 0,
        color: severityColors.critical,
        value: percentage(counts.critical ?? 0, total)
      },
      {
        label: "High",
        count: counts.high ?? 0,
        color: severityColors.high,
        value: percentage(counts.high ?? 0, total)
      },
      {
        label: "Medium",
        count: counts.medium ?? 0,
        color: severityColors.medium,
        value: percentage(counts.medium ?? 0, total)
      },
      {
        label: "Low",
        count: counts.low ?? 0,
        color: severityColors.low,
        value: percentage(counts.low ?? 0, total)
      }
    ];
  }, [summary]);

  const decisionSlices: ChartSlice[] = useMemo(() => {
    const blocked = summary?.blockedEvents ?? 0;
    const allowed = summary?.allowedEvents ?? 0;
    const total = blocked + allowed;

    return [
      {
        label: "Blocked",
        count: blocked,
        color: decisionColors.blocked,
        value: percentage(blocked, total)
      },
      {
        label: "Allowed",
        count: allowed,
        color: decisionColors.allowed,
        value: percentage(allowed, total)
      }
    ];
  }, [summary]);

  const typeBars: BarDatum[] = useMemo(() => {
    const rows = typeBreakdown?.types ?? [];
    if (!rows.length) {
      return [];
    }
    const max = Math.max(...rows.map((row) => row.count), 1);
    const total = rows.reduce((sum, row) => sum + row.count, 0);

    return rows.map((row) => ({
      label: row.type,
      count: row.count,
      width: Math.round((row.count / max) * 100),
      percentOfTotal: percentage(row.count, total)
    }));
  }, [typeBreakdown]);

  const volumePoints: VolumePoint[] = useMemo(() => {
    const buckets = timeseries?.buckets ?? [];
    if (!buckets.length) {
      return [];
    }
    const max = Math.max(...buckets.map((bucket) => bucket.total), 1);

    return buckets.map((bucket) => ({
      id: bucket.date,
      height: Math.max(Math.round((bucket.total / max) * 80), 6),
      label: `${formatShortDate(bucket.date)} - ${bucket.total} prompts`
    }));
  }, [timeseries]);

  const areaSegments: AreaSegment[] = useMemo(() => {
    const buckets = timeseries?.buckets ?? [];
    if (!buckets.length) {
      return [];
    }
    const recent = buckets.slice(-3);
    return recent.map((bucket) => ({
      id: bucket.date,
      flex: Math.max(bucket.total, 1),
      opacity: 0.35 + Math.min(bucket.blocked / (bucket.total || 1), 1) * 0.5,
      label: `${formatShortDate(bucket.date)} - ${bucket.total} total / ${bucket.blocked} blocked`
    }));
  }, [timeseries]);

  const severityTrendRows = useMemo(
    () => (severityTrend?.trend ?? []).slice(-5).reverse(),
    [severityTrend]
  );

  const eventRows = recentEvents?.events ?? [];
  const timeframeLabel = summary?.timeframe ?? DEFAULT_TIMEFRAME;

  const renderEventUser = (event: DashboardEvent) => (
    <div className={styles.personCell}>
      <div
        className={`${styles.avatar} ${
          event.allowed ? styles.tealAvatar : styles.pinkAvatar
        }`}
      >
        {initialsFrom(event.userId)}
      </div>
      <div>
        <div className={styles.personName}>{event.userId || "Unknown user"}</div>
        <div className={styles.personRole}>
          {event.workspaceId || "Workspace not set"}
        </div>
      </div>
    </div>
  );

  const renderDecision = (event: DashboardEvent) => {
    const decision =
      (event.llmResult?.decision || event.actionTaken || "unknown").toUpperCase();
    const riskLabel = capitalize(event.llmResult?.risk || event.severity);
    const provider = event.llmResult?.provider || event.source || "Unknown source";
    return (
      <div className={styles.decisionWrapper}>
        <span className={styles.decisionBadge}>{decision}</span>
        <span className={styles.decisionMeta}>
          {provider} | Risk {riskLabel}
        </span>
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoBlock}>
            <img
              src="/Gemini_Generated_Image_6gwuzt6gwuzt6gwu (1).png"
              alt="VantaPrompt logo"
              className={styles.logoImage}
            />
            <span className={styles.userName}>VantaPrompt</span>
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
        <div className={styles.sidebarFooter} />
      </aside>
      <section className={styles.contentArea}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.pageTitle}>
              {activeSection === "overview" ? "Overview" : "Prompts Monitoring"}
            </h1>
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

        {(isLoading || error) && (
          <div className={styles.statusRow}>
            {isLoading && (
              <span className={styles.loadingText}>Refreshing live data...</span>
            )}
            {error && (
              <div className={styles.statusBanner} role="alert">
                {error}
              </div>
            )}
          </div>
        )}

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
                    style={createConicGradient(severitySlices)}
                  />
                  <ul className={styles.pieLegend}>
                    {severitySlices.map((slice) => (
                      <li key={slice.label}>
                        <span
                          className={styles.legendSwatch}
                          style={{ background: slice.color }}
                        />
                        <strong>{slice.value}%</strong>
                        <span>
                          {slice.label} ({slice.count})
                        </span>
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
                    style={createConicGradient(decisionSlices)}
                  />
                  <ul className={styles.pieLegend}>
                    {decisionSlices.map((slice) => (
                      <li key={slice.label}>
                        <span
                          className={styles.legendSwatch}
                          style={{ background: slice.color }}
                        />
                        <strong>{slice.value}%</strong>
                        <span>
                          {slice.label} ({slice.count})
                        </span>
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
                {typeBars.length ? (
                  <div className={styles.barTracks}>
                    {typeBars.map((type) => (
                      <div key={type.label} className={styles.barRow}>
                        <span>{type.label}</span>
                        <div className={styles.barTrack}>
                          <span style={{ width: `${type.width}%` }} />
                        </div>
                        <strong>{type.count}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyState}>
                    No sensitive data detected in this window.
                  </p>
                )}
              </article>

              <article className={styles.lineChartCard}>
                <header className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Prompt activity</p>
                    <h3>Prompt volume over time</h3>
                  </div>
                  <span className={styles.chartBadgeSmall}>Line chart</span>
                </header>
                <div className={styles.lineWrapper}>
                  {volumePoints.length ? (
                    volumePoints.map((point) => (
                      <span
                        key={point.id}
                        style={{ height: `${point.height}px` }}
                        title={point.label}
                      />
                    ))
                  ) : (
                    <div className={styles.emptyState}>No volume data yet.</div>
                  )}
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
                  {areaSegments.length ? (
                    areaSegments.map((segment) => (
                      <span
                        key={segment.id}
                        style={{ flex: segment.flex, opacity: segment.opacity }}
                        title={segment.label}
                      />
                    ))
                  ) : (
                    <div className={styles.emptyState}>No actions to display.</div>
                  )}
                </div>
              </article>

              <article className={styles.providerCard}>
                <header className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionLabel}>Severity trend</p>
                    <h3>Daily breakdown</h3>
                  </div>
                  <span className={styles.chartBadgeSmall}>Table</span>
                </header>
                <div className={styles.providerList}>
                  {severityTrendRows.length ? (
                    severityTrendRows.map((row) => (
                      <div key={row.date} className={styles.providerRow}>
                        <strong>{formatShortDate(row.date)}</strong>
                        <span>
                          Critical {row.critical} / High {row.high}
                        </span>
                        <span>
                          Medium {row.medium} / Low {row.low}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      No severity trend recorded yet.
                    </div>
                  )}
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
                <span>
                  Showing prompts captured over the last {timeframeLabel}.
                </span>
              </div>
            </div>

            <section className={styles.filterPanel}>
              <div className={styles.filterHeader}>
                <button
                  className={styles.resetButton}
                  type="button"
                  onClick={() => loadDashboard()}
                >
                  Refresh data
                </button>
              </div>
              <div className={styles.filterGrid}>
                {filterFields.map((field) => (
                  <label key={field.label} className={styles.filterField}>
                    {field.label}
                    <span className={styles.inputLike}>
                      <span className={styles.inputIcon}>
                        {iconMap[field.icon]}
                      </span>
                      <span>{field.placeholder}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className={styles.resultsCard}>
              <div className={styles.resultsMeta}>
                Showing {eventRows.length} of {recentEvents?.total ?? 0} prompts
                captured over the last {timeframeLabel}.
                <button
                  className={styles.clearKeyword}
                  type="button"
                  onClick={() => loadDashboard()}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Refresh data"}
                </button>
              </div>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Prompt</th>
                    <th>Severity</th>
                    <th>Decision</th>
                    <th>Date</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {eventRows.length ? (
                    eventRows.map((event) => (
                      <tr key={event._id}>
                        <td>{renderEventUser(event)}</td>
                        <td className={styles.contentCell}>
                          {event.redactedText || "No prompt text available"}
                        </td>
                        <td className={styles.typeCell}>
                          <span className={styles.severityTag}>
                            {capitalize(event.severity)}
                          </span>
                        </td>
                        <td className={styles.decisionCell}>{renderDecision(event)}</td>
                        <td className={styles.dateCell}>
                          {formatTimestamp(event.timestamp)}
                        </td>
                        <td className={styles.actionCell}>
                          <Link
                            href={`/report/${event._id}`}
                            className={styles.viewButton}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className={styles.emptyState}>
                          No prompts captured in the selected timeframe.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </section>
    </div>
  );
};
