'use strict';
import {
  DocumentSymbol,
  DocumentSymbolProvider,
  ProviderResult,
  Range,
  SymbolKind,
  TextDocument,
} from 'vscode';
import TextParser from '../utils/textParser';

export class GpplDocumentSymbolProvider implements DocumentSymbolProvider {
  private textParser = new TextParser();

  provideDocumentSymbols(
    document: TextDocument
  ): ProviderResult<DocumentSymbol[]> {
    const symbols: DocumentSymbol[] = [];
    this.parseDocument(document, symbols, 0, document.lineCount);
    return symbols;
  }

  private parseDocument(
    document: TextDocument,
    symbols: DocumentSymbol[],
    startLine: number,
    endLine: number
  ): void {
    const findProcedure = /(?<=^[\s]{0,})@\w+\b/;
    const findRegion = /(?<=^[;\s]{0,})#region/;
    const findNameOfRegion = /(?<=^[;\s]{0,}#region\s{0,})\w+\b/;

    for (let line = startLine; line < endLine; line++) {
      const text = document.lineAt(line).text;

      if (findProcedure.test(text)) {
        const match = findProcedure.exec(text);
        if (match) {
          const label = match[0];
          const rgx = new RegExp('(?<=^[\\s]{0,})' + label, 'gm');
          const ranges = this.textParser.getRegExpRangesInDoc(document, rgx);
          if (ranges.length > 0) {
            const range = ranges[0];
            const symbol = new DocumentSymbol(
              label,
              '',
              SymbolKind.Function,
              range,
              range
            );
            symbols.push(symbol);
          }
        }
      }

      if (findRegion.test(text)) {
        const nameMatch = findNameOfRegion.exec(text);
        let label: string;
        let selectionRange: Range;

        if (nameMatch) {
          label = nameMatch[0];
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
        const endPosition = endRegionLine < document.lineCount
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

        // Рекурсивно парсим содержимое региона
        this.parseDocument(
          document,
          regionSymbol.children,
          line + 1,
          endRegionLine
        );

        symbols.push(regionSymbol);

        // Пропускаем обработанные строки
        line = endRegionLine;
      }
    }
  }

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
