import React, { useEffect } from "react";
; // Adjust path as needed



const Toaster = ({ isOpen, message, type, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "0px",
        right: "0px",
        zIndex: 1000,
        width: "320px",
        padding: "23px 20px",
        borderRadius: "8px",
        backgroundColor: type === "success" ? "#4C9A2A" : "#dc3545",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        transform: isOpen ? "translateX(0)" : "translateX(360px)",
        opacity: isOpen ? 1 : 0,
        transition: "transform 0.9s ease-in-out, opacity 0.9s ease-in-out",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: "400", lineHeight: "1.5" }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          transition: "opacity 0.2s ease-in-out",
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
 
      </button>
    </div>
  );
};

export default Toaster;