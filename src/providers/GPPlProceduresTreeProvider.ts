'use strict';
import {
  commands, Event, EventEmitter, ExtensionContext,
  Range, Selection, TextDocumentChangeEvent,
  TextEditor, TextEditorRevealType,
  TreeDataProvider, TreeItem, window, workspace
} from 'vscode';
import { constants } from '../util/constants';
import { StatusBar } from '../util/statusBar';
import { gpplTextParser } from './GpplTextParser';

export enum Sorting {
  byAZ = 1,
  byZA = -1,
  byDefault = 0,
}

export class GpplProceduresTreeProvider implements TreeDataProvider<TreeItem> {

  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;
  private editor: TextEditor | undefined;
  private tree: TreeItem[];
  private sorting: Sorting;

  constructor (private context: ExtensionContext) {
    this.editor = window.activeTextEditor;
    this.tree = [];
    this.sorting = Sorting.byDefault;
    window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
    workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
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
      this.tree = gpplTextParser.getProcedureTreeItems(this.editor.document, this.sorting);
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
    if (viewEnable) { commands.executeCommand('setContext', 'gpplProceduresTreeViewEnabled', viewEnable); }
  }
  sortByAZ() {
    this.sorting = Sorting.byAZ;
    this.refresh();
  }
  sortByZA() {
    this.sorting = Sorting.byZA;
    this.refresh();
  }
  sortByDefault() {
    this.sorting = Sorting.byDefault;
    this.refresh();
  }
}
