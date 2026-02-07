import "../styles/Footer.css";
import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-bottom">
            Rugby Discover Cymru, WRU
        </p>

      </div>

      <p className="footer-bottom">
        © {new Date().getFullYear()} HALP. All rights reserved.
      </p>
    </footer>
  );
}
