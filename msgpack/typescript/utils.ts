/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and assuka
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const toAlphabeticIndex = (index: number): string => {
    let result = "";
    while (index >= 0) {
        result = String.fromCharCode(97 + (index % 26)) + result;
        index = Math.floor(index / 26) - 1;
    }
    return result || "a";
};

const fromAlphabeticIndex = (str: string): number => {
    let index = 0;
    for (let i = 0; i < str.length; i++) {
        index = index * 26 + (str.charCodeAt(i) - 97 + 1);
    }
    return index - 1;
};

export const toLetterKeys = <T extends object>(obj: T): Record<string, unknown> => {
    const entries = Object.entries(obj);
    return entries.reduce((acc, [, value], index) => ({
        ...acc,
        [toAlphabeticIndex(index)]: value
    }), {} as Record<string, unknown>);
};

export const fromLetterKeys = <T extends object>(
    obj: Record<string, unknown>,
    interfaceKeys: (keyof T)[]
): T => {
    const entries = Object.entries(obj);
    return entries.reduce((acc, [key, value]) => ({
        ...acc,
        [interfaceKeys[fromAlphabeticIndex(key)]]: value
    }), {} as T);
};
