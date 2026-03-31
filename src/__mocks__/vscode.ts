// Mock of VS Code API for unit testing

export class Position {
    constructor(public readonly line: number, public readonly character: number) { }
    translate(lineDelta?: number, characterDelta?: number): Position {
        return new Position(this.line + (lineDelta || 0), this.character + (characterDelta || 0));
    }
    isEqual(other: Position): boolean {
        return this.line === other.line && this.character === other.character;
    }
    isBefore(other: Position): boolean {
        return this.line < other.line || (this.line === other.line && this.character < other.character);
    }
    isAfter(other: Position): boolean {
        return !this.isEqual(other) && !this.isBefore(other);
    }
    compareTo(other: Position): number {
        if (this.isBefore(other)) return -1;
        if (this.isAfter(other)) return 1;
        return 0;
    }
    with(line?: number, character?: number): Position {
        return new Position(line ?? this.line, character ?? this.character);
    }
}

export class Range {
    readonly start: Position;
    readonly end: Position;

    constructor(startLine: number | Position, startChar: number | Position, endLine?: number, endChar?: number) {
        if (startLine instanceof Position && startChar instanceof Position) {
            this.start = startLine;
            this.end = startChar;
        } else {
            this.start = new Position(startLine as number, startChar as number);
            this.end = new Position(endLine!, endChar!);
        }
    }

    get isEmpty(): boolean {
        return this.start.isEqual(this.end);
    }

    contains(positionOrRange: Position | Range): boolean {
        if (positionOrRange instanceof Position) {
            return !positionOrRange.isBefore(this.start) && !positionOrRange.isAfter(this.end);
        }
        return this.contains(positionOrRange.start) && this.contains(positionOrRange.end);
    }

    with(start?: Position, end?: Position): Range {
        return new Range(start ?? this.start, end ?? this.end);
    }
}

export class Location {
    constructor(public readonly uri: Uri, public readonly range: Range) { }
}

export class Uri {
    private constructor(
        public readonly scheme: string,
        public readonly authority: string,
        public readonly path: string,
        public readonly query: string,
        public readonly fragment: string,
    ) { }

    static file(path: string): Uri {
        return new Uri('file', '', path, '', '');
    }

    static parse(value: string): Uri {
        return new Uri('file', '', value, '', '');
    }

    get fsPath(): string {
        return this.path;
    }

    toString(): string {
        return `${this.scheme}://${this.path}`;
    }

    with(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
        return new Uri(
            change.scheme ?? this.scheme,
            change.authority ?? this.authority,
            change.path ?? this.path,
            change.query ?? this.query,
            change.fragment ?? this.fragment,
        );
    }
}

export enum SymbolKind {
    File = 0, Module = 1, Namespace = 2, Package = 3, Class = 4,
    Method = 5, Property = 6, Field = 7, Constructor = 8, Enum = 9,
    Interface = 10, Function = 11, Variable = 12, Constant = 13,
    String = 14, Number = 15, Boolean = 16, Array = 17, Object = 18,
    Key = 19, Null = 20, EnumMember = 21, Struct = 22, Event = 23,
    Operator = 24, TypeParameter = 25,
}

export class SymbolInformation {
    constructor(
        public readonly name: string,
        public readonly kind: SymbolKind,
        public readonly containerName: string,
        public readonly location: Location,
    ) { }
}

export class DocumentSymbol {
    children: DocumentSymbol[] = [];
    constructor(
        public readonly name: string,
        public readonly detail: string,
        public readonly kind: SymbolKind,
        public readonly range: Range,
        public readonly selectionRange: Range,
    ) { }
}

export enum CompletionItemKind {
    Text = 0, Method = 1, Function = 2, Constructor = 3, Field = 4,
    Variable = 5, Class = 6, Interface = 7, Module = 8, Property = 9,
    Unit = 10, Value = 11, Enum = 12, Keyword = 13, Snippet = 14,
    Color = 15, Reference = 17, File = 16, Folder = 18, EnumMember = 19,
    Constant = 20, Struct = 21, Event = 22, Operator = 23, TypeParameter = 24,
}

