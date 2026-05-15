"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const COLORS = {
  navy: "#1F3A5F",
  teal: "#0891B2",
  bg: "#F0F4F8",
  white: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  border: "#E2E8F0",
  error: "#EF4444",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F172A 100%)`,
      padding: 20
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: 400, 
        background: COLORS.white, 
        borderRadius: 24, 
        padding: 40, 
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" 
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ 
            width: 50, 
            height: 50, 
            borderRadius: 12, 
            background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.teal})`, 
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 16px rgba(0,0,0,0.2)"
          }}>
             <span style={{ color: "white", fontWeight: 900, fontSize: 24 }}>G</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.textPrimary, margin: 0 }}>Portal Access</h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 8 }}>Authorized Educators Only</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          {error && (
            <div style={{ 
              padding: "12px 16px", 
              borderRadius: 12, 
              background: "#FEF2F2", 
              border: "1px solid #FEE2E2", 
              color: COLORS.error, 
              fontSize: 13, 
              fontWeight: 600 
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="educator@gedportal.edu"
              style={{ 
                width: "100%", 
                padding: "14px 16px", 
                borderRadius: 12, 
                border: `2px solid ${COLORS.border}`, 
                outline: "none",
                fontSize: 15,
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = COLORS.teal}
              onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ 
                width: "100%", 
                padding: "14px 16px", 
                borderRadius: 12, 
                border: `2px solid ${COLORS.border}`, 
                outline: "none",
                fontSize: 15,
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = COLORS.teal}
              onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "16px", 
              borderRadius: 12, 
              background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.teal})`, 
              color: "white", 
              fontWeight: 800, 
              fontSize: 16, 
              border: "none", 
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 10px 15px -3px rgba(8, 145, 178, 0.3)",
              marginTop: 10
            }}
          >
            {loading ? "Verifying..." : "Sign In to Portal"}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: COLORS.textSecondary, margin: 0 }}>
            Contact IT if you've lost access.
          </p>
        </div>
      </div>
    </div>
  );
}
