import { Location, Position, Range, TextDocument } from 'vscode';

/**
 * Maximum size of the RegExp cache to prevent memory leaks.
 */
const MAX_CACHE_SIZE = 500;

/**
 * Simple LRU (Least Recently Used) cache entry.
 */
interface CacheEntry {
  regExp: RegExp;
  lastUsed: number;
}

/**
 * Provides text parsing functionality for GPP documents.
 *
 * This class offers utilities for:
 * - Finding word locations in documents
 * - Regular expression-based text searching
 * - Position and range calculations
 * - Performance optimization through LRU regex caching
 */
export default class TextParser {
  private regExpCache: Map<string, CacheEntry> = new Map();
  private cacheOrder: number = 0;

  /**
   * Escapes special regex characters in a string.
   *
   * @param value - The string to escape
   * @returns The escaped string safe for use in RegExp
   */
  escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

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
   * Evicts the least recently used cache entries if cache is full.
   *
   * @private
   */
  private evictIfNeeded(): void {
    if (this.regExpCache.size >= MAX_CACHE_SIZE) {
      // Find and remove the least recently used entry
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, entry] of this.regExpCache) {
        if (entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.regExpCache.delete(oldestKey);
      }
    }
  }

  /**
   * Gets a cached regular expression or creates a new one.
   * Uses LRU eviction policy to prevent memory leaks.
   *
   * @private
   * @param pattern - The regex pattern string
   * @returns The compiled regular expression
   */
  private getCachedRegExp(pattern: string): RegExp {
    const cached = this.regExpCache.get(pattern);

    if (cached) {
      // Update last used time
      cached.lastUsed = ++this.cacheOrder;
      return cached.regExp;
    }

    // Evict old entries if needed
    this.evictIfNeeded();

    // Create new entry
    const regExp = new RegExp(pattern, 'gm');
    this.regExpCache.set(pattern, {
      regExp,
      lastUsed: ++this.cacheOrder,
    });

    return regExp;
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
    return this.getLocationsInDoc(doc, word + '\\b');
  }

  /**
   * Finds all locations of a regex pattern in a document.
   *
   * @param doc - The text document to search in
   * @param pattern - The regex pattern string
   * @returns Array of locations where the pattern was found
   */
  getLocationsInDoc(
    doc: TextDocument | undefined,
    pattern: string
  ): Location[] {
    if (!doc || !pattern) {
      return [];
    }

    const locations: Location[] = [];
    const text = doc.getText();
    const regExp = this.getCachedRegExp(pattern);
    // Ensure lastIndex is reset in case a cached RegExp has state
    try {
      (regExp as RegExp).lastIndex = 0;
    } catch {}

    let regExpResult: RegExpExecArray | null;
    do {
      regExpResult = regExp.exec(text);
      if (regExpResult) {
        const { start, end } = this.createPositionPair(
          doc,
          regExpResult.index,
          regExpResult[0].length
        );
        // Skip matches that are inside comments (after ';' on the line)
        if (!this.isInsideComment(doc, start)) {
          locations.push(new Location(doc.uri, new Range(start, end)));
        }
      }
    } while (regExpResult);

    return locations;
  }

  /**
   * Finds all locations of a literal word in a document with escaping.
   *
   * @param doc - The text document to search in
   * @param word - The literal word to search for
   * @returns Array of locations where the word was found
   */
  getWordLocationsForLiteral(
    doc: TextDocument | undefined,
    word: string
  ): Location[] {
    if (!word) {
      return [];
    }
    const escaped = this.escapeRegExp(word);
    const startsWithWordChar = /^\w/.test(word);
    const endsWithWordChar = /\w$/.test(word);
    const startBoundary = startsWithWordChar ? '\\b' : '(?<!\\w)';
    const endBoundary = endsWithWordChar ? '\\b' : '(?!\\w)';
    return this.getLocationsInDoc(doc, `${startBoundary}${escaped}${endBoundary}`);
  }

  /**
   * Checks if a position is inside a comment (after ';' on the line).
   *
   * @private
   * @param doc - The text document
   * @param position - The position to check
   * @returns True if the position is inside a comment
   */
  private isInsideComment(doc: TextDocument, position: Position): boolean {
    const lineText = doc.lineAt(position.line).text;
    const commentIndex = lineText.indexOf(';');
    return commentIndex >= 0 && commentIndex < position.character;
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

    // Reset lastIndex on incoming RegExp to avoid stateful exec issues
    try {
      (regExp as RegExp).lastIndex = 0;
    } catch {}

    // Create a copy of the regex to avoid modifying the original
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
