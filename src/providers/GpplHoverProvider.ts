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
import { utils, IGpplVariable } from '../utils/utils';

/**
 * Provides hover information for GPP language constructs in VS Code.
 *
 * This provider shows helpful information when hovering over:
 * - User-defined variables and arrays (global and local)
 * - System variables
 * - Procedure declarations
 * - References and additional information
 */
export class GpplHoverProvider implements HoverProvider {
  /**
   * Creates an instance of GpplHoverProvider.
   */
  constructor() {}

  /**
   * Provides hover information for the symbol at the given position.
   *
   * @param document - The text document containing the symbol
   * @param position - The position of the symbol
   * @param token - A cancellation token for the operation
   * @returns A promise that resolves to hover information or undefined
   */
  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover> {
    let hoverContent: MarkdownString = new MarkdownString();
    let wordRange: Range | undefined =
      document.getWordRangeAtPosition(position);
    let word: string = document.getText(wordRange);

    if (utils.semanticHelper.isThisGloballUserArray(word)) {
      let gppVar: IGpplVariable | undefined =
        utils.semanticHelper.getGlobalUserArray(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user array)',
          utils.constants.languageId
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
        hoverContent.appendMarkdown('\n\n--- \n' + gppVar.info);
      }
    }

    if (utils.semanticHelper.isThisLocalUserArray(word)) {
      let gppVar: IGpplVariable | undefined =
        utils.semanticHelper.getLocalUserArray(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user array)',
          utils.constants.languageId
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
        hoverContent.appendMarkdown('\n\n--- \n' + gppVar.info);
      }
    }

    if (utils.semanticHelper.isThisGlobalUserVariable(word)) {
      let gppVar: IGpplVariable | undefined =
        utils.semanticHelper.getGlobalUserVariable(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user variable)',
          utils.constants.languageId
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
        hoverContent.appendMarkdown('\n\n--- \n' + gppVar.info);
      }
    }
    if (utils.semanticHelper.isThisLocalUserVariable(word)) {
      let gppVar = utils.semanticHelper.getLocalUserVariable(word);
      if (gppVar) {
        hoverContent.appendCodeblock(
          gppVar.scope +
            ' ' +
            gppVar.type +
            ' ' +
            gppVar.name +
            ' ; (user variable)',
          utils.constants.languageId
        );
      }
      if (gppVar?.references) {
        hoverContent.appendMarkdown(
          '\n---' + '\nFind `' + gppVar.references.length + '` references'
        );
      }
      if (gppVar?.info) {
        hoverContent.appendMarkdown('\n\n--- \n' + gppVar.info);
      }
    }
    if (utils.semanticHelper.isThisSystemVariable(word)) {
      hoverContent.appendCodeblock(
        'global system variable: ' + word,
        utils.constants.languageId
      );
    }
    if (utils.semanticHelper.isThisProcedureDeclaration(word)) {
      const procedure = utils.semanticHelper.getGpplProcedure(word);
      if (procedure) {
        hoverContent.appendCodeblock(
          'Procedure: ' +
            procedure.name +
            (procedure.args ? '(' + procedure.args + ')' : ''),
          utils.constants.languageId
        );
      }
      if (procedure?.references) {
        hoverContent.appendMarkdown(
          '\n---' + '\nFind `' + procedure.references.length + '` references'
        );
      }
      if (procedure?.info) {
        hoverContent.appendMarkdown('\n\n--- \n' + procedure.info);
      }
    }
    return Promise.resolve(new Hover(hoverContent, wordRange));
  }
}
