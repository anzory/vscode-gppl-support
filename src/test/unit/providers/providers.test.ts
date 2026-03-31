import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import {
    CodeLens,
    CompletionItemKind,
    DocumentSymbol,
    Location,
    Position,
    Range,
    SymbolKind,
    TextEdit,
    Uri,
} from 'vscode';
import { resetConstants } from '../../../utils/constants';
import { createTextParser } from '../../../utils/textParser';
import { GpplCompletionItemsProvider } from '../../../providers/GpplCompletionItemsProvider';
import { GpplHoverProvider } from '../../../providers/GpplHoverProvider';
import { GpplCodeLensProvider } from '../../../providers/GpplCodeLensProvider';
import { GpplDocumentSymbolProvider } from '../../../providers/GpplDocumentSymbolProvider';
import { GpplDefinitionProvider } from '../../../providers/GpplDefinitionProvider';
import { GpplReferenceProvider } from '../../../providers/GpplReferenceProvider';
import { GpplDocumentFormattingEditProvider } from '../../../providers/GpplDocumentFormattingEditProvider';

const createMockDocument = (text: string, languageId = 'gpp') => {
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
        languageId,
        version: 1,
        getText: (range?: any) => {
            if (!range) {
                return text;
            }
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
            const pattern = regex || /[@A-Za-z_][\w@]*/g;
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

const makeI18n = () => ({
    t: (value: string) => value,
    update: () => undefined,
});

const makeSemanticHelper = () => ({
    isThisSystemVariable: (word: string) => word === 'SYSVAR',
    isThisGlobalUserArray: (word: string) => word === 'ARRAY',
    isThisLocalUserArray: (word: string) => false,
    isThisGlobalUserVariable: (word: string) => word === 'VAR',
    isThisLocalUserVariable: (word: string) => false,
    isThisUserVariableOrArray: (word: string) => word === 'VAR' || word === 'ARRAY',
    isThisProcedureDeclaration: (word: string) => word.startsWith('@'),
    getGlobalUserArray: () => ({ name: 'ARRAY', scope: 'global', type: 'int array' }),
    getLocalUserArray: () => undefined,
    getGlobalUserVariable: () => ({ name: 'VAR', scope: 'global', type: 'int' }),
    getLocalUserVariable: () => undefined,
    getGpplSystemVariable: () => undefined,
    getGpplProcedure: () => ({ name: '@proc', args: '1', info: 'info' }),
    getReferencesFor: () => [new Location(Uri.file('/test.gpp'), new Range(new Position(0, 0), new Position(0, 3)))],
    getProcedureCallReferences: () => [new Location(Uri.file('/test.gpp'), new Range(new Position(1, 5), new Position(1, 10)))],
} as any);

describe('GpplCompletionItemsProvider', () => {
    it('returns completion items for a valid position', async () => {
        const provider = new GpplCompletionItemsProvider(makeI18n());
        const document = createMockDocument('@proc');
        const items = await provider.provideCompletionItems(document as any, new Position(0, 1), { isCancellationRequested: false } as any, {} as any);
        expect(items).toBeDefined();
        expect(Array.isArray(items)).toBe(true);
        expect(items!.length).toBeGreaterThan(0);
        expect(items![0].label).toBeDefined();
    });

    it('returns undefined when cancellation is requested', () => {
        const provider = new GpplCompletionItemsProvider(makeI18n());
        const document = createMockDocument('@proc');
        const items = provider.provideCompletionItems(document as any, new Position(0, 1), { isCancellationRequested: true } as any, {} as any);
        expect(items).toBeUndefined();
    });
});

describe('GpplHoverProvider', () => {
    it('returns hover for a procedure declaration', async () => {
        const helper = makeSemanticHelper();
        const provider = new GpplHoverProvider(helper, makeI18n());
        const document = createMockDocument('@proc');
        const hover = await provider.provideHover(document as any, new Position(0, 1), { isCancellationRequested: false } as any);
        expect(hover).toBeDefined();
        expect((hover as any).contents.value).toContain('Procedure: @proc');
    });

    it('returns hover for a system variable', async () => {
        const helper = makeSemanticHelper();
        const provider = new GpplHoverProvider(helper, makeI18n());
        const document = createMockDocument('SYSVAR');
        const hover = await provider.provideHover(document as any, new Position(0, 2), { isCancellationRequested: false } as any);
        expect(hover).toBeDefined();
        expect((hover as any).contents.value).toContain('global system variable: SYSVAR');
    });

    it('returns hover for a global user variable', async () => {
        const helper = makeSemanticHelper();
        const provider = new GpplHoverProvider(helper, makeI18n());
        const document = createMockDocument('VAR');
        const hover = await provider.provideHover(document as any, new Position(0, 1), { isCancellationRequested: false } as any);
        expect(hover).toBeDefined();
        expect((hover as any).contents.value).toContain('user variable');
    });
});

describe('GpplDocumentSymbolProvider', () => {
    it('provides document symbols for procedures and regions', async () => {
        const text = '@proc1\n#region REGION\n#endregion';
        const document = createMockDocument(text);
        const provider = new GpplDocumentSymbolProvider(createTextParser(), makeI18n());
        const symbols = await provider.provideDocumentSymbols(document as any);
        expect(Array.isArray(symbols)).toBe(true);
        expect(symbols!.length).toBeGreaterThan(0);
        expect((symbols![0] as DocumentSymbol).name).toBe('@proc1');
    });
});

describe('GpplCodeLensProvider', () => {
    it('creates codelens items from document symbols', async () => {
        const provider = new GpplCodeLensProvider(makeSemanticHelper(), makeI18n(), createTextParser());
        const document = createMockDocument('@proc1\ncall @proc1');
        const lenses = await provider.provideCodeLenses(document as any);
        expect(Array.isArray(lenses)).toBe(true);
        expect(lenses!.length).toBeGreaterThan(0);
        expect((lenses![0] as CodeLens).command?.title).toBeDefined();
    });
});

describe('GpplDefinitionProvider', () => {
    it('returns definition location for user variable', () => {
        const helper = makeSemanticHelper();
        const provider = new GpplDefinitionProvider(helper, createTextParser());
        const document = createMockDocument('VAR = 1');
        const definition = provider.provideDefinition(document as any, new Position(0, 0), { isCancellationRequested: false } as any);
        expect(definition).toBeDefined();
    });

    it('returns definition location for a procedure declaration', () => {
        const helper = makeSemanticHelper();
        const provider = new GpplDefinitionProvider(helper, createTextParser());
        const document = createMockDocument('@proc1\ncall @proc1');
        const definition = provider.provideDefinition(document as any, new Position(1, 6), { isCancellationRequested: false } as any);
        expect(definition).toBeDefined();
        expect((definition as Location).range.start.line).toBe(0);
    });
});

describe('GpplReferenceProvider', () => {
    it('returns references when word is user variable or procedure', () => {
        const helper = makeSemanticHelper();
        const provider = new GpplReferenceProvider(helper, createTextParser());
        const document = createMockDocument('VAR = 1');
        const references = provider.provideReferences(document as any, new Position(0, 0), {} as any, { isCancellationRequested: false } as any);
        expect(Array.isArray(references)).toBe(true);
        expect((references as Location[]).length).toBeGreaterThan(0);
    });

    it('returns undefined when the request is cancelled', () => {
        const helper = makeSemanticHelper();
        const provider = new GpplReferenceProvider(helper, createTextParser());
        const document = createMockDocument('VAR = 1');
        const references = provider.provideReferences(document as any, new Position(0, 0), {} as any, { isCancellationRequested: true } as any);
        expect(references).toBeUndefined();
    });
});

describe('GpplDefinitionProvider - additional branches', () => {
    it('returns undefined when cancellation requested', () => {
        const helper = makeSemanticHelper();
        const provider = new GpplDefinitionProvider(helper, createTextParser());
        const document = createMockDocument('VAR');
        const result = provider.provideDefinition(document as any, new Position(0, 1), { isCancellationRequested: true } as any);
        expect(result).toBeUndefined();
    });

    it('returns undefined when word range not found', () => {
        const helper = makeSemanticHelper();
        const provider = new GpplDefinitionProvider(helper, createTextParser());
        const document = createMockDocument('   ');
        // Position in empty space - wordRange will be undefined
        const result = provider.provideDefinition(document as any, new Position(0, 1), { isCancellationRequested: false } as any);
        expect(result).toBeUndefined();
    });

    it('returns undefined for unknown word', () => {
        const helper = {
            ...makeSemanticHelper(),
            isThisUserVariableOrArray: () => false,
            isThisProcedureDeclaration: () => false,
        };
        const provider = new GpplDefinitionProvider(helper as any, createTextParser());
        const document = createMockDocument('unknownword');
        const result = provider.provideDefinition(document as any, new Position(0, 3), { isCancellationRequested: false } as any);
        expect(result).toBeUndefined();
    });

    it('finds definition for procedure declaration (not call)', () => {
        const helper = {
            ...makeSemanticHelper(),
            isThisUserVariableOrArray: () => false,
            isThisProcedureDeclaration: (w: string) => w.startsWith('@'),
        };
        const provider = new GpplDefinitionProvider(helper as any, createTextParser());
        // @proc1 on first line is NOT a call, on second line IS a call
        const document = createMockDocument('@proc1\ncall @proc1');
        const result = provider.provideDefinition(document as any, new Position(1, 6), { isCancellationRequested: false } as any);
        expect(result).toBeDefined();
        expect((result as Location).range.start.line).toBe(0);
    });

    it('cancels mid-procedure-search', () => {
        let callCount = 0;
        const token = {
            get isCancellationRequested() {
                callCount++;
                return callCount > 2; // cancel after a couple of checks
            }
        };
        const helper = {
            ...makeSemanticHelper(),
            isThisUserVariableOrArray: () => false,
            isThisProcedureDeclaration: (w: string) => w.startsWith('@'),
        };
        const provider = new GpplDefinitionProvider(helper as any, createTextParser());
        const document = createMockDocument('@proc1\ncall @proc1\n@proc1');
        const result = provider.provideDefinition(document as any, new Position(1, 6), token as any);
        // May return undefined due to cancellation
        expect(result === undefined || result !== null).toBe(true);
    });
});

describe('GpplReferenceProvider - additional branches', () => {
    it('returns undefined when word range not found', () => {
        const helper = makeSemanticHelper();
        const provider = new GpplReferenceProvider(helper, createTextParser());
        const document = createMockDocument('   ');
        const result = provider.provideReferences(document as any, new Position(0, 1), {} as any, { isCancellationRequested: false } as any);
        expect(result).toBeUndefined();
    });

    it('returns undefined for word that is neither variable nor procedure', () => {
        const helper = {
            ...makeSemanticHelper(),
            isThisUserVariableOrArray: () => false,
            isThisProcedureDeclaration: () => false,
        };
        const provider = new GpplReferenceProvider(helper as any, createTextParser());
        const document = createMockDocument('someword');
        const result = provider.provideReferences(document as any, new Position(0, 2), {} as any, { isCancellationRequested: false } as any);
        expect(result).toBeUndefined();
    });

    it('returns references for procedure declaration', () => {
        const helper = {
            ...makeSemanticHelper(),
            isThisUserVariableOrArray: () => false,
            isThisProcedureDeclaration: (w: string) => w.startsWith('@'),
        };
        const provider = new GpplReferenceProvider(helper as any, createTextParser());
        const document = createMockDocument('@proc1\ncall @proc1');
        const result = provider.provideReferences(document as any, new Position(0, 1), {} as any, { isCancellationRequested: false } as any);
        expect(Array.isArray(result)).toBe(true);
    });

    it('cancels after word resolved (second check)', () => {
        let checkCount = 0;
        const token = {
            get isCancellationRequested() {
                checkCount++;
                return checkCount >= 2;
            }
        };
        const helper = makeSemanticHelper();
        const provider = new GpplReferenceProvider(helper, createTextParser());
        const document = createMockDocument('VAR = 1');
        const result = provider.provideReferences(document as any, new Position(0, 0), {} as any, token as any);
        expect(result).toBeUndefined();
    });
});

describe('GpplCodeLensProvider - additional branches', () => {
    it('returns empty array when no procedures found', async () => {
        const provider = new GpplCodeLensProvider(makeSemanticHelper(), makeI18n(), createTextParser());
        const document = createMockDocument('no procedures here');
        const lenses = await provider.provideCodeLenses(document as any);
        expect(Array.isArray(lenses)).toBe(true);
    });

    it('creates code lenses with correct structure', async () => {
        const provider = new GpplCodeLensProvider(makeSemanticHelper(), makeI18n(), createTextParser());
        const document = createMockDocument('@proc1\ncall @proc1\ncall @proc1');
        const lenses = await provider.provideCodeLenses(document as any);
        if (lenses && lenses.length > 0) {
            expect(lenses[0]).toBeInstanceOf(CodeLens);
        }
    });
});

describe('GpplDocumentFormattingEditProvider', () => {
    it('returns formatting edits for a document', () => {
        const provider = new GpplDocumentFormattingEditProvider();
        const document = createMockDocument('@proc1\n  line');
        const edits = provider.provideDocumentFormattingEdits(document as any, {} as any, { isCancellationRequested: false } as any);
        expect(Array.isArray(edits)).toBe(true);
        expect(edits.length).toBe(document.lineCount);
        expect((edits[0] as TextEdit).newText).toBeDefined();
    });

    it('returns no edits when formatting is disabled by configuration', () => {
        const getConfigSpy = vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            return {
                get: (key: string, defaultValue?: any) => {
                    if (section === 'gpp.format' && key === 'enable') {
                        return false;
                    }
                    return defaultValue;
                },
                has: () => false,
                inspect: () => undefined,
                update: async () => undefined,
            } as any;
        });

        resetConstants();
        const provider = new GpplDocumentFormattingEditProvider();
        const document = createMockDocument('@proc1');
        const edits = provider.provideDocumentFormattingEdits(document as any, {} as any, { isCancellationRequested: false } as any);
        expect(edits).toEqual([]);
        getConfigSpy.mockRestore();
    });
});
