import { CancellationToken, DocumentFormattingEditProvider, FormattingOptions, TextDocument, TextEdit } from 'vscode';
import { constants } from '../util/constants';

class GppDocumentFormattingEditProvider implements DocumentFormattingEditProvider {
  indentLevel: number = 0;
  indent: string = this.getIndentLetter();

  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): TextEdit[] {
    let documentLineCount = document.lineCount;
    if (constants.formatEnable) {
      let textEditList: TextEdit[] = [];
      for (let i = 0; i < documentLineCount; i++) {
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
    if (text.substr(0, 1) === ';') {
      _formattedText = this.indent.repeat(this.indentLevel) + text;
    } else {
      if (/(^\@\w+)|(^\b(i|I)f)|(^\b(w|W)hile)/.test(text)) {
        _formattedText = this.indent.repeat(this.indentLevel) + text;
        ++this.indentLevel;
      } else if (/(^\b(e|E)lse)/.test(text)) {
        --this.indentLevel;
        _formattedText = this.indent.repeat(this.indentLevel) + text;
        ++this.indentLevel;
      } else if (/(^\b(e|E)nd(w|p|(i|I)f))/.test(text)) {
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
    let indentSize = constants.tabSize ? constants.tabSize : 2;
    if (constants.insertSpaces) {
      return ' '.repeat(indentSize);
    } else {
      return '\t'.repeat(indentSize);
    }
  }
}
export const gppDocumentFormattingEditProvider = new GppDocumentFormattingEditProvider();
