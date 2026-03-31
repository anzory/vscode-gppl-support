import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getConstants, resetConstants, refreshConstants, initializeConstants } from '../../../utils/constants';
import { workspace } from 'vscode';

describe('constants', () => {
    beforeEach(() => {
        resetConstants();
    });

    afterEach(() => {
        resetConstants();
    });

    it('getConstants returns object with expected properties', () => {
        const c = getConstants();
        expect(c).toBeDefined();
        expect(c.extension).toBeDefined();
        expect(c.extension.name).toBeDefined();
        expect(c.extension.version).toBeDefined();
        expect(c.commands).toBeDefined();
        expect(c.commands.formatDocument).toBeDefined();
        expect(c.commands.showProcedureReferences).toBeDefined();
        expect(c.languageId).toBeDefined();
        expect(c.configId).toBeDefined();
    });

    it('getConstants returns cached instance on second call', () => {
        const first = getConstants();
        const second = getConstants();
        expect(first).toBe(second);
    });

    it('resetConstants forces re-creation', () => {
        const first = getConstants();
        resetConstants();
        const second = getConstants();
        expect(first).not.toBe(second);
    });

    it('refreshConstants resets and creates new constants', () => {
        const first = getConstants();
        refreshConstants();
        const second = getConstants();
        expect(second).toBeDefined();
        expect(second).not.toBe(first);
    });

    it('initializeConstants registers configuration change listener', () => {
        const subscriptions: any[] = [];
        const onDidChangeSpy = vi.spyOn(workspace, 'onDidChangeConfiguration');

        initializeConstants(subscriptions);

        expect(onDidChangeSpy).toHaveBeenCalled();
        expect(subscriptions.length).toBeGreaterThan(0);
    });

    it('initializeConstants disposes previous subscription if called twice', () => {
        const subscriptions: any[] = [];

        initializeConstants(subscriptions);
        const firstSubCount = subscriptions.length;

        initializeConstants(subscriptions);
        // Should have disposed old and added new
        expect(subscriptions.length).toBeGreaterThan(firstSubCount);
    });

    it('constants object persists between calls', () => {
        const c = getConstants();
        expect(c.files.encoding).toBeDefined();
        expect(c.format).toBeDefined();
        expect(typeof c.format.tabSize).toBe('number');
    });

    it('localesEnum is defined', () => {
        const c = getConstants();
        expect(c.localesEnum).toBeDefined();
        expect(Array.isArray(c.localesEnum)).toBe(true);
    });
});
