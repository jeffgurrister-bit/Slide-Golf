import { useState } from "react";
import { auth, db } from "../firebase.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, signOut
} from "firebase/auth";
import {
  collection, doc, setDoc, addDoc, updateDoc, getDoc
} from "firebase/firestore";
import { C, btnS, inputS } from "../utils/theme.js";

// Authentication screen — sign in, sign up, or recover password. Supports
// Google sign-in (popup) and email/password. On first sign-in (either
// provider) a user picks an existing unclaimed player profile (claim) or
// creates a new one. Once claimed, a player doc is locked to a single
// Firebase Auth uid so no one else can sign in as the same player.
//
// authUser prop: if set, the user has signed in but doesn't yet have a
// linked profile doc — show only the claim/create-new step.
export default function AuthScreen({ players, authUser, onSignedIn }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupChoice, setSignupChoice] = useState("claim"); // "claim" | "new"
  const [claimName, setClaimName] = useState("");
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  // Anyone whose player doc doesn't have a uid is still claimable.
  const unclaimed = (players || []).filter(p => !p.uid).sort((a, b) => a.name.localeCompare(b.name));

  // If the user already signed in (e.g. via Google) but doesn't have a
  // linked players doc yet, we drop straight into the claim/create step.
  const needsProfile = !!authUser;
  const [showEmail, setShowEmail] = useState(false);

  function reset() { setErr(""); setInfo(""); }

  // Detect mobile / in-app browsers where popups are unreliable. On these
  // we use signInWithRedirect; on desktop we keep the snappier popup flow.
  function isMobileLike() {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    return /Mobi|Android|iPhone|iPad|iPod|FBAN|FBAV|Instagram/i.test(ua);
  }

  async function handleGoogle() {
    reset();
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      if (isMobileLike()) {
        // Redirect flow — page navigates to Google, comes back signed in.
        // No further code here runs; the result is picked up by
        // onAuthStateChanged after the redirect completes.
        await signInWithRedirect(auth, provider);
        return;
      }
      const cred = await signInWithPopup(auth, provider);
      onSignedIn?.(cred.user);
    } catch (e) {
      setErr(authError(e));
    } finally {
      setBusy(false);
    }
  }

  // Called when an already-signed-in user (e.g. fresh Google sign-in)
  // claims an existing player or creates a new one.
  async function handleCompleteProfile() {
    reset();
    if (!authUser) return;
    if (signupChoice === "claim" && !claimName) { setErr("Pick an existing player to claim, or switch to Create new."); return; }
    if (signupChoice === "new") {
      if (!newName.trim()) { setErr("Player name is required."); return; }
      if (players.some(p => p.name.toLowerCase() === newName.trim().toLowerCase())) {
        setErr(`A player named "${newName.trim()}" already exists. Switch to Claim existing.`);
        return;
      }
    }
    setBusy(true);
    try {
      let playerName = "";
      if (signupChoice === "claim") {
        const target = players.find(p => p.name === claimName);
        if (!target) throw new Error("That player no longer exists.");
        if (target.uid) throw new Error("That player has already been claimed by someone else.");
        await updateDoc(doc(db, "players", target.id), { uid: authUser.uid });
        playerName = target.name;
      } else {
        const trimmed = newName.trim();
        await addDoc(collection(db, "players"), {
          name: trimmed, uid: authUser.uid, createdAt: Date.now()
        });
        playerName = trimmed;
      }
      await setDoc(doc(db, "users", authUser.uid), {
        uid: authUser.uid, email: authUser.email, playerName,
        createdAt: Date.now()
      });
      onSignedIn?.(authUser);
    } catch (e) {
      setErr("Couldn't link profile: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn() {
    reset();
    if (!email.trim() || !password) { setErr("Email and password are required."); return; }
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      // App.jsx's onAuthStateChanged effect resolves the linked player.
      onSignedIn?.(cred.user);
    } catch (e) {
      setErr(authError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    reset();
    if (!email.trim() || !password) { setErr("Email and password are required."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (signupChoice === "claim" && !claimName) { setErr("Pick an existing player to claim, or switch to Create new."); return; }
    if (signupChoice === "new") {
      if (!newName.trim()) { setErr("Player name is required."); return; }
      if (players.some(p => p.name.toLowerCase() === newName.trim().toLowerCase())) {
        setErr(`A player named "${newName.trim()}" already exists. Switch to Claim existing.`);
        return;
      }
    }
    setBusy(true);
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setErr(authError(e));
      setBusy(false);
      return;
    }
    try {
      let playerName = "";
      if (signupChoice === "claim") {
        // Race-safe claim: check the player doc still has no uid before
        // we lock it to ours.
        const target = players.find(p => p.name === claimName);
        if (!target) throw new Error("That player no longer exists.");
        if (target.uid) throw new Error("That player has already been claimed by someone else.");
        await updateDoc(doc(db, "players", target.id), { uid: cred.user.uid });
        playerName = target.name;
      } else {
        const trimmed = newName.trim();
        await addDoc(collection(db, "players"), {
          name: trimmed, uid: cred.user.uid, createdAt: Date.now()
        });
        playerName = trimmed;
      }
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, email: cred.user.email, playerName,
        createdAt: Date.now()
      });
      onSignedIn?.(cred.user);
    } catch (e) {
      // Surface but don't roll back the auth user — the user can sign in
      // again and retry the claim. Don't want to leave them in a half state.
      setErr("Account created but profile link failed: " + e.message + ". Try signing in again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    reset();
    if (!email.trim()) { setErr("Enter your email first."); return; }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Check your inbox for a password reset link.");
    } catch (e) {
      setErr(authError(e));
    } finally {
      setBusy(false);
    }
  }

  // ─── Shared profile-picker block (claim or create) ──────
  const ProfilePicker = () => (
    <>
      <div style={{ borderTop: needsProfile ? "none" : `1px solid ${C.border}`, paddingTop: needsProfile ? 0 : 10 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>I am…</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSignupChoice("claim")} style={{ flex: 1, padding: "8px 6px", borderRadius: 6, border: signupChoice === "claim" ? `2px solid ${C.greenLt}` : `1px solid ${C.border}`, background: signupChoice === "claim" ? C.accent : C.card2, color: C.text, cursor: "pointer", fontSize: 11, fontWeight: signupChoice === "claim" ? 700 : 400 }}>An existing player</button>
          <button onClick={() => setSignupChoice("new")} style={{ flex: 1, padding: "8px 6px", borderRadius: 6, border: signupChoice === "new" ? `2px solid ${C.greenLt}` : `1px solid ${C.border}`, background: signupChoice === "new" ? C.accent : C.card2, color: C.text, cursor: "pointer", fontSize: 11, fontWeight: signupChoice === "new" ? 700 : 400 }}>New to the league</button>
        </div>
      </div>
      {signupChoice === "claim" && (
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Which player are you?</div>
          <select value={claimName} onChange={e => setClaimName(e.target.value)} style={{ ...inputS, width: "100%" }}>
            <option value="">— Pick yourself —</option>
            {unclaimed.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          {!unclaimed.length && <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>No unclaimed players — every existing player has already been linked to an account. Switch to "New to the league."</div>}
        </div>
      )}
      {signupChoice === "new" && (
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Your name</div>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sam Wilson" style={{ ...inputS, width: "100%" }} />
        </div>
      )}
    </>
  );

  // ─── Branch 1: already signed in, just needs to pick a profile ───
  if (needsProfile) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI',system-ui,sans-serif", color: C.text }}>
        <div style={{ background: C.headerBg, padding: "14px 20px", borderBottom: `2px solid ${C.green}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.accent, border: `2px solid ${C.greenLt}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⛳</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 2, textTransform: "uppercase" }}>Slide Golf</div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>LEAGUE TRACKER</div>
          </div>
        </div>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>One more step</div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Signed in as {authUser.email || authUser.displayName || "you"}. Pick your player profile to link with this account.</div>
          </div>
          <div style={{ background: C.card, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
            <ProfilePicker />
            {err && <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${C.red}`, color: C.red, padding: "8px 10px", borderRadius: 6, fontSize: 12 }}>{err}</div>}
            <button onClick={handleCompleteProfile} disabled={busy} style={{ ...btnS(true), padding: 12, fontSize: 14, opacity: busy ? 0.5 : 1, cursor: busy ? "not-allowed" : "pointer" }}>
              {busy ? "..." : "Continue"}
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={async () => { try { await signOut(auth); } catch (e) {} }} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 11 }}>Use a different account</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Branch 2: not signed in yet — full auth screen ───
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI',system-ui,sans-serif", color: C.text }}>
      <div style={{ background: C.headerBg, padding: "14px 20px", borderBottom: `2px solid ${C.green}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.accent, border: `2px solid ${C.greenLt}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⛳</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 2, textTransform: "uppercase" }}>Slide Golf</div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>LEAGUE TRACKER</div>
        </div>
      </div>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset password"}</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
            {mode === "signin" && "Welcome back"}
            {mode === "signup" && "One-time setup so no one signs in as you by mistake"}
            {mode === "reset" && "We'll email you a reset link"}
          </div>
        </div>

        {/* Google button — fast path; first-time users land on the
            ProfilePicker after signing in. */}
        {mode !== "reset" && (
          <button onClick={handleGoogle} disabled={busy} style={{ background: "#fff", color: "#1a1a1a", border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🇬</span>
            Sign in with Google
          </button>
        )}

        {/* Error from a redirect-based sign-in (no email card visible yet). */}
        {!showEmail && err && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${C.red}`, color: C.red, padding: "8px 10px", borderRadius: 6, fontSize: 12 }}>{err}</div>
        )}

        {/* Email/password card — hidden by default so the screen stays
            clean for Google-only setups. Toggle reveals it. */}
        {!showEmail && mode !== "reset" && (
          <button onClick={() => { setShowEmail(true); reset(); }} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, textAlign: "center", padding: "4px 0" }}>
            Use email and password instead
          </button>
        )}

        {(showEmail || mode === "reset") && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.muted, fontSize: 10 }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span>EMAIL</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            <div style={{ background: C.card, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Email</div>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" style={{ ...inputS, width: "100%" }} />
              </div>
              {mode !== "reset" && (
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Password</div>
                  <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "min 6 chars" : ""} style={{ ...inputS, width: "100%" }} />
                </div>
              )}
              {mode === "signup" && <ProfilePicker />}
              {err && <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${C.red}`, color: C.red, padding: "8px 10px", borderRadius: 6, fontSize: 12 }}>{err}</div>}
              {info && <div style={{ background: "rgba(74,170,74,0.1)", border: `1px solid ${C.greenLt}`, color: C.greenLt, padding: "8px 10px", borderRadius: 6, fontSize: 12 }}>{info}</div>}
              <button
                onClick={mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleResetPassword}
                disabled={busy}
                style={{ ...btnS(true), padding: 12, fontSize: 14, opacity: busy ? 0.5 : 1, cursor: busy ? "not-allowed" : "pointer" }}
              >
                {busy ? "..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, fontSize: 12 }}>
              {mode !== "signin" && <button onClick={() => { setMode("signin"); reset(); }} style={{ background: "transparent", border: "none", color: C.greenLt, cursor: "pointer", fontSize: 12 }}>← Sign in</button>}
              {mode === "signin" && <button onClick={() => { setMode("signup"); reset(); }} style={{ background: "transparent", border: "none", color: C.greenLt, cursor: "pointer", fontSize: 12 }}>Create an account</button>}
              {mode === "signin" && <button onClick={() => { setMode("reset"); reset(); }} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>Forgot password?</button>}
              <button onClick={() => { setShowEmail(false); reset(); }} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>Hide email</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function authError(e) {
  const code = e?.code || "";
  if (code.includes("invalid-email")) return "That doesn't look like a valid email.";
  if (code.includes("user-not-found")) return "No account with that email. Try signing up instead.";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Wrong password.";
  if (code.includes("email-already-in-use")) return "That email is already registered. Sign in instead.";
  if (code.includes("weak-password")) return "Password too weak — at least 6 characters.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection.";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again in a few minutes.";
  return e?.message || "Something went wrong.";
}
