'use strict';
import {
  commands,
  Disposable,
  ExtensionContext,
  languages,
  TextEdit,
  TextEditor,
  Uri,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { providers } from './providers/providers';
import { utils } from './utils/utils';

let completionItemProvider: Disposable;
let hoverProvider: Disposable;

export async function activate(context: ExtensionContext) {
  new utils.config().configure(context);

  const editor: TextEditor | undefined = window.activeTextEditor;
  const treeProvider = new providers.proceduresTreeProvider(context);
  commands.registerCommand(utils.constants.commands.refreshTree, () => {
    treeProvider.refresh();
  });
  commands.registerCommand(
    utils.constants.commands.procedureSelection,
    (range) => treeProvider.select(range)
  );
  commands.registerCommand(utils.constants.commands.sortByAZ, () =>
    treeProvider.sortByAZ()
  );
  commands.registerCommand(utils.constants.commands.sortByZA, () =>
    treeProvider.sortByZA()
  );
  commands.registerCommand(utils.constants.commands.sortByDefault, () =>
    treeProvider.sortByDefault()
  );
  commands.registerCommand(
    utils.constants.commands.formatDocument,
    async () => {
      const docUri: Uri | undefined = editor?.document.uri;
      const textEdits: TextEdit[] | undefined = await commands.executeCommand(
        'vscode.executeFormatDocumentProvider',
        docUri
      );
      if (textEdits && docUri) {
        const edit = new WorkspaceEdit();
        for (const textEdit of textEdits) {
          edit.replace(docUri, textEdit.range, textEdit.newText);
        }
        await workspace.applyEdit(edit);
      }
    }
  );
  context.subscriptions.push(
    window.registerTreeDataProvider(
      utils.constants.proceduresViewId,
      treeProvider
    )
  );

  completionItemProvider = languages.registerCompletionItemProvider(
    utils.constants.languageId,
    new providers.completionItemsProvider()
  );
  hoverProvider = languages.registerHoverProvider(
    utils.constants.languageId,
    new providers.hoverProvider()
  );
  context.subscriptions.push(completionItemProvider);
  context.subscriptions.push(hoverProvider);
  context.subscriptions.push(
    languages.registerDefinitionProvider(
      utils.constants.languageId,
      new providers.definitionProvider()
    )
  );
  context.subscriptions.push(
    languages.registerReferenceProvider(
      utils.constants.languageId,
      new providers.referenceProvider()
    )
  );

  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      utils.constants.languageId,
      new providers.formattingProvider()
    )
  );
}

workspace.onDidChangeConfiguration(() => {
  window.visibleTextEditors.forEach((editor: TextEditor) => {
    editor.document.languageId === utils.constants.languageId
      ? (commands.executeCommand(utils.constants.commands.formatDocument),
        commands.executeCommand('editor.action.formatDocument'))
      : null;
  });

  utils.i18n.update();
  completionItemProvider.dispose();
  hoverProvider.dispose();
  hoverProvider = languages.registerHoverProvider(
    utils.constants.languageId,
    new providers.hoverProvider()
  );
  completionItemProvider = languages.registerCompletionItemProvider(
    utils.constants.languageId,
    new providers.completionItemsProvider()
  );
});

export function deactivate() {}
