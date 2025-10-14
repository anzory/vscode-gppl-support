import { Location, Position, Range, TextDocument } from 'vscode';

/**
 * Provides text parsing functionality for GPP documents.
 *
 * This class offers utilities for:
 * - Finding word locations in documents
 * - Regular expression-based text searching
 * - Position and range calculations
 * - Performance optimization through regex caching
 */
export default class TextParser {
  private regExpCache: Map<string, RegExp> = new Map();

  /**
   * Creates start and end positions from character index and length.
   *
   * @private
   * @param doc - The text document
   * @param index - The starting character index
   * @param length - The length of the range
   * @returns Object containing start and end positions
   */
  private createPositionPair(
    doc: TextDocument,
    index: number,
    length: number
  ): { start: Position; end: Position } {
    return {
      start: doc.positionAt(index),
      end: doc.positionAt(index + length),
    };
  }

  /**
   * Gets a cached regular expression or creates a new one.
   *
   * @private
   * @param pattern - The regex pattern string
   * @returns The compiled regular expression
   */
  private getCachedRegExp(pattern: string): RegExp {
    if (!this.regExpCache.has(pattern)) {
      this.regExpCache.set(pattern, new RegExp(pattern, 'gm'));
    }
    return this.regExpCache.get(pattern)!;
  }

  /**
   * Finds all locations of a word in a document.
   *
   * @param doc - The text document to search in
   * @param word - The word to search for
   * @returns Array of locations where the word was found
   */
  getWordLocationsInDoc(
    doc: TextDocument | undefined,
    word: string
  ): Location[] {
    if (!doc || !word) {
      return [];
    }

    const locations: Location[] = [];
    const text = doc.getText();
    const regExp = this.getCachedRegExp(word + '\\b');

    let regExpResult: RegExpExecArray | null;
    do {
      regExpResult = regExp.exec(text);
      if (regExpResult) {
        const { start, end } = this.createPositionPair(
          doc,
          regExpResult.index,
          regExpResult[0].length
        );
        locations.push(new Location(doc.uri, new Range(start, end)));
      }
    } while (regExpResult);

    return locations;
  }

  /**
   * Finds all ranges matching a regular expression in a document.
   *
   * @param doc - The text document to search in
   * @param regExp - The regular expression to search with
   * @returns Array of ranges where matches were found
   */
  getRegExpRangesInDoc(doc: TextDocument | undefined, regExp: RegExp): Range[] {
    if (!doc || !regExp) {
      return [];
    }

    const ranges: Range[] = [];
    const text = doc.getText();

    // Создаем копию регулярного выражения, чтобы не изменять оригинал
    const regExpCopy = new RegExp(regExp.source, regExp.flags);
    let regExpRes: RegExpExecArray | null;

    do {
      regExpRes = regExpCopy.exec(text);
      if (regExpRes) {
        const { start, end } = this.createPositionPair(
          doc,
          regExpRes.index,
          regExpRes[0].length
        );
        ranges.push(new Range(start, end));
      }
    } while (regExpRes);

    return ranges;
  }

  /**
   * Clears the regular expression cache.
   */
  clearCache(): void {
    this.regExpCache.clear();
  }
}

/**
 * Global instance of TextParser for text parsing operations.
 *
 * This singleton instance provides text parsing functionality
 * for the extension.
 */
export const textParser = new TextParser();
