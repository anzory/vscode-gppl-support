import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  TextDocument,
  TextEdit,
  workspace,
} from 'vscode';

class GpplDocumentFormattingEditProvider
  implements DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): TextEdit[] {
    let isFormatEnable = workspace
      .getConfiguration()
      .get<boolean>('gppl.format.enable');
    let n = workspace.getConfiguration().get<number>('gppl.format.tabSize');
    let indentSize = n ? n : 2;
    let indent;
    if (workspace.getConfiguration().get<boolean>('gppl.format.insertSpaces')) {
      indent = ' ';
    } else {
      indent = '\t';
    }
    indent = indent.repeat(indentSize);
    let docLineCount = document.lineCount;
    if (isFormatEnable) {
      let textEdits: TextEdit[] = [];
      let indentLevel = 0;
      for (let i = 0; i < docLineCount - 1; i++) {
        let textEdit: TextEdit;
        let formattedLineText = '';
        let lineText = document.lineAt(i).text?.trimLeft();
        if (/^(\@\w+)|(\bif)|(\bwhile)/.test(lineText)) {
          formattedLineText = indent.repeat(indentLevel) + lineText;
          ++indentLevel;
        } else if (/^(\belse)/.test(lineText)) {
          --indentLevel;
          formattedLineText = indent.repeat(indentLevel) + lineText;
          ++indentLevel;
        } else if (/^(\bend(w|p|if))/.test(lineText)) {
          --indentLevel;
          formattedLineText = indent.repeat(indentLevel) + lineText;
        } else if (lineText !== '') {
          formattedLineText = indent.repeat(indentLevel) + lineText;
        } else {
          formattedLineText = lineText;
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
