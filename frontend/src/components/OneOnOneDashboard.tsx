import React from "react";
import styles from "./OneOnOneDashboard.module.css";

type NavItem = {
  label: string;
  abbr: string;
  active?: boolean;
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

const navItems: NavItem[] = [
  { label: "Home", abbr: "H" },
  { label: "Outcomes Dashboard", abbr: "OD" },
  { label: "Manager Effectiveness", abbr: "ME" },
  { label: "Check-ins", abbr: "CI" },
  { label: "1-on-1s", abbr: "1:1", active: true },
  { label: "High Fives", abbr: "HF" },
  { label: "Objectives", abbr: "OBJ" },
  { label: "Feedback", abbr: "FB" },
  { label: "Best-Self Review", abbr: "BS" },
  { label: "Engagement", abbr: "EN" },
  { label: "Reporting", abbr: "RP" },
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

export const OneOnOneDashboard: React.FC = () => {
  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoBlock}>
            <span className={styles.logoMark}>15Five</span>
            <span className={styles.userName}>JD Mobbin</span>
          </div>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li
                key={item.label}
                className={`${styles.navItem} ${
                  item.active ? styles.navItemActive : ""
                }`}
                aria-current={item.active ? "page" : undefined}
              >
                <span className={styles.navIcon}>{item.abbr}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.sidebarFooter}>
          <button className={styles.collapseButton} type="button">
            Collapse
          </button>
        </div>
      </aside>
      <section className={styles.contentArea}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.pageTitle}>1-on-1s</h1>
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
                <th>1-on-1 with</th>
                <th>Content</th>
                <th>Content type</th>
                <th>Author</th>
                <th>1-on-1 date</th>
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
                  <td>
                    <div
                      className={`${styles.authorAvatar} ${
                        row.author.variant === "pink" ? styles.pinkAvatar : styles.tealAvatar
                      }`}
                    >
                      {row.author.initials}
                    </div>
                  </td>
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
