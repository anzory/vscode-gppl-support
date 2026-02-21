'use strict';
import {
  DocumentSymbol,
  DocumentSymbolProvider,
  Position,
  ProviderResult,
  Range,
  SymbolKind,
  TextDocument,
  workspace,
} from 'vscode';
import TextParser from '../utils/textParser';
import { utils } from '../utils/utils';

/**
 * Provides document symbols (outline) for GPP language files.
 *
 * This provider enables the document outline view showing:
 * - Procedure definitions (@procedure_name)
 * - Region blocks (#region)
 * - Hierarchical structure of the document
 */
export class GpplDocumentSymbolProvider implements DocumentSymbolProvider {
  private textParser = new TextParser();

  /**
   * Provides symbol information for the entire document.
   *
   * @param document - The text document to analyze
   * @returns A promise that resolves to an array of document symbols
   */
  provideDocumentSymbols(
    document: TextDocument
  ): ProviderResult<DocumentSymbol[]> {
    const symbols: DocumentSymbol[] = [];
    this.parseDocument(document, symbols, 0, document.lineCount);
    return symbols;
  }

  /**
   * Recursively parses the document to extract symbols.
   *
   * @private
   * @param document - The text document to parse
   * @param symbols - Array to store found symbols
   * @param startLine - Starting line number for parsing
   * @param endLine - Ending line number for parsing
   */
  private parseDocument(
    document: TextDocument,
    symbols: DocumentSymbol[],
    startLine: number,
    endLine: number
  ): void {
    const findProcedure = /^\s*@\w+\b/;
    const findRegion = /^[;\s]*#region/;
    const findNameOfRegion = /^[;\s]*#region\s*(\w+)\b/;

    for (let line = startLine; line < endLine; line++) {
      const text = document.lineAt(line).text;

      if (findProcedure.test(text)) {
        const match = findProcedure.exec(text);
        if (match) {
          // Trim leading whitespace so label represents the actual token (e.g. "@proc")
          const label = match[0].trim();
          // Compute range directly from the current line number and token position
          // to avoid the issue where \s* in a multiline regex captures newlines
          // and shifts the range to an earlier line.
          const startChar = text.indexOf(label);
          const range = new Range(
            new Position(line, startChar),
            new Position(line, startChar + label.length)
          );
          const allLocations = this.textParser.getWordLocationsInDoc(
            document,
            this.escapeRegExp(label)
          );
          const callCount = allLocations.filter(
            (loc) => !this.isSameRange(loc.range, range)
          ).length;
          const showDetail = workspace
            .getConfiguration('gpp')
            .get<boolean>('outline.showSymbolDetail', true);
          const detail = showDetail
            ? utils.i18n.t('outline.detail.calls').replace('{count}', callCount.toString())
            : '';
          const symbol = new DocumentSymbol(
            label,
            detail,
            SymbolKind.Function,
            range,
            range
          );
          symbols.push(symbol);
        }
      }

      if (findRegion.test(text)) {
        const nameMatch = findNameOfRegion.exec(text);
        let label: string;
        let selectionRange: Range;

        if (nameMatch && nameMatch[1]) {
          label = nameMatch[1];
          const locations = this.textParser.getWordLocationsInDoc(
            document,
            label
          );
          if (locations.length > 0) {
            selectionRange = locations[0].range;
          } else {
            selectionRange = document.lineAt(line).range;
          }
        } else {
          label = 'UNNAMED_REGION';
          selectionRange = document.lineAt(line).range;
        }

        const endRegionLine = this.findEndOfRegion(document, line);
        const endPosition =
          endRegionLine < document.lineCount
            ? document.lineAt(endRegionLine).range.end
            : document.lineAt(document.lineCount - 1).range.end;
        const regionRange: Range = new Range(selectionRange.start, endPosition);
        const regionSymbol: DocumentSymbol = new DocumentSymbol(
          label,
          '',
          SymbolKind.Namespace,
          regionRange,
          selectionRange
        );

        // Recursively parse region content
        this.parseDocument(
          document,
          regionSymbol.children,
          line + 1,
          endRegionLine
        );

        symbols.push(regionSymbol);

        // Skip processed lines
        line = endRegionLine;
      }
    }
  }

  /**
   * Checks if two ranges are equal.
   *
   * @private
   * @param a - First range
   * @param b - Second range
   * @returns True if ranges are equal
   */
  private isSameRange(a: Range, b: Range): boolean {
    return a.start.isEqual(b.start) && a.end.isEqual(b.end);
  }

  /**
   * Escapes special regex characters in a string for use in RegExp.
   *
   * @private
   * @param value - The string to escape
   * @returns The escaped string safe for use in regular expressions
   */
  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Finds the end line of a region block.
   *
   * @private
   * @param document - The text document containing the region
   * @param startLine - The starting line of the region
   * @returns The line number where the region ends
   */
  private findEndOfRegion(document: TextDocument, startLine: number): number {
    const findEndOfRegion = /#endregion/gm;
    const findRegion = /#region/gm;
    let line = startLine + 1;

    for (; line < document.lineCount; line++) {
      const text = document.lineAt(line).text;
      if (findEndOfRegion.test(text)) {
        return line;
      } else if (findRegion.test(text)) {
        line = this.findEndOfRegion(document, line);
      }
    }
    return line;
  }
}
