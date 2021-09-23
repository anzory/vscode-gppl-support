'use strict';
import {
  commands,
  Event,
  EventEmitter,
  ExtensionContext,
  Position,
  ProviderResult,
  Range,
  Selection,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
  TextEditorRevealType,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  workspace,
} from 'vscode';
import { constants } from '../util/constants';
import { StatusBar } from '../util/statusBar';
import { textParser } from '../util/textParser';

enum Sort {
  byAZ = 1,
  byZA = -1,
  byDefault = 0,
}

interface GpplElement {
  range: Range;
  label: string;
}

export class GpplProceduresTreeProvider implements TreeDataProvider<GpplElement> {
  private _onDidChangeTreeData: EventEmitter<GpplElement | undefined> = new EventEmitter<GpplElement | undefined>();
  readonly onDidChangeTreeData: Event<GpplElement | undefined> = this._onDidChangeTreeData.event;
  private editor: TextEditor | undefined = window.activeTextEditor;
  private sorting = Sort.byDefault;
  private doc: TextDocument | undefined = this.editor?.document;

  constructor(private context: ExtensionContext) {
    window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
    workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
    StatusBar.update('Tree needs to be updated');
  }

  getChildren(element: GpplElement): ProviderResult<GpplElement[]> {
    let ge: GpplElement[] = [];

    if (this.doc) {
      if (element) {
        ge = this._getChildren(element.range.start.line + 1, this._findEndOfRegion(element.range.start.line + 1));
      } else {
        ge = this._getChildren();
      }

      ge.sort((a: GpplElement, b: GpplElement) => {
        const labelA = a.label ? a.label : '';
        const labelB = b.label ? b.label : '';
        if (labelA > labelB) {
          return this.sorting;
        }
        if (labelA < labelB) {
          return -this.sorting;
        }
        return 0;
      });
      return ge;
    } else {
      return [];
    }
  }

  getTreeItem(element: GpplElement): TreeItem {
    const state = /@/.test(element.label) ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Expanded;
    const treeItem: TreeItem = new TreeItem(element.label, state);
    treeItem.command = {
      command: constants.commands.procedureSelection,
      title: constants.commands.procedureTitle,
      arguments: [element.range],
    };
    return treeItem;
  }

  private _getChildren(start = 0, end = this.doc?.lineCount): GpplElement[] {
    const findProcedure = /(?<=^[\s]{0,})@\w+\b/;
    const findRegion = /(?<=^[;\s]{0,})#region/;
    const findNameOfRegion = /(?<=^[;\s]{0,}#region\s{0,})\w+\b/;
    const children: GpplElement[] = [];
    let label = '';
    let range: Range;
    if (this.doc && end) {
      for (start; start < end; start++) {
        const text = this.doc.lineAt(start).text;
        if (findProcedure.test(text)) {
          let fp = findProcedure.exec(text);
          label = fp ? fp[0] : 'empty_name_function?';
          range = textParser.getWordLocations(this.doc, label)[0].range;
          children.push({
            label: label,
            range: range,
          });
        }
        if (findRegion.test(text)) {
          const nor = findNameOfRegion.exec(text);
          if (nor) {
            label = nor[0];
            range = textParser.getWordLocations(this.doc, label)[0].range;
          } else {
            label = 'UNNAMED_REGION';
            range = new Range(new Position(start, 0), new Position(start, text.length));
          }
          children.push({
            label: label,
            range: range,
          });
          start = this._findEndOfRegion(start);
        }
      }
      return children;
    } else {
      return [];
    }
  }

  private _findEndOfRegion(i: number): number {
    const findEndOfRegion = /#endregion/gm;
    const findRegion = /#region/gm;
    ++i;
    if (this.doc) {
      for (i; i < this.doc.lineCount; i++) {
        const text = this.doc.lineAt(i).text;
        if (findEndOfRegion.test(text)) {
          return i;
        } else if (findRegion.test(text)) {
          i = this._findEndOfRegion(i);
        }
      }
    }
    return i;
  }

  private onActiveEditorChanged(): void {
    StatusBar.update('Tree needs to be updated');
    if (window.activeTextEditor) {
      if (window.activeTextEditor.document.languageId === constants.languageId) {
        this.refresh(true);
      } else {
        this.refresh(false);
      }
    } else {
      this.refresh(false);
    }
  }

  private onDocumentChanged(changeEvent: TextDocumentChangeEvent): void {
    StatusBar.update('Tree needs to be updated');
    if (window.activeTextEditor) {
      if (window.activeTextEditor.document.languageId === constants.languageId) {
        this.refresh(true);
      } else {
        this.refresh(false);
      }
    }
  }

  select(range: Range) {
    if (this.editor) {
      this.editor.selection = new Selection(range.start, range.end);
      this.editor.revealRange(range, TextEditorRevealType.InCenter);
    }
  }
  refresh(viewEnable?: boolean): void {
    this._onDidChangeTreeData.fire(undefined);
    StatusBar.update('Tree successfully updated');
    this.editor = window.activeTextEditor;
    if (viewEnable) {
      commands.executeCommand('setContext', 'gpplProceduresTreeViewEnabled', viewEnable);
    }
  }
  sortByAZ() {
    this.sorting = Sort.byAZ;
    this.refresh();
  }
  sortByZA() {
    this.sorting = Sort.byZA;
    this.refresh();
  }
  sortByDefault() {
    this.sorting = Sort.byDefault;
    this.refresh();
  }
}
