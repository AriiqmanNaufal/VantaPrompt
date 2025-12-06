import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import dashboardStyles from "../../components/OneOnOneDashboard.module.css";
import reportStyles from "../../styles/reportDetail.module.css";
import { navItems, BellIcon, GridIcon, SettingsIcon } from "../../components/OneOnOneDashboard";
import { detectionEvent, detectionMetadata } from "../../data/reportData";

const actionButtons = ["Mark as reviewed", "False positive", "Export / download"];

const ReportDetailPage: React.FC = () => {
  const { query } = useRouter();
  const [showRaw, setShowRaw] = useState(false);

  const infoCards = useMemo(
    () => [
      { label: "Severity", value: detectionEvent.severity },
      { label: "Allowed", value: detectionEvent.allowed ? "Yes" : "No" },
      { label: "Action taken", value: detectionEvent.actionTaken },
      { label: "Timestamp", value: new Date(detectionEvent.timestamp).toLocaleString() },
    ],
    []
  );

  return (
    <div className={dashboardStyles.dashboard}>
      <aside className={dashboardStyles.sidebar}>
        <div className={dashboardStyles.sidebarTop}>
          <div className={dashboardStyles.logoBlock}>
            <img src="/logo.jpeg" alt="VantaPrompt logo" className={dashboardStyles.logoImage} />
            <span className={dashboardStyles.userName}>Prompt Sentinel</span>
          </div>
          <ul className={dashboardStyles.navList}>
            {navItems.map((item) => (
              <li
                key={item.label}
                className={`${dashboardStyles.navItem} ${item.key === "prompts" ? dashboardStyles.navItemActive : ""}`}
                aria-current={item.key === "prompts" ? "page" : undefined}
              >
                <Link href={item.href} className={dashboardStyles.navLink}>
                  <span className={dashboardStyles.navIcon}>{item.abbr}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={dashboardStyles.sidebarFooter} />
      </aside>

      <section className={dashboardStyles.contentArea}>
        <header className={dashboardStyles.header}>
          <div className={dashboardStyles.titleBlock}>
            <h1 className={dashboardStyles.pageTitle}>Report detail</h1>
            <div className={dashboardStyles.subNav}>
              <button type="button" className={`${dashboardStyles.subNavButton} ${dashboardStyles.subNavButtonActive}`}>
                My 1-on-1s
              </button>
              <button type="button" className={dashboardStyles.subNavButton}>
                Search
              </button>
            </div>
          </div>
          <div className={dashboardStyles.headerActions}>
            <div className={dashboardStyles.headerIdentity}>
              <div className={dashboardStyles.headerAvatar}>JD</div>
              <span className={dashboardStyles.headerName}>Jane</span>
            </div>
            <button className={dashboardStyles.iconButton} type="button" aria-label="Notifications">
              <BellIcon />
            </button>
            <button className={dashboardStyles.iconButton} type="button" aria-label="Grid view">
              <GridIcon />
            </button>
            <button className={dashboardStyles.iconButton} type="button" aria-label="Settings">
              <SettingsIcon />
            </button>
          </div>
        </header>

        <div className={reportStyles.backRow}>
          <Link href="/prompts-monitoring" className={reportStyles.backButton}>
            ← Back to prompts
          </Link>
        </div>

        <div className={reportStyles.reportShell}>
          <div className={reportStyles.topCards}>
            {infoCards.map((card) => (
              <article key={card.label} className={reportStyles.topCard}>
                <span className={reportStyles.cardTag}>{card.label}</span>
                <p className={reportStyles.cardValue}>{card.value}</p>
                <span className={reportStyles.cardHint}>{card.label === "Timestamp" ? "UTC" : "Current state"}</span>
              </article>
            ))}
          </div>

          <div className={reportStyles.sectionGrid}>
            <section className={reportStyles.sectionCard}>
              <div className={reportStyles.sectionHeader}>
                <h2>Session info</h2>
                <span className={reportStyles.sectionMeta}>Workstation, browser, and IP</span>
              </div>
              <dl className={reportStyles.definitionList}>
                {detectionMetadata.map((item) => (
                  <React.Fragment key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </section>

            <section className={reportStyles.sectionCard}>
              <div className={reportStyles.sectionHeader}>
                <h2>Prompt info</h2>
                <div className={reportStyles.toggleGroup}>
                  <button
                    type="button"
                    className={`${reportStyles.toggleButton} ${!showRaw ? reportStyles.toggleActive : ""}`}
                    onClick={() => setShowRaw(false)}
                  >
                    Masked
                  </button>
                  <button
                    type="button"
                    className={`${reportStyles.toggleButton} ${showRaw ? reportStyles.toggleActive : ""}`}
                    onClick={() => setShowRaw(true)}
                  >
                    Raw
                  </button>
                </div>
              </div>
              <p className={reportStyles.promptValue}>{showRaw ? detectionEvent.rawText : detectionEvent.redactedText}</p>
            </section>
          </div>

          <div className={reportStyles.sectionGrid}>
            <section className={reportStyles.sectionCard}>
              <div className={reportStyles.sectionHeader}>
                <h2>Detection details</h2>
                <span className={reportStyles.sectionMeta}>Matches, types, fragments</span>
              </div>
              <div className={reportStyles.badgeRow}>
                {detectionEvent.detectedTypes.map((type) => (
                  <span key={type} className={reportStyles.badge}>
                    {type}
                  </span>
                ))}
              </div>
              <ul className={reportStyles.matchList}>
                {detectionEvent.findings.map((match) => (
                  <li key={match.fragmentHash} className={reportStyles.matchItem}>
                    <span className={reportStyles.matchLabel}>{match.type}</span>
                    <span className={reportStyles.matchHash}>{match.fragmentHash.slice(0, 18)}...</span>
                    <span className={reportStyles.matchSnippet}>{match.snippet}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={reportStyles.sectionCard}>
              <div className={reportStyles.sectionHeader}>
                <h2>Hashes</h2>
              </div>
              <div className={reportStyles.hashList}>
                <div>
                  <p className={reportStyles.hashLabel}>Prompt hash</p>
                  <p className={reportStyles.hashValue}>{detectionEvent.promptHash}</p>
                </div>
                <div>
                  <p className={reportStyles.hashLabel}>Original JSON hash</p>
                  <p className={reportStyles.hashValue}>{detectionEvent.originalJsonHash}</p>
                </div>
              </div>
              <div className={reportStyles.metadataList}>
                <div>
                  <p className={reportStyles.hashLabel}>Record ID</p>
                  <p className={reportStyles.hashValue}>{detectionEvent._id}</p>
                </div>
                <div>
                  <p className={reportStyles.hashLabel}>Created at</p>
                  <p className={reportStyles.hashValue}>{new Date(detectionEvent.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className={reportStyles.hashLabel}>Updated at</p>
                  <p className={reportStyles.hashValue}>{new Date(detectionEvent.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </section>
          </div>

          <div className={reportStyles.actionRow}>
            {actionButtons.map((action) => (
              <button key={action} type="button" className={reportStyles.actionButton}>
                {action}
              </button>
            ))}
            <div className={reportStyles.idBadge}>Report {query.id}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReportDetailPage;

