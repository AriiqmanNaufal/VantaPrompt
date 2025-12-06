import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/signin.module.css";
import { authApi } from "../utils/apiClient";

const SignInPage: React.FC = () => {
  const router = useRouter();
  const [formState, setFormState] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.username.trim() || !formState.password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await authApi.login(formState.username.trim(), formState.password);
      router.push("/prompts-monitoring");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wrong username or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.brand}>VantaPrompt.</div>
        <h1>Do money differently.</h1>
        <p>Guard every prompt, spending policy, and compliance control with one secure platform.</p>
        <div className={styles.decor} />
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <h2>Log in</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label>
              Username
              <input
                type="text"
                name="username"
                placeholder="your.username"
                value={formState.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formState.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </label>
            {error && <div className={styles.errorBanner}>{error}</div>}
            <button type="submit" className={styles.signinBtn} disabled={submitting}>
              {submitting ? "Signing in..." : "Log in"}
            </button>
          </form>
          <div className={styles.divider}>
            Need help? <Link href="/landing">Return to landing</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
