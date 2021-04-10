import {
  Location,
  Position,
  Range,
  TextDocument,
  TreeItem,
  TreeItemCollapsibleState,
} from 'vscode';
import { Sort } from '../providers/GppProceduresTreeProvider';
import { constants } from './constants';

interface ItemLocation {
  name: string;
  range: Range;
}

class TextParser {
  getItemLocations(
    doc: TextDocument | undefined,
    regExp: RegExp
  ): ItemLocation[] {
    const text = doc ? doc.getText() : '';
    if (text === '') {
      return [];
    }
    let items: ItemLocation[] = [];
    let regExpRes: RegExpExecArray | null;
    do {
      regExpRes = regExp.exec(text);
      if (regExpRes) {
        const startPos: Position = doc
          ? doc.positionAt(regExpRes.index)
          : new Position(0, 0);
        const endPos: Position = doc
          ? doc.positionAt(regExpRes.index + regExpRes[0].length)
          : new Position(0, 0);
        let item: ItemLocation = {
          name: regExpRes[0],
          range: new Range(startPos, endPos),
        };
        items.push(item);
      }
    } while (regExpRes);

    return items;
  }

  getWordLocations(doc: TextDocument, position: Position): Location[] {
    let locations: Location[] = [];
    let word = doc.getText(doc.getWordRangeAtPosition(position));
    const regExp: RegExp = new RegExp('(' + word + '\\b)', 'gm');

    this.getItemLocations(doc, regExp)?.forEach((item) => {
      let location: Location = new Location(doc.uri, item.range);
      locations.push(location);
    });

    return locations;
  }
  getProcedureTreeItemList(doc: TextDocument, sorting: Sort): TreeItem[] {
    let _procedures: TreeItem[] = [];
    const regExp: RegExp = /^\@\w+\b/gm;
    this.getItemLocations(doc, regExp)?.forEach((item) => {
      let treeItem: TreeItem = new TreeItem(
        item.name,
        TreeItemCollapsibleState.None
      );
      treeItem.command = {
        command: constants.commands.procedureSelection,
        title: '',
        arguments: [item.range],
      };
      _procedures.push(treeItem);
    });
    _procedures.sort((a: TreeItem, b: TreeItem) => {
      let labelA = a.label ? a.label : '';
      let labelB = b.label ? b.label : '';
      if (labelA > labelB) {
        return sorting;
      }
      if (labelA < labelB) {
        return -sorting;
      }
      return 0;
    });
    return _procedures;
  }
}
export const textParser = new TextParser();
