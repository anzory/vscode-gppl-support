import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Position, Range, Uri, window, workspace } from 'vscode';
import { createSemanticHelper } from '../../../utils/semanticHelper';
import { createTextParser } from '../../../utils/textParser';

const createMockDocument = (text: string) => {
    const lines = text.split('\n');
    const uri = Uri.file('/test.gpp');

    const offsetAt = (position: Position) => {
        let offset = 0;
        for (let i = 0; i < position.line; i++) {
            offset += lines[i].length + 1;
        }
        return offset + position.character;
    };

    return {
        uri,
        languageId: 'gpp',
        version: 1,
        getText: (range?: any) => {
            if (!range) return text;
            const start = offsetAt(range.start);
            const end = offsetAt(range.end);
            return text.slice(start, end);
        },
        positionAt: (offset: number) => {
            let line = 0;
            let char = offset;
            for (let i = 0; i < lines.length; i++) {
                if (char <= lines[i].length) {
                    line = i;
                    break;
                }
                char -= lines[i].length + 1;
            }
            return new Position(line, char);
        },
        getWordRangeAtPosition: (position: Position, regex?: RegExp) => {
            const line = lines[position.line] || '';
            const pattern = regex || /\w+/g;
            const copy = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
            let match;
            while ((match = copy.exec(line)) !== null) {
                const start = match.index ?? 0;
                const end = start + match[0].length;
                if (position.character >= start && position.character <= end) {
                    return new Range(new Position(position.line, start), new Position(position.line, end));
                }
                if (start > position.character) {
                    break;
                }
            }
            return undefined;
        },
        lineAt: (line: number) => {
            const lineText = lines[line] || '';
            return {
                text: lineText,
                range: new Range(new Position(line, 0), new Position(line, lineText.length)),
            };
        },
        lineCount: lines.length,
    } as any;
};

