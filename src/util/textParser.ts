import { Location, Position, Range, TextDocument } from 'vscode';

class TextParser {
  getLine() {}

  getWordLocations(doc: TextDocument | undefined, word: String): Location[] {
    const regExp: RegExp = new RegExp('(' + word + '\\b)', 'gm');
    return this.getRegExpLocations(doc, regExp);
  }

  getRegExpLocations(doc: TextDocument | undefined, regExp: RegExp): Location[] {
    let locations: Location[] = [];
    if (doc) {
      const text = doc.getText();
      let regExpRes: RegExpExecArray | null;
      do {
        regExpRes = regExp.exec(text);
        if (regExpRes) {
          const startPos: Position = doc ? doc.positionAt(regExpRes.index) : new Position(0, 0);
          const endPos: Position = doc ? doc.positionAt(regExpRes.index + regExpRes[0].length) : new Position(0, 0);
          let location: Location = new Location(doc.uri, new Range(startPos, endPos));
          locations.push(location);
        }
      } while (regExpRes);
    }

    return locations;
  }
}
export const textParser = new TextParser();
