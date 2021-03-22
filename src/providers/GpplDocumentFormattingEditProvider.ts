import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  Position,
  Range,
  TextDocument,
  TextEdit,
  workspace,
} from 'vscode';
import { constants } from '../util/constants';
import { Logger } from '../util/logger';

class GpplDocumentFormattingEditProvider
  implements DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): TextEdit[] {
    Logger.enable();
    try {
      let textEdits: TextEdit[] = [];
      let textEdit: TextEdit;
      let docLineCount = document.lineCount;
      let indentLevel = 0;
      // let indentSize = 2; /*= constants.tabSize;
      let indentSize = 2;
      // console.log('constants.tabSize=', constants.tabSize);
      console.log(
        'Configuration=',
        workspace.getConfiguration(constants.languageId)
      );
      options.insertSpaces = true;
      options.tabSize = 2;
      let indent = '_'.repeat(indentSize);
      for (let i = 0; i < docLineCount - 1; i++) {
        let formattedLineText = '';
        let lineText = document.lineAt(i).text?.trim();
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
          new Range(
            new Position(0, 0),
            new Position(0, formattedLineText.length + 1)
          ),
          formattedLineText
        );
        textEdits.push(textEdit);
      }
      console.log(textEdits);
      Logger.log('return textEdits');
      return textEdits;
    } catch (error) {
      Logger.log(error);
    } finally {
      return [];
    }
  }
}
export const gpplDocumentFormattingEditProvider = new GpplDocumentFormattingEditProvider();