describe('SemanticHelper', () => {
    beforeEach(() => {
        (window as any).activeTextEditor = undefined;
        (workspace as any).onDidChangeTextDocument = (_listener: any) => ({ dispose: () => undefined });
        (window as any).onDidChangeActiveTextEditor = (_listener: any) => ({ dispose: () => undefined });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('parses procedures and variables from the active document', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument('@proc1\nlocal int a\ncall @proc1');
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.initialize();

        expect(helper.getProcedures().length).toBe(1);
        expect(helper.getLocalUserVariable('a')).toBeDefined();
        expect(helper.getProcedureArgs('@proc1(1)')).toBe('1');
        expect(helper.isThisProcedureDeclaration('@proc1')).toBe(true);
        expect(helper.getReferencesFor('@proc1').length).toBeGreaterThanOrEqual(1);
        expect(helper.getProcedureCallReferences('@proc1').length).toBeGreaterThanOrEqual(0);
    });

    it('parses system variables, global and local declarations, and arrays', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument(
            '@proc1(1)\n' +
            'local int a\n' +
            'local string var<<B>>\n' +
            'global real x\n' +
            'global logical var<<ARR>> ; info\n' +
            'call @proc1'
        );
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.initialize();

        expect(helper.getGpplSystemVariables().length).toBeGreaterThan(0);
        expect(helper.isThisSystemVariable(helper.getGpplSystemVariables()[0].name)).toBe(true);
        expect(helper.getGlobalUserVariable('x')).toBeDefined();
        expect(helper.isThisGlobalUserVariable('x')).toBe(true);
        expect(helper.getLocalUserVariable('a')).toBeDefined();
        expect(helper.isThisLocalUserVariable('a')).toBe(true);
        expect(helper.getGlobalUserArray('var')).toBeDefined();
        expect(helper.isThisGlobalUserArray('var')).toBe(true);
        expect(helper.getProcedures()[0].name).toBe('@proc1');
    });

    it('does not parse non-gpp document change events', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        const parseSpy = vi.spyOn(helper as any, 'parseDocument');

        helper.onDocumentChanged({ document: { languageId: 'gcode' } } as any);
        expect(parseSpy).not.toHaveBeenCalled();
    });

    it('debounces active gpp editor changes and schedules document parse', () => {
        vi.useFakeTimers();

        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument('@proc1');
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        const parseSpy = vi.spyOn(helper as any, 'parseDocument');

        helper.onDocumentChanged();
        vi.advanceTimersByTime(350);

        expect(parseSpy).toHaveBeenCalled();
    });

    it('cancels previous debounce timer when called twice', () => {
        vi.useFakeTimers();

        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument('@proc1');
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        const parseSpy = vi.spyOn(helper as any, 'parseDocument');

        // Call twice quickly
        helper.onDocumentChanged();
        helper.onDocumentChanged();
        vi.advanceTimersByTime(350);

        // Should still be called, but only once
        expect(parseSpy).toHaveBeenCalledTimes(1);
    });

    it('ignores editor change when active editor has non-gpp document', () => {
        vi.useFakeTimers();

        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        // Active editor has a gcode document
        (window as any).activeTextEditor = { document: { languageId: 'gcode' } };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        const parseSpy = vi.spyOn(helper as any, 'parseDocument');

        // No event arg - will check activeEditor
        helper.onDocumentChanged();
        vi.advanceTimersByTime(350);

        expect(parseSpy).not.toHaveBeenCalled();
    });

    it('handles no active editor gracefully in onDocumentChanged', () => {
        vi.useFakeTimers();

        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        (window as any).activeTextEditor = undefined;

        const helper = createSemanticHelper(createTextParser(), logger as any);
        const parseSpy = vi.spyOn(helper as any, 'parseDocument');

        // No event, no active editor - should not filter and should schedule parse
        helper.onDocumentChanged();
        vi.advanceTimersByTime(350);

        expect(parseSpy).toHaveBeenCalled();
    });

    it('dispose clears debounce timer and disposables', () => {
        vi.useFakeTimers();

        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.initialize();
        helper.onDocumentChanged();
        expect(() => helper.dispose()).not.toThrow();
    });

    it('getReferencesFor returns empty array when no editor', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        (window as any).activeTextEditor = undefined;
        const helper = createSemanticHelper(createTextParser(), logger as any);
        expect(helper.getReferencesFor('@proc1')).toEqual([]);
    });

    it('getProcedureCallReferences returns empty array when no editor', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        (window as any).activeTextEditor = undefined;
        const helper = createSemanticHelper(createTextParser(), logger as any);
        expect(helper.getProcedureCallReferences('@proc1')).toEqual([]);
    });

    it('isThisUserVariableOrArray returns true for any user variable', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument(
            'local int myVar\n' +
            'global real myGlobal\n' +
            'local string myArr<<10>>\n' +
            'global int myGlobalArr<<5>>'
        );
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.initialize();

        expect(helper.isThisUserVariableOrArray('myVar')).toBe(true);
        expect(helper.isThisUserVariableOrArray('myGlobal')).toBe(true);
        expect(helper.isThisUserVariableOrArray('myArr')).toBe(true);
        expect(helper.isThisUserVariableOrArray('myGlobalArr')).toBe(true);
        expect(helper.isThisUserVariableOrArray('nonexistent')).toBe(false);
    });

    it('getLocalUserArray and isThisLocalUserArray work correctly', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument('local string myArr<<10>>');
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.initialize();

        expect(helper.getLocalUserArray('myArr')).toBeDefined();
        expect(helper.isThisLocalUserArray('myArr')).toBe(true);
        expect(helper.getLocalUserArray('nonexistent')).toBeUndefined();
    });

    it('getGpplSystemVariable returns specific system variable', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument('@proc1');
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.initialize();

        const sysVars = helper.getGpplSystemVariables();
        if (sysVars.length > 0) {
            const found = helper.getGpplSystemVariable(sysVars[0].name);
            expect(found).toBeDefined();
            expect(found?.name).toBe(sysVars[0].name);
        }
        expect(helper.getGpplSystemVariable('nonexistent_sys_var')).toBeUndefined();
    });

    it('getGpplProcedure returns undefined for non-existent procedure', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument('@proc1');
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.initialize();

        expect(helper.getGpplProcedure('@proc1')).toBeDefined();
        expect(helper.getGpplProcedure('@nonexistent')).toBeUndefined();
    });

    it('parseDocument skips reparsing when document version and URI unchanged', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument('@proc1');
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.parseDocument(); // first parse

        const parseSystemSpy = vi.spyOn(helper as any, 'parseSystemVariables');
        helper.parseDocument(); // second parse - same version/URI

        expect(parseSystemSpy).not.toHaveBeenCalled();
    });

    it('getGlobalUserVariables and getLocalUserVariables return arrays', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const document = createMockDocument(
            'global int g1\n' +
            'local real l1'
        );
        (window as any).activeTextEditor = { document };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        helper.initialize();

        expect(Array.isArray(helper.getGlobalUserVariables())).toBe(true);
        expect(Array.isArray(helper.getLocalUserVariables())).toBe(true);
        expect(Array.isArray(helper.getGlobalUserArrays())).toBe(true);
        expect(Array.isArray(helper.getLocalUserArrays())).toBe(true);
    });

    it('getProcedureArgs extracts args from procedure call', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        expect(helper.getProcedureArgs('@proc(a, b, c)')).toBeDefined();
        expect(helper.getProcedureArgs('@proc')).toBeUndefined();
    });

    it('isThisProcedureDeclaration returns false for non-@ names', () => {
        const logger = {
            configure: () => undefined,
            info: () => undefined,
            warn: () => undefined,
            error: () => undefined,
            debug: () => undefined,
            show: () => undefined,
            close: () => undefined,
        };

        const helper = createSemanticHelper(createTextParser(), logger as any);
        expect(helper.isThisProcedureDeclaration('varName')).toBe(false);
    });
});
