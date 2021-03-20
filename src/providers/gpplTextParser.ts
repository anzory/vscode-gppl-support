import { Position, Range, TextDocument, TextEditor, TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import { constants } from '../util/constants';

class GpplTextParser {
  private proceduresViewId: string = constants.proceduresViewId;
  activeEditor: TextEditor | undefined = window.activeTextEditor;

  getProcedureTreeItems(doc: TextDocument): TreeItem[] {
    let _procedures: TreeItem[] = [];
    // let treeSort = configuration.getParam('tree.sort');
    let treeSort: boolean = true;
    const text = doc ? doc.getText() : '';
    if (text === '') {
      return [];
    }
    const regExp: RegExp = /^\@\w+/gm;
    let regExpRes: RegExpExecArray | null;

    do {
      regExpRes = regExp.exec(text);
      if (regExpRes) {
        const startPos: Position = doc ? doc.positionAt(regExpRes.index) : new Position(0, 0);
        const endPos: Position = doc ? doc.positionAt(regExpRes.index + regExpRes[0].length) : new Position(0, 0);
        let treeItem: TreeItem = new TreeItem(
          regExpRes[0],
          TreeItemCollapsibleState.None,
        );
        treeItem.command = {
          command: this.proceduresViewId + '.Selection',
          title: '',
          arguments: [new Range(startPos, endPos)]
        };
        _procedures.push(treeItem);
      }
    } while (regExpRes);

    if (treeSort) {
      _procedures.sort((a: TreeItem, b: TreeItem) => {
        let labelA = a.label ? a.label : '';
        let labelB = b.label ? b.label : '';
        if (labelA > labelB) { return 1; };
        if (labelA < labelB) { return -1; };
        return 0;
      });
    }
    return _procedures;
  }
}
export const gpplTextParser = new GpplTextParser();