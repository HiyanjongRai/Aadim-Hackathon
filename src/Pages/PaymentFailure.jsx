export default function PaymentFailure() {
  return (
    <div style={{ minHeight:"100vh", background:"#060b14", display:"flex",
      alignItems:"center", justifyContent:"center", fontFamily:"monospace" }}>
      <div style={{ maxWidth:400, textAlign:"center", padding:36,
        background:"#0a1628", border:"1px solid rgba(255,80,80,0.3)",
        borderTop:"3px solid #ef4444", borderRadius:16 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>❌</div>
        <div style={{ fontSize:20, fontWeight:700, color:"#ff6666",
          fontFamily:"Georgia,serif", marginBottom:12 }}>Payment Failed</div>
        <div style={{ fontSize:11, color:"#6b7280", marginBottom:24 }}>
          Your payment was not completed or was cancelled.<br />
          Your registration slot is still held — please try again.
        </div>
        <button onClick={() => window.history.back()}
          style={{ padding:"11px 24px", background:"transparent",
            border:"1px solid rgba(255,255,255,0.15)", borderRadius:8,
            color:"#6b7280", cursor:"pointer", fontSize:12 }}>
          ← TRY AGAIN
        </button>
      </div>
    </div>
  );
}