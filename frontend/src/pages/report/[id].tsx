import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import dashboardStyles from "../../components/OneOnOneDashboard.module.css";
import reportStyles from "../../styles/reportDetail.module.css";
import {
  navItems,
  BellIcon,
  GridIcon,
  SettingsIcon
} from "../../components/OneOnOneDashboard";
import { dashboardApi, DashboardEvent } from "../../utils/apiClient";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const actionButtons = ["Mark as reviewed", "False positive", "Export / download"];

const formatTimestamp = (value?: string) =>
  value ? new Date(value).toLocaleString() : "No timestamp recorded";

const capitalize = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown";

const ReportDetailPage: React.FC = () => {
  const router = useRouter();
  const { query, isReady } = router;
  const [event, setEvent] = useState<DashboardEvent | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const exportReport = useCallback(async () => {
    if (!reportRef.current) {
      return;
    }

    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF("p", "mm", "a4");
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const filenameId =
      (typeof query.id === "string" && query.id) || event?._id || "report";

    doc.save(`report-${filenameId}.pdf`);
  }, [event?._id, query.id]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordId =
    typeof query.id === "string"
      ? query.id
      : Array.isArray(query.id)
        ? query.id[0]
        : "";

  useEffect(() => {
    if (!isReady || !recordId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    dashboardApi
      .getEventById(recordId)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setEvent(response.event);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the selected event from the backend."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, recordId]);

  const infoCards = useMemo(() => {
    if (!event) {
      return [];
    }
    return [
      { label: "Severity", value: capitalize(event.severity) },
      { label: "Allowed", value: event.allowed ? "Yes" : "No" },
      { label: "Action taken", value: event.actionTaken || "Unknown" },
      { label: "Timestamp", value: formatTimestamp(event.timestamp) }
    ];
  }, [event]);

  const metadata = useMemo(() => {
    if (!event) {
      return [];
    }
    return [
      { label: "Workspace", value: event.workspaceId || "Unknown" },
      { label: "User ID", value: event.userId || "Unknown" },
      { label: "Workstation", value: event.workstation || "Unknown" },
      { label: "Source", value: event.source || "Unknown" },
      {
        label: "IP Address",
        value:
          event.ipAddress ||
          (typeof event.originalJson?.ip === "string" ? event.originalJson.ip : "") ||
          "Unknown"
      }
    ];
  }, [event]);

  const detectionItems = useMemo(() => {
    if (!event) {
      return [];
    }
    if (event.fragments && event.fragments.length > 0) {
      return event.fragments.map((fragment, index) => ({
        key: fragment.fragmentHash || `${fragment.type}-${index}`,
        label: fragment.type || "PII",
        hash: fragment.fragmentHash || "N/A",
        snippet: fragment.fragment || "--"
      }));
    }
    return (event.matches ?? []).map((match, index) => ({
      key: `${event._id}-match-${index}`,
      label: "PII",
      hash: `${event._id}-match-${index}`,
      snippet: match
    }));
  }, [event]);

  const llmResult = event?.llmResult || null;

  const llmDetails = useMemo(() => {
    if (!llmResult) {
      return [];
    }
    return [
      { label: "Decision", value: llmResult.decision || "Unknown" },
      { label: "Risk", value: capitalize(llmResult.risk) },
      {
        label: "Provider",
        value: llmResult.provider || (llmResult.metadata?.provider as string) || "Unknown"
      },
      { label: "Reason", value: llmResult.reason || "Not provided" }
    ];
  }, [llmResult]);

  const maskedPrompt = event?.redactedText || "No masked prompt available.";
  const rawPrompt =
    event?.rawPrompt ||
    (typeof event?.originalJson?.prompt === "string"
      ? event.originalJson.prompt
      : "Raw prompt unavailable.");

  const hashEntries = [
    { label: "Record ID", value: event?._id || recordId || "Not available" },
    { label: "Original hash", value: event?.originalHash || "Not recorded" }
  ];

  const metadataEntries = [
    { label: "Workspace", value: event?.workspaceId || "Unknown" },
    { label: "Model used", value: event?.modelUsed || "Unknown" },
    {
      label: "Latency (ms)",
      value:
        typeof event?.latencyMs === "number" ? event.latencyMs.toString() : "Not recorded"
    },
    { label: "Timestamp", value: formatTimestamp(event?.timestamp) }
  ];

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
              {/* <button type="button" className={`${dashboardStyles.subNavButton} ${dashboardStyles.subNavButtonActive}`}>
                My 1-on-1s
              </button>
              <button type="button" className={dashboardStyles.subNavButton}>
                Search
              </button> */}
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

        {error && <div className={reportStyles.errorBanner}>{error}</div>}
        {isLoading && <div className={reportStyles.loadingState}>Loading event details...</div>}

        <div className={reportStyles.backRow}>
          <Link href="/prompts-monitoring" className={reportStyles.backButton}>
            ← Back to prompts
          </Link>
        </div>

        <div ref={reportRef} className={reportStyles.reportShell}>
          <div className={reportStyles.topCards}>
            {infoCards.length ? (
              infoCards.map((card) => (
                <article key={card.label} className={reportStyles.topCard}>
                  <span className={reportStyles.cardTag}>{card.label}</span>
                  <p className={reportStyles.cardValue}>{card.value}</p>
                  <span className={reportStyles.cardHint}>Current state</span>
                </article>
              ))
            ) : (
              <article className={reportStyles.topCard}>
                <span className={reportStyles.cardTag}>Status</span>
                <p className={reportStyles.cardValue}>No data</p>
                <span className={reportStyles.cardHint}>
                  {isLoading ? "Fetching event..." : "Select a prompt to view details"}
                </span>
              </article>
            )}
          </div>

          <div className={reportStyles.sectionGrid}>
            <section className={reportStyles.sectionCard}>
              <div className={reportStyles.sectionHeader}>
                <h2>Session info</h2>
                <span className={reportStyles.sectionMeta}>Workspace, user, and device</span>
              </div>
              <dl className={reportStyles.definitionList}>
                {(metadata.length
                  ? metadata
                  : [{ label: "Status", value: "No metadata available." }]
                ).map((item) => (
                  <div key={item.label} className={reportStyles.definitionItem}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
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
              <p className={reportStyles.promptValue}>{showRaw ? rawPrompt : maskedPrompt}</p>
            </section>
          </div>

          <div className={reportStyles.sectionGrid}>
            <section className={reportStyles.sectionCard}>
              <div className={reportStyles.sectionHeader}>
                <h2>Detection details</h2>
                <span className={reportStyles.sectionMeta}>Matches, types, fragments</span>
              </div>
              <div className={reportStyles.badgeRow}>
                {event?.detectedTypes && event.detectedTypes.length ? (
                  event.detectedTypes.map((type) => (
                    <span key={type} className={reportStyles.badge}>
                      {type}
                    </span>
                  ))
                ) : (
                  <span className={reportStyles.badge}>No detections recorded</span>
                )}
              </div>
              <ul className={reportStyles.matchList}>
                {detectionItems.length ? (
                  detectionItems.map((match) => (
                    <li key={match.key} className={reportStyles.matchItem}>
                      <span className={reportStyles.matchLabel}>{match.label}</span>
                      <span className={reportStyles.matchHash}>{match.hash}</span>
                      <span className={reportStyles.matchSnippet}>{match.snippet}</span>
                    </li>
                  ))
                ) : (
                  <li className={reportStyles.matchItem}>
                    <span className={reportStyles.matchSnippet}>No fragments captured.</span>
                  </li>
                )}
              </ul>
            </section>

            <section className={reportStyles.sectionCard}>
              <div className={reportStyles.sectionHeader}>
                <h2>Hashes</h2>
              </div>
              <div className={reportStyles.hashList}>
                {hashEntries.map((entry) => (
                  <div key={entry.label}>
                    <p className={reportStyles.hashLabel}>{entry.label}</p>
                    <p className={reportStyles.hashValue}>{entry.value}</p>
                  </div>
                ))}
              </div>
              <div className={reportStyles.metadataList}>
                {metadataEntries.map((entry) => (
                  <div key={entry.label}>
                    <p className={reportStyles.hashLabel}>{entry.label}</p>
                    <p className={reportStyles.hashValue}>{entry.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {llmResult ? (
            <section className={reportStyles.sectionCard}>
              <div className={reportStyles.sectionHeader}>
                <h2>Layer two decision</h2>
                <span className={reportStyles.sectionMeta}>Provider verdict and safe output</span>
              </div>
              <dl className={reportStyles.definitionList}>
                {llmDetails.map((item) => (
                  <div key={item.label} className={reportStyles.definitionItem}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
              {llmResult.safeAlternative && (
                <div className={reportStyles.safeAlternative}>
                  <p className={reportStyles.safeAltLabel}>Suggested safe alternative</p>
                  <p className={reportStyles.safeAltText}>{llmResult.safeAlternative}</p>
                </div>
              )}
            </section>
          ) : null}

          <div className={reportStyles.actionRow}>
            {actionButtons.map((action) => (
              <button
                key={action}
                type="button"
                className={reportStyles.actionButton}
                onClick={exportReport}
              >
                {action}
              </button>
            ))}
            <div className={reportStyles.idBadge}>Report {event?._id || recordId || "N/A"}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReportDetailPage;
