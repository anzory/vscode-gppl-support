import {
  CancellationToken,
  Hover,
  HoverProvider,
  MarkdownString,
  Position,
  ProviderResult,
  TextDocument,
} from 'vscode';
import { semanticHelper } from '../util/semanticHelper';

class GppHoverProvider implements HoverProvider {
  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover> {
    let hoverContent: MarkdownString = new MarkdownString();
    let wordRange = document.getWordRangeAtPosition(position);
    let word = document.getText(wordRange);
    if (semanticHelper.isThisGlobalUserVariable(word)) {
      let gppVar = semanticHelper.getGlobalGppUserVariable(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user variable)',
          'gpp'
        );
      }
      if (gppVar?.references) {
        hoverContent.appendMarkdown(
          '\n---' + '\nFind `' + gppVar.references.length + '` references'
        );
      }
      if (gppVar?.info) {
        hoverContent.appendMarkdown('\n\n--- \nInfo: ' + gppVar.info);
      }
    }
    if (semanticHelper.isThisLocalUserVariable(word)) {
      let gppVar = semanticHelper.getLocalGppUserVariable(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user variable)',
          'gpp'
        );
      }
      if (gppVar?.references) {
        hoverContent.appendMarkdown(
          '\n---' + '\nFind `' + gppVar.references.length + '` references'
        );
      }
      if (gppVar?.info) {
        hoverContent.appendMarkdown('\n\n--- \nInfo: ' + gppVar.info);
      }
    }
    if (semanticHelper.isThisSystemVariable(word)) {
      hoverContent.appendCodeblock('global system variable: ' + word, 'gpp');
    }
    if (semanticHelper.isThisProcedureDeclaration(word)) {
      hoverContent.appendCodeblock('Procedure: ' + word, 'gpp');
    }
    return Promise.resolve(new Hover(hoverContent, wordRange));
  }
}

export const gppHoverProvider = new GppHoverProvider();
