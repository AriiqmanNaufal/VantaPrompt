import React from "react";
import Link from "next/link";
import styles from "../styles/signin.module.css";

const SignInPage: React.FC = () => {
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
          {/* <p>
            New to VantaPrompt? <Link href="/landing">Sign up today.</Link>
          </p> */}
          <label>
            Email address
            <input type="email" placeholder="name@company.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" />
          </label>
          {/* <div className={styles.actions}>
            <label className={styles.checkbox}>
              <input type="checkbox" />
              Keep me logged in
            </label>
            <Link href="/landing">Forgot password?</Link>
          </div> */}
          <Link href="/landing" className={styles.signinBtn}>
            Log in
          </Link>
          {/* <div className={styles.divider}>or</div>
          <button className={styles.social}>Continue with Apple</button>
          <button className={styles.social}>Continue with Google</button> */}
        </div>
      </div>
    </div>
  );
};

export default SignInPage;

