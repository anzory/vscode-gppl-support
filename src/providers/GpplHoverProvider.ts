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
import { constants } from '../util/constants';
import { IGpplVariable, semanticHelper } from '../util/semanticHelper';

export default class GpplHoverProvider implements HoverProvider {
  constructor() {}
  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover> {
    let hoverContent: MarkdownString = new MarkdownString();
    let wordRange: Range | undefined =
      document.getWordRangeAtPosition(position);
    let word: string = document.getText(wordRange);

    if (semanticHelper.isThisGloballUserArray(word)) {
      let gppVar: IGpplVariable | undefined =
        semanticHelper.getGlobalUserArray(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user array)',
          constants.languageId
        );
      }
      if (gppVar?.references) {
        let rf: string;
        rf = gppVar.references.length > 1 ? 'references' : 'reference';
        hoverContent.appendMarkdown(
          '\n---' + '\nFound `' + gppVar.references.length + '` ' + rf
        );
      }
      if (gppVar?.info) {
        hoverContent.appendMarkdown('\n\n--- \nInfo: ' + gppVar.info);
      }
    }

    if (semanticHelper.isThisLocalUserArray(word)) {
      let gppVar: IGpplVariable | undefined =
        semanticHelper.getLocalUserArray(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user array)',
          constants.languageId
        );
      }
      if (gppVar?.references) {
        let rf: string;
        rf = gppVar.references.length > 1 ? 'references' : 'reference';
        hoverContent.appendMarkdown(
          '\n---' + '\nFound `' + gppVar.references.length + '` ' + rf
        );
      }
      if (gppVar?.info) {
        hoverContent.appendMarkdown('\n\n--- \nInfo: ' + gppVar.info);
      }
    }

    if (semanticHelper.isThisGlobalUserVariable(word)) {
      let gppVar: IGpplVariable | undefined =
        semanticHelper.getGlobalUserVariable(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user variable)',
          constants.languageId
        );
      }
      if (gppVar?.references) {
        let rf: string;
        rf = gppVar.references.length > 1 ? 'references' : 'reference';
        hoverContent.appendMarkdown(
          '\n---' + '\nFound `' + gppVar.references.length + '` ' + rf
        );
      }
      if (gppVar?.info) {
        hoverContent.appendMarkdown('\n\n--- \nInfo: ' + gppVar.info);
      }
    }
    if (semanticHelper.isThisLocalUserVariable(word)) {
      let gppVar = semanticHelper.getLocalUserVariable(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user variable)',
          constants.languageId
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
      hoverContent.appendCodeblock(
        'global system variable: ' + word,
        constants.languageId
      );
    }
    if (semanticHelper.isThisProcedureDeclaration(word)) {
      hoverContent.appendCodeblock('Procedure: ' + word, constants.languageId);
    }
    return Promise.resolve(new Hover(hoverContent, wordRange));
  }
}
