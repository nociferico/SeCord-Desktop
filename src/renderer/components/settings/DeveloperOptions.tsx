/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, Heading } from "@vencord/types/components";
import { Modal, openModal } from "@vencord/types/webpack/common";

import { cl, SettingsComponent } from "./Settings";

export const DeveloperOptionsButton: SettingsComponent = () => {
    return <Button onClick={openDeveloperOptionsModal}>Opções de desenvolvimento</Button>;
};

function openDeveloperOptionsModal() {
    openModal(props => (
        <Modal {...props} size="lg" title="SeCord: desenvolvimento">
            <Heading tag="h4">Diagnóstico</Heading>
            <div className={cl("button-grid")}>
                <Button onClick={() => VesktopNative.debug.launchGpu()}>Abrir chrome://gpu</Button>
                <Button onClick={() => VesktopNative.debug.launchWebrtcInternals()}>
                    Abrir chrome://webrtc-internals
                </Button>
            </div>
        </Modal>
    ));
}
