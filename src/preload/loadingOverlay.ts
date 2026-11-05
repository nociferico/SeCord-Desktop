/*
 * SeCord, a separate Discord desktop app
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { webFrame } from "electron/renderer";

const styles = `
    #secord-loading {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #160e25;
        color: #eeeaf4;
        font: 14px "Segoe UI", system-ui, sans-serif;
    }
    #secord-loading img {
        width: 176px;
        height: 176px;
        object-fit: contain;
        animation: secord-logo-enter 450ms ease-out both, secord-logo-breathe 2.6s ease-in-out 450ms infinite;
    }
    #secord-loading .secord-loading-title { margin-top: 3px; font-weight: 600; }
    #secord-loading .secord-loading-tip { margin-top: 42px; color: #b7aec4; font-size: 13px; }
    #secord-loading .secord-loading-dots { display: flex; gap: 6px; margin-top: 16px; }
    #secord-loading .secord-loading-dots span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #b9a4ed;
        animation: secord-dot-pulse 1.3s ease-in-out infinite;
    }
    #secord-loading .secord-loading-dots span:nth-child(2) { animation-delay: 150ms; }
    #secord-loading .secord-loading-dots span:nth-child(3) { animation-delay: 300ms; }
    @keyframes secord-logo-enter {
        from { opacity: 0; transform: scale(0.94); }
        to { opacity: 1; transform: scale(1); }
    }
    @keyframes secord-logo-breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.025); }
    }
    @keyframes secord-dot-pulse {
        0%, 100% { opacity: 0.35; transform: scale(0.85); }
        50% { opacity: 1; transform: scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
        #secord-loading img, #secord-loading .secord-loading-dots span { animation: none; }
    }
`;

export function showSeCordLoading() {
    const show = () => {
        if (document.getElementById("secord-loading")) return;

        const overlay = document.createElement("div");
        overlay.id = "secord-loading";
        overlay.setAttribute("role", "status");

        const logo = document.createElement("img");
        logo.src = "vesktop://static/secord-loading-logo.png";
        logo.alt = "";
        overlay.append(logo);

        const title = document.createElement("div");
        title.className = "secord-loading-title";
        title.textContent = "Abrindo SeCord...";
        overlay.append(title);

        const dots = document.createElement("div");
        dots.className = "secord-loading-dots";
        dots.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 3; i++) dots.append(document.createElement("span"));
        overlay.append(dots);

        const tip = document.createElement("div");
        tip.className = "secord-loading-tip";
        tip.textContent = "Ctrl + / abre a lista de atalhos.";
        overlay.append(tip);

        document.body.append(overlay);
        const styleKey = webFrame.insertCSS(styles);

        const remove = () => {
            overlay.remove();
            webFrame.removeInsertedCSS(styleKey);
        };

        const ready = () => Boolean(document.querySelector("#app-mount nav, #app-mount [role=navigation], #app-mount input[type=password]"));
        const check = () => {
            if (!ready()) return;
            clearInterval(interval);
            clearTimeout(timeout);
            remove();
        };
        const interval = setInterval(check, 200);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            remove();
        }, 20000);
        check();
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show, { once: true });
    else show();
}
