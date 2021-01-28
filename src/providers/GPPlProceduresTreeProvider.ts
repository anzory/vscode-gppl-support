'use strict';
import { 
    commands, 
    Event, 
    EventEmitter, 
    ExtensionContext, 
    Range, 
    Selection, 
    TextDocumentChangeEvent, 
    TextEditor, 
    TextEditorRevealType, 
    TreeDataProvider, 
    TreeItem, 
    TreeItemCollapsibleState, 
    window, 
    workspace 
} from 'vscode';
import * as path from 'path';
import { configuration } from '../util/config';
import * as gpplparser from './gpplTextParser';
import { constants } from '../util/constants';
import { StatusBar } from '../util/statusBar';
import { Logger } from '../util/logger';


export class GPPlProceduresTreeProvider implements TreeDataProvider<GPPlTreeNode> {

    private _onDidChangeTreeData: EventEmitter<GPPlTreeNode | undefined> = new EventEmitter<GPPlTreeNode | undefined>();
    readonly onDidChangeTreeData: Event<GPPlTreeNode | undefined> = this._onDidChangeTreeData.event;

    private text = '';
    private tree: Array<GPPlTreeNode>;
    private editor: TextEditor | undefined;
    private autoRefresh = false;

    constructor(private context: ExtensionContext) {
        this.tree = [];
        this.editor = window.activeTextEditor;
        window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
        workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));

        this.parseTree();

        this.autoRefresh = configuration.getParam('tree.autoRefresh');

        this.onActiveEditorChanged();

    }

    refresh(): void {
        
        this.parseTree();

        this._onDidChangeTreeData.fire(undefined);
        StatusBar.updateStatusBar('Tree Up to Date');
    }

    private onActiveEditorChanged(): void {
        if (window.activeTextEditor) {
            if (window.activeTextEditor.document.uri.scheme === 'file') {
                const enabled = window.activeTextEditor.document.languageId === 'gppl';
                commands.executeCommand('setContext', 'gpplProceduresTreeViewEnabled', enabled);

                if (enabled) {
                    this.editor = window.activeTextEditor;
                    this.autoRefresh = configuration.getParam('tree.autoRefresh');
                    StatusBar.updateStatusBar('Tree Dirty');
                    if (this.autoRefresh) this.refresh();
                }
            }
        } else {
            commands.executeCommand('setContext', 'gpplProceduresTreeViewEnabled', false);
            this.refresh();
            StatusBar.hideStatusBar();
        }
    }

    private onDocumentChanged(changeEvent: TextDocumentChangeEvent): void {
        if (window.activeTextEditor) {
            if (window.activeTextEditor.document.uri.scheme === 'file') {
                const enabled = window.activeTextEditor.document.languageId === 'gppl';
                commands.executeCommand('setContext', 'gpplProceduresTreeViewEnabled', enabled);

                if (enabled) {
                    this.editor = window.activeTextEditor;
                    this.autoRefresh = configuration.getParam('tree.autoRefresh');
                    StatusBar.updateStatusBar('Tree Dirty');
                    if (this.autoRefresh) this.refresh();
                }
            }
        } else {
            commands.executeCommand('setContext', 'gpplProceduresTreeViewEnabled', false);
            this.refresh();
            StatusBar.hideStatusBar();
        }
    }

    getTreeItem(element: any): TreeItem {
        return element[0];
    }

    getChildren(element?: GPPlTreeNode): Thenable<GPPlTreeNode[]> {

        return Promise.resolve(this.parseTree());
    }

    private parseTree(): GPPlTreeNode[] {

        this.text = '';
        this.tree = [];
        const editor = window.activeTextEditor;
    
        if (editor && editor.document) {
            this.text = editor.document.getText();
    
            const parsed = new gpplparser.GPPlTextParser(this.text);

            Logger.log("document.text:\n" + this.text);

            return parsed.getTree();
    
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
}


export class GPPlTreeNode extends TreeItem {

    constructor(
        public readonly GPPlTreeNodeLabel: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
    ) {
        super(GPPlTreeNodeLabel, collapsibleState);
    }
}