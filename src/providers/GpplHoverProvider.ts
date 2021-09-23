import {
  CancellationToken,
  Hover,
  HoverProvider,
  MarkdownString,
  Position,
  ProviderResult,
  Range,
  TextDocument,
} from 'vscode';
import { IGppVariable, semanticHelper } from '../util/semanticHelper';

class GpplHoverProvider implements HoverProvider {
  constructor() {}
  provideHover(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Hover> {
    let hoverContent: MarkdownString = new MarkdownString();
    let wordRange: Range | undefined = document.getWordRangeAtPosition(position);
    let word: string = document.getText(wordRange);

    if (semanticHelper.isThisGlobalUserVariable(word)) {
      let gppVar: IGppVariable | undefined = semanticHelper.getGlobalGppUserVariable(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope + ' ' + gppVar.type + ' ' + gppVar.name + ' ; (user variable)',
          'gpp'
        );
      }
      if (gppVar?.references) {
        let rf: string;
        rf = gppVar.references.length > 1 ? 'references' : 'reference';
        hoverContent.appendMarkdown('\n---' + '\nFound `' + gppVar.references.length + '` ' + rf);
      }
      if (gppVar?.info) {
        hoverContent.appendMarkdown('\n\n--- \nInfo: ' + gppVar.info);
      }
    }
    if (semanticHelper.isThisLocalUserVariable(word)) {
      let gppVar = semanticHelper.getLocalGppUserVariable(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope + ' ' + gppVar.type + ' ' + gppVar.name + ' ; (user variable)',
          'gpp'
        );
      }
      if (gppVar?.references) {
        hoverContent.appendMarkdown('\n---' + '\nFind `' + gppVar.references.length + '` references');
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

export const gpplHoverProvider: GpplHoverProvider = new GpplHoverProvider();
