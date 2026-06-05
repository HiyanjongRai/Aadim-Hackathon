import { useEffect, useState, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import BASE_URL from "../Redux/Slices/baseUrl.ts";

export default function PaymentSuccess() {
  const [params]  = useSearchParams();
  const location  = useLocation();

  const data     = params.get("data") || "";
  const pidx     = params.get("pidx") || "";

  const providerFromPath = location.pathname.split("/").pop();
  const provider = ["esewa", "khalti"].includes(providerFromPath)
    ? providerFromPath
    : params.get("provider") || "";

  const [state,  setState]  = useState("loading");
  const [result, setResult] = useState({
    registrationId: "",
    teamName: "",
    ticketUrl: "",
    message: "",
  });

  // Guard against React 18 StrictMode double-invoke and any other re-fires
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const pendingRaw = localStorage.getItem("pendingRegistration");
    const pending    = pendingRaw ? JSON.parse(pendingRaw) : null;

    async function verify() {
      try {
        if (!pending) {
          setState("fail");
          setResult({
            registrationId: "",
            teamName: "",
            ticketUrl: "",
            message: "Registration data not found. Please try registering again.",
          });
          return;
        }

        let url  = "";
        let body = {};

        if (provider === "esewa" && data) {
          url  = `${BASE_URL}/payment/esewa/verify-and-register`;
          body = { data, teamName: pending.teamName, members: pending.members };
        } else if (provider === "khalti" && pidx) {
          url  = `${BASE_URL}/payment/khalti/verify-and-register`;
          body = { pidx, teamName: pending.teamName, members: pending.members };
        } else {
          setState("fail");
          setResult({
            registrationId: "",
            teamName: "",
            ticketUrl: "",
            message: `Invalid payment callback. provider="${provider}" data="${data}" pidx="${pidx}"`,
          });
          return;
        }

        const res  = await fetch(url, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        const json = await res.json();

        if (json.success && json.data?.success) {
          setState("success");
          setResult({
            registrationId: json.data.registrationId,
            teamName:       json.data.teamName,
            ticketUrl:      json.data.ticketDownloadUrl,
            message:        "",
          });
          localStorage.removeItem("pendingRegistration");
          localStorage.removeItem("pendingTeamName");
        } else {
          setState("fail");
          setResult({
            registrationId: "",
            teamName: "",
            ticketUrl: "",
            message: json.data?.message || json.message || "Verification failed.",
          });
        }
      } catch {
        setState("fail");
        setResult({
          registrationId: "",
          teamName: "",
          ticketUrl: "",
          message: "Network error during verification.",
        });
      }
    }

    verify();
  }, [data, pidx, provider]);

  const apiOrigin = BASE_URL.replace(/\/api\/?$/, "");

  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     "#060b14",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        20,
        fontFamily:     "monospace",
      }}
    >
      <div
        style={{
          width:        "100%",
          maxWidth:     480,
          background:   "#0a1628",
          border:       "1px solid rgba(245,158,11,0.3)",
          borderTop:    "3px solid #f59e0b",
          borderRadius: 16,
          padding:      36,
          textAlign:    "center",
          boxShadow:    "0 0 60px rgba(245,158,11,0.1)",
        }}
      >
        {state === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <div style={{ fontSize: 14, color: "#f59e0b", letterSpacing: ".2em" }}>
              VERIFYING PAYMENT...
            </div>
          </>
        )}

        {state === "success" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏁</div>

            <div
              style={{
                fontSize:     22,
                fontWeight:   700,
                color:        "#fff",
                fontFamily:   "Georgia, serif",
                marginBottom: 8,
              }}
            >
              You're on the Grid!
            </div>

            <div style={{ fontSize: 11, color: "#3a5878", marginBottom: 24 }}>
              {result.teamName} · Payment Confirmed & Registered
            </div>

            <div
              style={{
                padding:      "16px 20px",
                background:   "rgba(245,158,11,0.08)",
                border:       "1px solid rgba(245,158,11,0.3)",
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize:      9,
                  color:         "#f59e0b",
                  letterSpacing: ".2em",
                  marginBottom:  6,
                }}
              >
                REGISTRATION ID
              </div>
              <div style={{ fontSize: 22, color: "#fff", fontWeight: 700 }}>
                {result.registrationId}
              </div>
            </div>

            <a
              href={`${apiOrigin}${result.ticketUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:        "inline-block",
                padding:        "13px 28px",
                background:     "#f59e0b",
                borderRadius:   8,
                color:          "#000",
                fontWeight:     700,
                fontSize:       12,
                letterSpacing:  ".12em",
                textDecoration: "none",
                boxShadow:      "0 0 20px rgba(245,158,11,0.4)",
              }}
            >
              ⬇ DOWNLOAD YOUR TICKET (PDF)
            </a>

            <div
              style={{
                marginTop:     16,
                fontSize:      9,
                color:         "#2a3f55",
                letterSpacing: ".1em",
              }}
            >
              A PDF ticket has been generated. Save it for check-in.
            </div>
          </>
        )}

        {state === "fail" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>

            <div
              style={{
                fontSize:     20,
                fontWeight:   700,
                color:        "#ff6666",
                fontFamily:   "Georgia, serif",
                marginBottom: 8,
              }}
            >
              Payment Failed
            </div>

            <div
              style={{
                padding:      "12px 16px",
                background:   "rgba(255,50,50,0.08)",
                border:       "1px solid rgba(255,80,80,0.25)",
                borderRadius: 8,
                fontSize:     11,
                color:        "#ff8888",
                marginBottom: 24,
              }}
            >
              {result.message || "Your payment could not be verified."}
            </div>

            <button
              onClick={() => window.history.back()}
              style={{
                padding:      "11px 24px",
                background:   "transparent",
                border:       "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                color:        "#6b7280",
                cursor:       "pointer",
                fontSize:     12,
              }}
            >
              ← GO BACK
            </button>
          </>
        )}
      </div>
    </div>
  );
}