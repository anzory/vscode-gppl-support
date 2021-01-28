'use strict';
import { 
    commands,
    Event,
    EventEmitter,
    ExtensionContext,
    TextDocumentChangeEvent,
    TextEditor,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    window,
    workspace 
} from 'vscode';
import { configuration } from '../util/config';


export class GPPlTreeStatusProvider implements TreeDataProvider<GPPlTreeStatusNode> {

    private _onDidChangeTreeData: EventEmitter<GPPlTreeStatusNode | undefined> = new EventEmitter<GPPlTreeStatusNode | undefined>();
    readonly onDidChangeTreeData: Event<GPPlTreeStatusNode | undefined> = this._onDidChangeTreeData.event;

    private text = '';
    private tree: Array<GPPlTreeStatusNode>;
    private editor: TextEditor | undefined;
    private autoRefresh = false;

    constructor(private context: ExtensionContext) {

        this.tree = [];
        this.editor = window.activeTextEditor;
        window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
        workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));

        this.autoRefresh = configuration.getParam('status.autoRefresh');

    }

    refresh(): void {
        
        this.parseTree();

        this._onDidChangeTreeData.fire(undefined);
    }

    private onActiveEditorChanged(): void {
        if (window.activeTextEditor) {
            if (window.activeTextEditor.document.uri.scheme === 'file') {
                const enabled = window.activeTextEditor.document.languageId === 'gppl';
                commands.executeCommand('setContext', 'gpplStatusViewEnabled', enabled);

                if (enabled) {
                    this.editor = window.activeTextEditor;
                    this.autoRefresh = configuration.getParam('status.autoRefresh');
                    if (this.autoRefresh) {this.refresh();}
                }
            }
        } else {
            commands.executeCommand('setContext', 'gpplStatusViewEnabled', false);
            this.refresh();
        }
    }

    private onDocumentChanged(changeEvent: TextDocumentChangeEvent): void {
        if (window.activeTextEditor) {
            if (window.activeTextEditor.document.uri.scheme === 'file') {
                const enabled = window.activeTextEditor.document.languageId === 'gppl';
                commands.executeCommand('setContext', 'gpplStatusViewEnabled', enabled);

                if (enabled) {
                    this.editor = window.activeTextEditor;
                    this.autoRefresh = configuration.getParam('status.autoRefresh');
                    if(this.autoRefresh) {this.refresh();}
                }
            }
        } else {
            commands.executeCommand('setContext', 'gpplStatusViewEnabled', false);
            this.refresh();
        }
    }

    getTreeItem(element: any): TreeItem {
        return element;
    }

    getChildren(element?: GPPlTreeStatusNode): Thenable<GPPlTreeStatusNode[]> {

        return Promise.resolve(this.parseTree());

        
    }

    private parseTree(): GPPlTreeStatusNode[] {

        this.text = '';
        this.tree = [];
        const editor = window.activeTextEditor;

        if (editor && editor.document) {
            this.text = editor.document.getText();

            return this.genStats(this.text);
        } else {
            
            return [];
        }
    }

    private genStats(text: string): Array<GPPlTreeStatusNode> {

        const status: Array<GPPlTreeStatusNode> = []; 
        
        return status;
    }
}

export class GPPlTreeStatusNode extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
    ) {
        super (label, collapsibleState);
    }

}