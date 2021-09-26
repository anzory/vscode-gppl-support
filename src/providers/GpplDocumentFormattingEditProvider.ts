import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  TextDocument,
  TextEdit,
  workspace,
} from 'vscode';
import { constants } from '../util/constants';

class GpplDocumentFormattingEditProvider implements DocumentFormattingEditProvider {
  indentLevel = 0;
  indent: string;

  constructor() {
    const indentSize = constants.format.tabSize ? constants.format.tabSize : 2;
    this.indent = constants.format.preferSpace ? ' '.repeat(indentSize) : '\t'.repeat(indentSize);
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
          new TextEdit(document.lineAt(i).range, this.formatLineWithIndentation(document.lineAt(i).text.trimLeft()))
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
}

export let gpplDocumentFormattingEditProvider = new GpplDocumentFormattingEditProvider();

workspace.onDidChangeConfiguration(() => {
  gpplDocumentFormattingEditProvider = new GpplDocumentFormattingEditProvider();
});
