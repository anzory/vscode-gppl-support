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


export class GpplProceduresTreeProvider implements TreeDataProvider<TreeItem> {

  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;
  private editor: TextEditor | undefined;

  constructor (private context: ExtensionContext) {
    this.editor = window.activeTextEditor;
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
      return gpplTextParser.getProcedureTreeItems(this.editor.document);
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
  refresh(viewEnable: boolean): void {
    this._onDidChangeTreeData.fire(undefined);
    StatusBar.update('Tree successfully updated');
    this.editor = window.activeTextEditor;
    commands.executeCommand('setContext', 'gpplProceduresTreeViewEnabled', viewEnable);
  }
}
