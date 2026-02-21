'use strict';
import {
  CodeLens,
  CodeLensProvider,
  Command,
  DocumentSymbol,
  SymbolKind,
  ProviderResult,
  TextDocument,
} from 'vscode';
import { GpplDocumentSymbolProvider } from './GpplDocumentSymbolProvider';
import { textParser } from '../utils/textParser';
import { utils } from '../utils/utils';

/**
 * Provides CodeLens for GPP functions and document stats.
 */
export class GpplCodeLensProvider implements CodeLensProvider {
  private documentSymbolProvider = new GpplDocumentSymbolProvider();

  /**
   * Provides CodeLens for all symbols and a summary of symbol count.
   *
   * @param document - The text document to analyze
   */
  provideCodeLenses(document: TextDocument): ProviderResult<CodeLens[]> {
    const symbolsResult =
      this.documentSymbolProvider.provideDocumentSymbols(document);

    if (symbolsResult && typeof (symbolsResult as Thenable<DocumentSymbol[]>).then === 'function') {
      return (symbolsResult as Thenable<DocumentSymbol[]>).then((symbols) =>
        this.buildCodeLenses(document, symbols || [])
      );
    }

    return this.buildCodeLenses(
      document,
      (symbolsResult as DocumentSymbol[]) || []
    );
  }

  /**
   * Builds CodeLens items from document symbols.
   *
   * @private
   * @param document - The text document to analyze
   * @param symbols - Array of document symbols to create CodeLens for
   * @returns Array of CodeLens items for the symbols
   */
  private buildCodeLenses(
    document: TextDocument,
    symbols: DocumentSymbol[]
  ): CodeLens[] {
    const flatSymbols = this.flattenSymbols(symbols);
    const codeLenses: CodeLens[] = [];

    for (const symbol of flatSymbols) {
      // Skip region/namespace symbols: they should remain in document outline
      // but must not receive CodeLens entries.
      if (symbol.kind === SymbolKind.Namespace) {
        continue;
      }
      const escapedName = this.escapeRegExp(symbol.name);
      const allLocations = textParser.getWordLocationsInDoc(
        document,
        escapedName
      );
      const template = utils.i18n.t('codelens.procedure.references');
      const title = template.replace('{count}', allLocations.length.toString());
      const command: Command = {
        title,
        command: utils.constants.commands.showProcedureReferences,
        arguments: [document.uri, symbol.selectionRange.start, allLocations],
      };
      // Use selectionRange (the symbol name range) so CodeLens appears on declaration line
      const anchorRange = symbol.selectionRange || symbol.range;
      codeLenses.push(new CodeLens(anchorRange, command));
    }

    return codeLenses;
  }

  /**
   * Escapes special regex characters in a string.
   *
   * @private
   * @param value - The string to escape
   * @returns The escaped string safe for use in regular expressions
   */
  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Flattens a hierarchical symbol structure into a flat array.
   *
   * @private
   * @param symbols - Array of document symbols (potentially with children)
   * @returns Flattened array containing all symbols including nested children
   */
  private flattenSymbols(symbols: DocumentSymbol[]): DocumentSymbol[] {
    const result: DocumentSymbol[] = [];
    for (const symbol of symbols) {
      result.push(symbol);
      if (symbol.children && symbol.children.length > 0) {
        result.push(...this.flattenSymbols(symbol.children));
      }
    }
    return result;
  }
}
