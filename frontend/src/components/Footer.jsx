import React from 'react';
import vasmiIcon from '../assets/vasmi_icon.png';

/**
 * Universal Footer for QR-Reviews platform
 * 
 * Requirements:
 * 1. © 2026 QR-Review.
 * 2. [Designed and Developed by](https://vasmigroup.com/) on click add this link.
 * 3. On hover of [Designed and Developed by] - change color to orange.
 * 4. On logo, on hover small zoom out (scale 0.88).
 */
export default function Footer({ customStyle = {}, transparent = false }) {
  return (
    <footer
      className={`app-footer ${transparent ? 'app-footer-transparent' : ''}`}
      style={customStyle}
    >
      <div className="app-footer-left">
        <span>© 2026 QR-Review.</span>
      </div>

      <div className="app-footer-right">
        <a
          href="https://vasmigroup.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="vasmi-dev-link"
          title="Designed and Developed by Vasmi Group - https://vasmigroup.com"
          id="link-vasmi-group"
        >
          <span className="vasmi-dev-text">Designed and Developed by</span>
          <span className="vasmi-brand-name">
            <span className="vasmi-brand-white">Vasmi</span>
            <span className="vasmi-brand-orange">Group</span>
          </span>
          <span className="vasmi-logo-wrapper">
            <img
              src={vasmiIcon}
              alt="Vasmi Group"
              className="vasmi-logo-img"
              width="16"
              height="14"
            />

          </span>
        </a>
      </div>
    </footer>
  );
}
