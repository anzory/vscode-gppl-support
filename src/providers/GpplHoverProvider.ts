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
import { utils, IGpplVariable, IGpplProcedure } from '../utils/utils';

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
    // Check for cancellation
    if (token.isCancellationRequested) {
      return undefined;
    }

    const hoverContent: MarkdownString = new MarkdownString();
    const wordRange: Range | undefined = document.getWordRangeAtPosition(position);
    
    if (!wordRange) {
      return undefined;
    }

    const word: string = document.getText(wordRange);

    // Check for user-defined variables and arrays
    this.appendVariableHoverInfo(hoverContent, word);

    // Check for system variables
    if (utils.semanticHelper.isThisSystemVariable(word)) {
      hoverContent.appendCodeblock(
        'global system variable: ' + word,
        utils.constants.languageId
      );
    }

    // Check for procedure declarations
    this.appendProcedureHoverInfo(hoverContent, word);

    return Promise.resolve(new Hover(hoverContent, wordRange));
  }

  /**
   * Appends variable hover information to the markdown content.
   *
   * @private
   * @param hoverContent - The markdown string to append content to
   * @param word - The word to look up variable information for
   */
  private appendVariableHoverInfo(
    hoverContent: MarkdownString,
    word: string
  ): void {
    let gppVar: IGpplVariable | undefined;
    let varType: string = '';

    if (utils.semanticHelper.isThisGlobalUserArray(word)) {
      gppVar = utils.semanticHelper.getGlobalUserArray(word);
      varType = 'user array';
    } else if (utils.semanticHelper.isThisLocalUserArray(word)) {
      gppVar = utils.semanticHelper.getLocalUserArray(word);
      varType = 'user array';
    } else if (utils.semanticHelper.isThisGlobalUserVariable(word)) {
      gppVar = utils.semanticHelper.getGlobalUserVariable(word);
      varType = 'user variable';
    } else if (utils.semanticHelper.isThisLocalUserVariable(word)) {
      gppVar = utils.semanticHelper.getLocalUserVariable(word);
      varType = 'user variable';
    }

    if (gppVar) {
      this.appendVariableDetails(hoverContent, gppVar, varType);
    }
  }

  /**
   * Appends detailed variable information to the markdown content.
   *
   * @private
   * @param hoverContent - The markdown string to append content to
   * @param gppVar - The variable information to display
   * @param varType - The type description (e.g., 'user array', 'user variable')
   */
  private appendVariableDetails(
    hoverContent: MarkdownString,
    gppVar: IGpplVariable,
    varType: string
  ): void {
    hoverContent.appendCodeblock(
      `${gppVar.scope} ${gppVar.type} ${gppVar.name} ; (${varType})`,
      utils.constants.languageId
    );

    if (gppVar.references) {
      const rf = gppVar.references.length > 1 ? 'references' : 'reference';
      hoverContent.appendMarkdown(
        `\n---\nFound \`${gppVar.references.length}\` ${rf}`
      );
    }

    if (gppVar.info) {
      hoverContent.appendMarkdown(`\n\n--- \n${gppVar.info}`);
    }
  }

  /**
   * Appends procedure hover information to the markdown content.
   *
   * @private
   * @param hoverContent - The markdown string to append content to
   * @param word - The word to look up procedure information for
   */
  private appendProcedureHoverInfo(
    hoverContent: MarkdownString,
    word: string
  ): void {
    if (!utils.semanticHelper.isThisProcedureDeclaration(word)) {
      return;
    }

    const procedure: IGpplProcedure | undefined =
      utils.semanticHelper.getGpplProcedure(word);

    if (!procedure) {
      return;
    }

    const args = procedure.args ? `(${procedure.args})` : '';
    hoverContent.appendCodeblock(
      `Procedure: ${procedure.name}${args}`,
      utils.constants.languageId
    );

    if (procedure.references) {
      hoverContent.appendMarkdown(
        `\n---\nFind \`${procedure.references.length}\` references`
      );
    }

    if (procedure.info) {
      hoverContent.appendMarkdown(`\n\n--- \n${procedure.info}`);
    }
  }
}
