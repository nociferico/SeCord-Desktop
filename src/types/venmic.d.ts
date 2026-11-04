/*
 * NociCord desktop compatibility types for Linux-only optional venmic.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

declare module "@vencord/venmic" {
    export type Node = Record<string, string>;

    export interface LinkData {
        mute: boolean;
        include: Node[];
        exclude: Node[];
        only_speakers?: boolean;
        ignore_devices?: boolean;
        only_default_speakers?: boolean;
        workaround?: Node[];
    }

    export class PatchBay {
        static hasPipeWire(): boolean;
        list(exclude: string[]): Node[];
        link(data: LinkData): unknown;
        unmute(): unknown;
        unlink(): unknown;
    }
}
