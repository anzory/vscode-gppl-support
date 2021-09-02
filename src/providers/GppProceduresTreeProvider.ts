'use strict';
import {
  commands,
  Event,
  EventEmitter,
  ExtensionContext,
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

export enum Sort {
  byAZ = 1,
  byZA = -1,
  byDefault = 0,
}

export class GppProceduresTreeProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;
  private editor: TextEditor | undefined;
  private tree: TreeItem[];
  private sorting: Sort;

  constructor(private context: ExtensionContext) {
    this.editor = window.activeTextEditor;
    this.tree = [];
    this.sorting = Sort.byDefault;
    window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
    workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
    StatusBar.update('Tree needs to be updated');
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

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }
  getChildren(element?: TreeItem): TreeItem[] {
    if (this.editor && this.editor.document) {
      this.tree = this.getProcedureTreeItemList(this.editor.document, this.sorting);
      return this.tree;
    } else {
      return [];
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
      commands.executeCommand('setContext', 'gppProceduresTreeViewEnabled', viewEnable);
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
  getProcedureTreeItemList(doc: TextDocument, sorting: Sort): TreeItem[] {
    let _procedures: TreeItem[] = [];
    const regExp: RegExp = /(?<=^[\s?]+)\@\w+/gm;
    textParser.getRegExpLocations(doc, regExp).forEach((item) => {
      let treeItem: TreeItem = new TreeItem(doc.getText(item.range), TreeItemCollapsibleState.None);
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
