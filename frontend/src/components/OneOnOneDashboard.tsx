import React from "react";
import Link from "next/link";
import styles from "./OneOnOneDashboard.module.css";

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

const navItems: NavItem[] = [
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

const detectionEvent = {
  _id: "6933dc002daccee88be60e65",
  workspaceId: "acme-123",
  userId: "user-42",
  originalHash: "37e4d98fc2df14cf48a4ca470ab4e8144e991496c37d360eabb93be86b17d2dc",
  redactedText: "Email my credit card [REDACTED:CREDIT_CARD]to [REDACTED:EMAIL]",
  detectedTypes: ["EMAIL", "CREDIT_CARD"],
  findings: [
    {
      type: "EMAIL",
      fragmentHash: "af3c82544f648b38dc7d403473bb4b957cd04353afd9096fa871c1e469656c8c",
    },
    {
      type: "CREDIT_CARD",
      fragmentHash: "6a7e0e79b018d08c9d1bb20be79999a7778399f7ee17258b3a0d36d4b4a7bec5",
    },
  ],
  severity: "critical",
  allowed: false,
  actionTaken: "blocked",
  timestamp: "2025-12-06T07:32:16.357+00:00",
  source: "web",
};

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

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 5 1.5 6.5 1.5 6.5H5s1.5-1.5 1.5-6.5" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="4" width="5" height="5" />
    <rect x="10.5" y="4" width="5" height="5" />
    <rect x="4" y="10.5" width="5" height="5" />
    <rect x="10.5" y="10.5" width="5" height="5" />
  </svg>
);

const SettingsIcon = () => (
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
            <div className={styles.subNav}>
              <button
                type="button"
                className={`${styles.subNavButton} ${styles.subNavButtonActive}`}
              >
                My 1-on-1s
              </button>
              <button type="button" className={styles.subNavButton}>
                Search
              </button>
            </div>
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
          <section className={styles.chartPanel}>
            <div className={styles.chartPanelTop}>
              <span className={styles.sectionLabel}>Detection insights</span>
              <h2 className={styles.chartPanelTitle}>Percentage breakdown</h2>
            </div>
            <div className={styles.chartGrid}>
              {chartCards.map((card) => (
                <article key={card.title} className={styles.chartCard}>
                  <div className={styles.chartValueRow}>
                    <div className={styles.chartBadge} style={{ borderColor: card.accent }}>
                      <span>{card.percent}%</span>
                    </div>
                    <p className={styles.chartCardTitle}>{card.title}</p>
                  </div>
                  <p className={styles.chartCardValue}>{card.value}</p>
                  <div className={styles.chartProgress}>
                    <span
                      className={styles.chartProgressFill}
                      style={{ width: `${card.percent}%`, background: card.accent }}
                    />
                  </div>
                  <p className={styles.chartCardDetail}>{card.detail}</p>
                </article>
              ))}
            </div>
          </section>
        ) 
        : (
          <section className={styles.promptsTableWrapper}>
            {/* <header className={styles.promptsTableHeader}>
              <div>
                <span className={styles.sectionLabel}>Prompts monitoring</span>
                <h2 className={styles.chartPanelTitle}>Active prompts</h2>
              </div>
              <p className={styles.promptsDescription}>
                Sort and triage every recorded prompt along with its user severity.
              </p>
            </header> */}
            {/* <div className={styles.promptsTable}>
              <div className={styles.promptsTableRowPromptsHeader}>
                <span>User</span>
                <span>Prompt</span>
                <span>Severity</span>
              </div> */}
              {/* {promptRows.map((row) => (
                <div key={row.id} className={styles.promptsTableRow}>
                  <span>{row.user}</span>
                  <span className={styles.promptText}>{row.prompt}</span>
                  <span className={styles.severityTag}>{row.severity}</span>
                </div>
              ))} */}
            {/* </div> */}
          </section>
        )}

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
                    <button className={styles.viewButton} type="button">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </div>
  );
};
