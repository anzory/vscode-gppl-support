import { Location, Position, Range, TextDocument } from 'vscode';

class TextParser {
  // getLine() {}

  getWordLocationsInDoc(doc: TextDocument | undefined, word: string): Location[] {
    const regExp = new RegExp('' + word + '\\b', 'gm');
    const locations: Location[] = [];
    if (doc) {
      const text = doc.getText();
      let regExpRes: RegExpExecArray | null;
      do {
        regExpRes = regExp.exec(text);
        if (regExpRes) {
          const startPos: Position = doc ? doc.positionAt(regExpRes.index) : new Position(0, 0);
          const endPos: Position = doc ? doc.positionAt(regExpRes.index + regExpRes[0].length) : new Position(0, 0);
          const location: Location = new Location(doc.uri, new Range(startPos, endPos));
          locations.push(location);
        }
      } while (regExpRes);
    }
    return locations;
  }

  getRegExpRangesInDoc(doc: TextDocument | undefined, regExp: RegExp): Range[] {
    const ranges: Range[] = [];
    if (doc) {
      const text = doc.getText();
      let regExpRes: RegExpExecArray | null;
      do {
        regExpRes = regExp.exec(text);
        if (regExpRes) {
          const startPos: Position = doc ? doc.positionAt(regExpRes.index) : new Position(0, 0);
          const endPos: Position = doc ? doc.positionAt(regExpRes.index + regExpRes[0].length) : new Position(0, 0);
          const range: Range = new Range(startPos, endPos);
          ranges.push(range);
        }
      } while (regExpRes);
    }

    return ranges;
  }
}
export const textParser = new TextParser();
