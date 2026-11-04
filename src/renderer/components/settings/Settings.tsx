/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./settings.css";
import { classNameFactory } from "@vencord/types/api/Styles";
import { Button, Divider, ErrorBoundary, Text } from "@vencord/types/components";
import { ComponentType } from "react";
import { WebRTCIPHandlingPolicyPicker } from "renderer/components/settings/WebRTCIPHandlingPolicyPicker";
import { getValueAndOnChange, Settings, useSettings } from "renderer/settings";
import { isMac } from "renderer/utils";

import { AutoStartToggle } from "./AutoStartToggle";
import { DeveloperOptionsButton } from "./DeveloperOptions";
import { DiscordBranchPicker } from "./DiscordBranchPicker";
import { NotificationBadgeToggle } from "./NotificationBadgeToggle";
import { UserAssetsButton } from "./UserAssets";
import { VesktopSettingsSwitch } from "./VesktopSettingsSwitch";
import { WindowsTransparencyControls } from "./WindowsTransparencyControls";

interface BooleanSetting {
    key: keyof typeof Settings.store;
    title: string;
    description: string;
    disabled?(): boolean;
    invisible?(): boolean;
}

export const cl = classNameFactory("vcd-settings-");

export type SettingsComponent = ComponentType<{ settings: typeof Settings.store }>;

const SettingsOptions: Record<string, Array<BooleanSetting | SettingsComponent>> = {
    "Versão do Discord": [DiscordBranchPicker],
    "Inicialização e desempenho": [
        AutoStartToggle,
        {
            key: "hardwareAcceleration",
            title: "Aceleração por hardware",
            description: "Usa a placa de vídeo para ajudar a desenhar a interface."
        },
        {
            key: "hardwareVideoAcceleration",
            title: "Aceleração de vídeo",
            description:
                "Pode melhorar a reprodução e a transmissão, mas em alguns computadores causa falhas visuais. Reinicie após mudar.",
            disabled: () => !Settings.store.hardwareAcceleration
        }
    ],
    "Aparência da janela": [
        {
            key: "nativeTitleBar",
            title: "Barra de título do Windows",
            description: "Mostra a barra de título do sistema. Exige reiniciar o aplicativo."
        },
        {
            key: "staticTitle",
            title: "Título fixo",
            description: 'Mantém "SeCord" no título da janela.'
        },
        {
            key: "enableMenu",
            title: "Barra de menu",
            description: "Mostra o menu do aplicativo. Pressione Alt para alternar a visibilidade.",
            disabled: () => !Settings.store.nativeTitleBar
        },
        {
            key: "enableShadow",
            title: "Sombra da janela",
            description: "Mostra a sombra ao redor da janela. Exige reiniciar.",
            disabled: () => Settings.store.nativeTitleBar
        },
        {
            key: "enableRoundedCorners",
            title: "Cantos arredondados",
            description: "Arredonda os cantos da janela. Exige reiniciar.",
            disabled: () => Settings.store.nativeTitleBar
        },
        {
            key: "enableSplashScreen",
            title: "Tela de abertura",
            description:
                "Mostra a logo enquanto o SeCord carrega."
        },
        {
            key: "splashTheming",
            title: "Cores da tela de abertura",
            description: "Adapta a tela de abertura às cores do seu tema."
        },
        WindowsTransparencyControls,
        UserAssetsButton
    ],
    Comportamento: [
        {
            key: "tray",
            title: "Ícone na bandeja",
            description: "Mantém um ícone do SeCord perto do relógio do Windows.",
            invisible: () => isMac
        },
        {
            key: "minimizeToTray",
            title: "Minimizar ao fechar",
            description: "O botão X esconde o SeCord na bandeja em vez de encerrá-lo.",
            invisible: () => isMac,
            disabled: () => !Settings.store.tray
        },
        {
            key: "clickTrayToShowHide",
            title: "Alternar janela pelo ícone",
            description: "Clique no ícone da bandeja para mostrar ou esconder a janela."
        },
        {
            key: "disableMinSize",
            title: "Permitir janela menor",
            description: "Deixa reduzir a janela abaixo do tamanho mínimo padrão."
        },
        {
            key: "disableSmoothScroll",
            title: "Desativar rolagem suave",
            description: "Usa rolagem imediata nas listas e mensagens."
        }
    ],
    Notificações: [
        NotificationBadgeToggle,
        {
            key: "enableTaskbarFlashing",
            title: "Piscar na barra de tarefas",
            description: "Chama a atenção para novas notificações na barra de tarefas."
        }
    ],
    "Voz e clipes": [
        () => (
            <div>
                <Text size="md">Grave o som reproduzido no computador e salve os últimos 30, 60 ou 120 segundos. A captura começa somente depois do seu clique.</Text>
                <div style={{ marginTop: 12 }}><Button onClick={() => VesktopNative.app.openClips()}>Abrir clipes de áudio</Button></div>
            </div>
        )
    ],
    Outros: [
        {
            key: "arRPC",
            title: "Rich Presence",
            description: "Mostra a atividade de jogos e aplicativos no seu perfil, se você permitir."
        },

        {
            key: "openLinksWithElectron",
            title: "Abrir links no aplicativo (experimental)",
            description: "Abre links em outra janela do SeCord."
        },

        WebRTCIPHandlingPolicyPicker
    ],

    "Desenvolvimento": [DeveloperOptionsButton]
};

function SettingsSections() {
    const Settings = useSettings();

    const sections = Object.entries(SettingsOptions).map(([title, settings], i, arr) => (
        <div key={title} className={cl("category")}>
            <Text size="lg" weight="semibold" tag="h3" className={cl("category-title")}>
                {title}
            </Text>

            <div className={cl("category-content")}>
                {settings.map((Setting, i) => {
                    if (typeof Setting === "function") return <Setting key={`Custom-${i}`} settings={Settings} />;

                    const { title, description, key, disabled, invisible } = Setting;
                    if (invisible?.()) return null;

                    return (
                        <VesktopSettingsSwitch
                            title={title}
                            description={description}
                            disabled={disabled?.()}
                            {...getValueAndOnChange(key)}
                            key={key}
                        />
                    );
                })}
            </div>

            {i < arr.length - 1 && <Divider className={cl("category-divider")} />}
        </div>
    ));

    return <>{sections}</>;
}

export default ErrorBoundary.wrap(
    function SettingsUI() {
        return (
            <section>
                <SettingsSections />
            </section>
        );
    },
    {
        message: "Não foi possível abrir os ajustes do SeCord. Reinicie o aplicativo."
    }
);
