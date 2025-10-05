import { Location, Position, Range, TextDocument } from 'vscode';

export default class TextParser {
  private regExpCache: Map<string, RegExp> = new Map();

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

  private getCachedRegExp(pattern: string): RegExp {
    if (!this.regExpCache.has(pattern)) {
      this.regExpCache.set(pattern, new RegExp(pattern, 'gm'));
    }
    return this.regExpCache.get(pattern)!;
  }

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

  clearCache(): void {
    this.regExpCache.clear();
  }
}

export const textParser = new TextParser();
