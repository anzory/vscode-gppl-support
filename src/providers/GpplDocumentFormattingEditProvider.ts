import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  TextDocument,
  TextEdit,
} from 'vscode';
import { constants } from '../util/constants';

class GpplDocumentFormattingEditProvider
  implements DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): TextEdit[] {
    let indentSize = constants.tabSize ? constants.tabSize : 2;
    let indent;
    if (constants.insertSpaces) {
      indent = ' ';
    } else {
      indent = '\t';
    }
    indent = indent.repeat(indentSize);
    let docLineCount = document.lineCount;
    if (constants.formatEnable) {
      let textEdits: TextEdit[] = [];
      let indentLevel = 0;
      for (let i = 0; i < docLineCount; i++) {
        let textEdit: TextEdit;
        let formattedLineText: string = '';
        let lineText = document.lineAt(i).text?.trimLeft();
        if (lineText.substr(0, 1) === ';') {
          formattedLineText = indent.repeat(indentLevel) + lineText;
        } else {
          if (/(^\@\w+)|(^\b[i|I]f)|(^\b[w|W]hile)/.test(lineText)) {
            formattedLineText = indent.repeat(indentLevel) + lineText;
            ++indentLevel;
          } else if (/(^\b[e|E]lse)/.test(lineText)) {
            --indentLevel;
            formattedLineText = indent.repeat(indentLevel) + lineText;
            ++indentLevel;
          } else if (/(^\b[e|E]nd(w|p|if))/.test(lineText)) {
            --indentLevel;
            formattedLineText = indent.repeat(indentLevel) + lineText;
          } else if (lineText !== '') {
            formattedLineText = indent.repeat(indentLevel) + lineText;
          } else {
            formattedLineText = lineText;
          }
        }
        textEdit = new TextEdit(
          document.lineAt(i).range,
          formattedLineText.trimRight()
        );
        textEdits.push(textEdit);
      }
      return textEdits;
    } else {
      return [];
    }
  }
}
export const gpplDocumentFormattingEditProvider = new GpplDocumentFormattingEditProvider();