export class CompletionItem {
    detail?: string;
    documentation?: string | MarkdownString;
    kind?: CompletionItemKind;
    constructor(public label: string, kind?: CompletionItemKind) {
        this.kind = kind;
    }
}

export class MarkdownString {
    constructor(public value: string = '') { }
    appendMarkdown(value: string): MarkdownString {
        this.value += value;
        return this;
    }
    appendCodeblock(code: string, language?: string): MarkdownString {
        this.value += `\n\`\`\`${language || ''}\n${code}\n\`\`\`\n`;
        return this;
    }
}

export class TextEdit {
    static replace(range: Range, newText: string): TextEdit {
        return new TextEdit(range, newText);
    }
    static insert(position: Position, newText: string): TextEdit {
        return new TextEdit(new Range(position, position), newText);
    }
    static delete(range: Range): TextEdit {
        return new TextEdit(range, '');
    }
    constructor(public readonly range: Range, public readonly newText: string) { }
}

export class Disposable {
    static from(...disposables: { dispose(): any }[]): Disposable {
        return new Disposable(() => disposables.forEach(d => d.dispose()));
    }
    constructor(private callOnDispose: () => any) { }
    dispose(): any {
        this.callOnDispose();
    }
}

export class EventEmitter<T> {
    private listeners: ((e: T) => any)[] = [];

    event = (listener: (e: T) => any): Disposable => {
        this.listeners.push(listener);
        return new Disposable(() => {
            const idx = this.listeners.indexOf(listener);
            if (idx >= 0) this.listeners.splice(idx, 1);
        });
    };

    fire(data: T): void {
        this.listeners.forEach(l => l(data));
    }

    dispose(): void {
        this.listeners = [];
    }
}

// Namespace mocks
export const workspace = {
    getConfiguration: (_section?: string) => ({
        get: (_key: string, defaultValue?: any) => defaultValue,
        has: (_key: string) => false,
        inspect: () => undefined,
        update: async () => { },
    }),
    onDidChangeConfiguration: (_listener: any) => new Disposable(() => { }),
    onDidChangeTextDocument: (_listener: any) => new Disposable(() => { }),
    workspaceFolders: [],
    textDocuments: [],
};

export const window = {
    activeTextEditor: undefined as any,
    createOutputChannel: (_name: string) => ({
        appendLine: () => { },
        append: () => { },
        clear: () => { },
        show: () => { },
        hide: () => { },
        dispose: () => { },
    }),
    onDidChangeActiveTextEditor: (_listener: any) => new Disposable(() => { }),
    showInformationMessage: async (..._args: any[]) => undefined,
    showWarningMessage: async (..._args: any[]) => undefined,
    showErrorMessage: async (..._args: any[]) => undefined,
};

export const commands = {
    registerCommand: (_command: string, _callback: (...args: any[]) => any) => new Disposable(() => { }),
    executeCommand: async (_command: string, ..._args: any[]) => undefined,
};

export const languages = {
    registerCompletionItemProvider: (..._args: any[]) => new Disposable(() => { }),
    registerHoverProvider: (..._args: any[]) => new Disposable(() => { }),
    registerDefinitionProvider: (..._args: any[]) => new Disposable(() => { }),
    registerReferenceProvider: (..._args: any[]) => new Disposable(() => { }),
    registerDocumentSymbolProvider: (..._args: any[]) => new Disposable(() => { }),
    registerDocumentFormattingEditProvider: (..._args: any[]) => new Disposable(() => { }),
    registerCodeLensProvider: (..._args: any[]) => new Disposable(() => { }),
};

export enum DiagnosticSeverity {
    Error = 0, Warning = 1, Information = 2, Hint = 3,
}

export enum TextEditorRevealType {
    Default = 0, InCenter = 1, InCenterIfOutsideViewport = 2, AtTop = 3,
}

export class ThemeColor {
    constructor(public readonly id: string) { }
}

export class ThemeIcon {
    static readonly File = new ThemeIcon('file');
    static readonly Folder = new ThemeIcon('folder');
    constructor(public readonly id: string) { }
}

export enum CodeLensProvider { }

export class CodeLens {
    constructor(public range: Range, public command?: any) { }
}
