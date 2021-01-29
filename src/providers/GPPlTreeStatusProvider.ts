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


export class GpplTreeStatusProvider implements TreeDataProvider<GpplTreeStatusNode> {

    private _onDidChangeTreeData: EventEmitter<GpplTreeStatusNode | undefined> = new EventEmitter<GpplTreeStatusNode | undefined>();
    readonly onDidChangeTreeData: Event<GpplTreeStatusNode | undefined> = this._onDidChangeTreeData.event;

    private text = '';
    private tree: Array<GpplTreeStatusNode>;
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

    getChildren(element?: GpplTreeStatusNode): Thenable<GpplTreeStatusNode[]> {

        return Promise.resolve(this.parseTree());

        
    }

    private parseTree(): GpplTreeStatusNode[] {

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

    private genStats(text: string): Array<GpplTreeStatusNode> {

        const status: Array<GpplTreeStatusNode> = []; 
        
        return status;
    }
}

export class GpplTreeStatusNode extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
    ) {
        super (label, collapsibleState);
    }

}