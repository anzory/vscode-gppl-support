import {
  CancellationToken,
  DocumentFormattingEditProvider,
  Event,
  EventEmitter,
  FormattingOptions,
  TextDocument,
  TextDocumentChangeEvent,
  TextEdit,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import { constants } from '../util/constants';

class GpplDocumentFormattingEditProvider implements DocumentFormattingEditProvider {
  indentLevel = 0;
  indent: string = this.getIndentLetter();
  private _onDidChangeDocument: EventEmitter<any | undefined> = new EventEmitter<any | undefined>();
  readonly onDidChangeDocument: Event<any | undefined> = this._onDidChangeDocument.event;
  private editor: TextEditor | undefined = window.activeTextEditor;
  private doc: TextDocument | undefined = this.editor?.document;

  constructor() {
    window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
    workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
  }
  refresh(viewEnable?: boolean): void {
    this._onDidChangeDocument.fire(undefined);
  }

  private onActiveEditorChanged(): void {
    this.editor = window.activeTextEditor;
    this.doc = this.editor?.document;
  }

  private onDocumentChanged(changeEvent: TextDocumentChangeEvent): void {
    if (window.activeTextEditor) {
      if (window.activeTextEditor.document.languageId === constants.languageId) {
        this.refresh(true);
      } else {
        this.refresh(false);
      }
    }
  }

  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): TextEdit[] {
    if (constants.format.enable) {
      const textEditList: TextEdit[] = [];
      for (let i = 0; i < document.lineCount; i++) {
        textEditList.push(
          new TextEdit(document.lineAt(i).range, this.formatLineWithIndentation(document.lineAt(i).text?.trimLeft()))
        );
      }
      this.indentLevel = 0;
      return textEditList;
    } else {
      return [];
    }
  }

  formatLineWithIndentation(text: string): string {
    let _formattedText: string;
    text = text.replace(/[;\s]{0,}#\s{0,}(end)?region\b/, ';#$1region');
    if (text.substr(0, 1) === ';' && !/(;#(end)?region)/.test(text)) {
      _formattedText = this.indent.repeat(this.indentLevel) + text;
    } else {
      if (
        /^@\w+|(^\b(i|I)f\b)|(^\b(w|W)hile\b)/.test(text) ||
        (constants.format.applyIndentsToRegions && /#region\b/.test(text))
      ) {
        _formattedText = this.indent.repeat(this.indentLevel) + text;
        ++this.indentLevel;
      } else if (/(^\b(e|E)(lse|lse(i|I)f))/.test(text)) {
        --this.indentLevel;
        _formattedText = this.indent.repeat(this.indentLevel) + text;
        ++this.indentLevel;
      } else if (
        /(^\b(e|E)nd(w|p|((i|I)f)))/.test(text) ||
        (constants.format.applyIndentsToRegions && /#endregion\b/.test(text))
      ) {
        --this.indentLevel;
        _formattedText = this.indent.repeat(this.indentLevel) + text;
      } else if (text !== '') {
        _formattedText = this.indent.repeat(this.indentLevel) + text;
      } else {
        _formattedText = text;
      }
    }
    return _formattedText.trimRight();
  }
  getIndentLetter(): string {
    const indentSize = constants.format.tabSize ? constants.format.tabSize : 2;
    if (constants.format.preferSpace) {
      return ' '.repeat(indentSize);
    } else {
      return '\t'.repeat(indentSize);
    }
  }
}

export const gpplDocumentFormattingEditProvider = new GpplDocumentFormattingEditProvider();
