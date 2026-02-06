'use strict';
import {
  CodeLens,
  CodeLensProvider,
  Command,
  DocumentSymbol,
  SymbolKind,
  ProviderResult,
  Range,
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
      const callLocations = allLocations.filter(
        (location) => !this.isSameRange(location.range, symbol.selectionRange)
      );
      const callCount = callLocations.length;
      const template = utils.i18n.t('codelens.procedure.references');
      const title = template.replace('{count}', callCount.toString());
      const command: Command = {
        title,
        command: utils.constants.commands.showProcedureReferences,
        arguments: [document.uri, symbol.selectionRange.start, callLocations],
      };
      codeLenses.push(new CodeLens(symbol.range, command));
    }

    return codeLenses;
  }

  private isSameRange(a: Range, b: Range): boolean {
    return a.start.isEqual(b.start) && a.end.isEqual(b.end);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

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
