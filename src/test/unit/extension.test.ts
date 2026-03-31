import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { getConstants, resetConstants } from '../../utils/constants';

vi.mock('../../utils/config', () => {
    const Config = vi.fn().mockImplementation(function (this: any) {
        this.configure = vi.fn();
    });
    return { Config };
});

import * as extension from '../../extension';

const createMockExtensionContext = () => ({
    subscriptions: [] as Array<{ dispose(): any }>,
    extensionMode: 0,
} as unknown as vscode.ExtensionContext);

const createMockDocument = () => ({
    uri: vscode.Uri.file('/test.gpp'),
    languageId: 'gpp',
} as any);

describe('extension activation', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        resetConstants();
        (vscode.window as any).activeTextEditor = undefined;
        (vscode.window as any).visibleTextEditors = [];
        (vscode.workspace as any).applyEdit = vi.fn().mockResolvedValue(true);
    });

    it('should activate and register commands/providers without throwing', async () => {
        const spyCompletion = vi.spyOn(vscode.languages, 'registerCompletionItemProvider');
        const spyHover = vi.spyOn(vscode.languages, 'registerHoverProvider');
        const spyCodeLens = vi.spyOn(vscode.languages, 'registerCodeLensProvider');
        const spySymbols = vi.spyOn(vscode.languages, 'registerDocumentSymbolProvider');
        const spyDefinition = vi.spyOn(vscode.languages, 'registerDefinitionProvider');
        const spyReference = vi.spyOn(vscode.languages, 'registerReferenceProvider');
        const spyFormatting = vi.spyOn(vscode.languages, 'registerDocumentFormattingEditProvider');
        const spyRegisterCommand = vi.spyOn(vscode.commands, 'registerCommand');

        const context = createMockExtensionContext();

        await expect(extension.activate(context)).resolves.not.toThrow();
        expect(context.subscriptions.length).toBeGreaterThanOrEqual(1);
        expect(spyCompletion).toHaveBeenCalled();
        expect(spyHover).toHaveBeenCalled();
        expect(spyCodeLens).toHaveBeenCalled();
        expect(spySymbols).toHaveBeenCalled();
        expect(spyDefinition).toHaveBeenCalled();
        expect(spyReference).toHaveBeenCalled();
        expect(spyFormatting).toHaveBeenCalled();
        expect(spyRegisterCommand).toHaveBeenCalled();
    });

    it('should register command callbacks and execute commands correctly', async () => {
        const callbacks: Record<string, (...args: any[]) => any> = {};
        vi.spyOn(vscode.commands, 'registerCommand').mockImplementation((command: string, callback: (...args: any[]) => any) => {
            callbacks[command] = callback;
            return { dispose: () => undefined } as any;
        });
        const spyExecuteCommand = vi.spyOn(vscode.commands, 'executeCommand').mockResolvedValue([]);

        (vscode.window as any).activeTextEditor = {
            document: createMockDocument(),
        };

        const context = createMockExtensionContext();
        await extension.activate(context);

        const constants = getConstants();
        await callbacks[constants.commands.formatDocument]?.();
        expect(spyExecuteCommand).toHaveBeenCalledWith('vscode.executeFormatDocumentProvider', createMockDocument().uri);

        const locations = [
            new vscode.Location(createMockDocument().uri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 1))),
        ];
        await callbacks[constants.commands.showProcedureReferences]?.(createMockDocument().uri, new vscode.Position(0, 0), locations);
        expect(spyExecuteCommand).toHaveBeenCalledWith('editor.action.showReferences', createMockDocument().uri, new vscode.Position(0, 0), locations);
    });

    it('should recreate providers when gpp configuration changes', async () => {
        const spyComplete = vi.spyOn(vscode.languages, 'registerCompletionItemProvider');
        const spyExecuteCommand = vi.spyOn(vscode.commands, 'executeCommand').mockResolvedValue(undefined);
        let configListener: any;

        (vscode.workspace as any).onDidChangeConfiguration = (listener: any) => {
            configListener = listener;
            return { dispose: () => undefined };
        };

        (vscode.window as any).visibleTextEditors = [
            { document: { languageId: 'gpp' } },
        ];

        const context = createMockExtensionContext();
        await extension.activate(context);
        expect(spyComplete).toHaveBeenCalledTimes(1);

        configListener({ affectsConfiguration: (section: string) => section === 'gpp' });

        expect(spyComplete).toHaveBeenCalledTimes(2);
        expect(spyExecuteCommand).toHaveBeenCalledWith('editor.action.formatDocument');
    });

    it('should deactivate without throwing even when not previously activated', () => {
        expect(() => extension.deactivate()).not.toThrow();
    });
});
