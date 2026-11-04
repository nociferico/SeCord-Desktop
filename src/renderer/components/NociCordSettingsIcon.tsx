/*
 * SeCord desktop custom branding
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SVGProps } from "react";

export function NociCordSettingsIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
            <image href="vesktop://static/secord-logo.png" x="0" y="0" width="32" height="32" />
        </svg>
    );
}
