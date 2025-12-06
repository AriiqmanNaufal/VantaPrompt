import React from "react";
import Link from "next/link";
import styles from "../styles/landing.module.css";

const highlightCards = [
  {
    title: "Spend with confidence",
    copy: "Stop risky prompts before they hit LLMs. VantaPrompt keeps sensitive workflows guarded with policy checks, approvals, and audits.",
  },
  {
    title: "Visible & compliant",
    copy: "Track every decision, build reports for auditors, and show real-time proof that prompts are reviewed by the right people.",
  },
  {
    title: "Automate approvals",
    copy: "Create custom roles, spending tiers, and approval flows so your team can move fast without losing control.",
  },
];

const featureCards = [
  {
    title: "Money is protected",
    body: "Bank-grade custody, FDIC-insured funds, and high-velocity monitoring keep your assets safe.",
  },
  {
    title: "Fraud on guard",
    body: "3D Secure, transaction risk scoring, and anomaly detections flag suspicious prompts instantly.",
  },
  {
    title: "Team controls",
    body: "Provision roles, limits, and approval paths in one place so you never worry about overexposure.",
  },
  {
    title: "Policy guardrails",
    body: "Turn compliance questions into automated workflows and enforce your standards across every channel.",
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.navbar}>
        <div className={styles.brand}>VantaPrompt</div>
        {/* <div className={styles.actions}> */}
          {/* <button className={styles.signIn}>Log in</button>
          <button className={styles.signUp}>Sign up</button> */}
        {/* </div> */}
      </header>

      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <p className={styles.tag}>Security</p>
          <h1>Spend with confidence</h1>
          <p className={styles.subtitle}>
            Keep every prompt secure with policy enforcement, anti-fraud intelligence, and purpose-built
            reviews for LLM workflows.
          </p>
        <div className={styles.heroButtons}>
          <Link href="/signin" className={styles.primary}>
            Get started
          </Link>
          {/* <button className={styles.secondary}>Contact sales</button> */}
        </div>
        </div>
        <div className={styles.heroRight} />
      </section>

      <section className={styles.highlightRow}>
        {highlightCards.map((card) => (
          <article key={card.title} className={styles.highlightCard}>
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
          </article>
        ))}
      </section>

      <section className={styles.features}>
        {featureCards.map((feature) => (
          <article key={feature.title} className={styles.featureCard}>
            <h4>{feature.title}</h4>
            <p>{feature.body}</p>
            {/* <button className={styles.linkBtn}>Automate your payments →</button> */}
          </article>
        ))}
      </section>

      <footer className={styles.cta}>
        <p>What are you waiting for?</p>
        <h2>Get top tier security for your business today</h2>
        {/* <button className={styles.ctaBtn}>Start protecting prompts</button> */}
      </footer>
    </div>
  );
};

export default LandingPage;

