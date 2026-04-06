import {
  commands,
  Disposable,
  env,
  ExtensionContext,
  languages,
  Location,
  Position,
  TextEdit,
  TextEditor,
  Uri,
  window,
  workspace,
  WorkspaceEdit,
} from 'vscode';
import { GpplCodeLensProvider } from './providers/GpplCodeLensProvider';
import { GpplCompletionItemsProvider } from './providers/GpplCompletionItemsProvider';
import { GpplDefinitionProvider } from './providers/GpplDefinitionProvider';
import { GpplDocumentFormattingEditProvider } from './providers/GpplDocumentFormattingEditProvider';
import { GpplDocumentSymbolProvider } from './providers/GpplDocumentSymbolProvider';
import { GpplHoverProvider } from './providers/GpplHoverProvider';
import { GpplReferenceProvider } from './providers/GpplReferenceProvider';
import { Config } from './utils/config';
import { getConstants, initializeConstants } from './utils/constants';
import { createI18n } from './utils/i18n';
import { Logger, createLogger } from './utils/logger';
import { createSemanticHelper } from './utils/semanticHelper';
import { createTextParser } from './utils/textParser';
import { II18n, ITextParser, ISemanticHelper, ILogger } from './interfaces';

/** Disposables for language-feature providers managed by the config-change listener. */
let providerDisposables: Disposable[] = [];
let sharedTextParser: ITextParser | undefined;
let sharedI18n: II18n | undefined;
let sharedSemanticHelper: ISemanticHelper | undefined;
let sharedLogger: ILogger = createLogger();

/**
 * Registers all language-feature providers and returns their disposables.
 */
function registerProviders(
  semanticHelper: ISemanticHelper,
  textParser: ITextParser,
  i18n: II18n,
  logger: ILogger
): Disposable[] {
  const langId = getConstants().languageId;
  return [
    languages.registerCompletionItemProvider(
      langId,
      new GpplCompletionItemsProvider(i18n)
    ),
    languages.registerHoverProvider(langId, new GpplHoverProvider(semanticHelper, i18n)),
    languages.registerCodeLensProvider(langId, new GpplCodeLensProvider(semanticHelper, i18n, textParser)),
    languages.registerDocumentSymbolProvider(
      langId,
      new GpplDocumentSymbolProvider(textParser, i18n)
    ),
    languages.registerDefinitionProvider(
      langId,
      new GpplDefinitionProvider(semanticHelper, textParser)
    ),
    languages.registerReferenceProvider(
      langId,
      new GpplReferenceProvider(semanticHelper, textParser)
    ),
    languages.registerDocumentFormattingEditProvider(
      langId,
      new GpplDocumentFormattingEditProvider(logger)
    ),
  ];
}

/**
 * Activates the VS Code extension for SolidCAM GPP language support.
 *
 * This function is called when the extension is activated. It sets up:
 * - Configuration management
 * - Document formatting command
 * - Language feature providers (completion, hover, definition, reference, formatting, symbols)
 *
 * @param context - The extension context provided by VS Code
 */
export async function activate(context: ExtensionContext) {
  // Initialize a local logger instance so extension can pass logger into providers.
  sharedLogger = createLogger();
  sharedLogger.configure?.(context);

  // Ensure legacy modules can still log through the shared static logger.
  Logger.configure(context);

  // Initialize constants with proper subscription management
  initializeConstants(context.subscriptions);

  new Config().configure(context);

  sharedTextParser = createTextParser();
  sharedI18n = createI18n();
  sharedSemanticHelper = createSemanticHelper(sharedTextParser, sharedLogger);

  const constants = getConstants();

  context.subscriptions.push(
    commands.registerCommand(
      constants.commands.formatDocument,
      async () => {
        const activeEditor = window.activeTextEditor;
        const docUri: Uri | undefined = activeEditor?.document.uri;
        const textEdits: TextEdit[] | undefined =
          await commands.executeCommand(
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
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      constants.commands.showProcedureReferences,
      async (documentUri: Uri, position: Position, locations: Location[]) => {
        await commands.executeCommand(
          'editor.action.showReferences',
          documentUri,
          position,
          locations
        );
      }
    )
  );

  // Initialize semanticHelper (subscribe to events + initial parse)
  sharedSemanticHelper?.initialize();
  // Register semanticHelper for proper disposal
  if (sharedSemanticHelper) {
    context.subscriptions.push(sharedSemanticHelper as Disposable);
  }

  // Register initial providers
  if (sharedSemanticHelper && sharedTextParser && sharedI18n && sharedLogger) {
    providerDisposables = registerProviders(
      sharedSemanticHelper,
      sharedTextParser,
      sharedI18n,
      sharedLogger
    );
  }

  // Register configuration change listener
  registerConfigurationChangeListener(
    context,
    sharedSemanticHelper,
    sharedTextParser,
    sharedI18n,
    sharedLogger
  );
  // Show LSP promotion notification (once per user)
  const LSP_PROMOTION_KEY = 'gppl.lspPromotion.dismissed';
  if (!context.globalState.get<boolean>(LSP_PROMOTION_KEY)) {
    const selection = await window.showInformationMessage(
      'Try the new GPPL editor based on LSP server with extended capabilities! Details on the IndustryArena forum (https://bit.ly/forum-485393).',
      'OK',
      "Don't show again"
    );
    if (selection === 'OK') {
      await env.openExternal(Uri.parse('https://bit.ly/forum-485393'));
    } else if (selection === "Don't show again") {
      await context.globalState.update(LSP_PROMOTION_KEY, true);
    }
  }
}

/**
 * Handles configuration changes for the extension.
 *
 * When the GPP extension configuration changes, this function:
 * - Reformats all open GPP documents
 * - Updates internationalization settings
 * - Recreates language feature providers to apply new settings
 *
 * @param context - The extension context for managing subscriptions
 */
function registerConfigurationChangeListener(
  context: ExtensionContext,
  semanticHelper: ISemanticHelper | undefined,
  textParser: ITextParser | undefined,
  i18n: II18n | undefined,
  logger: ILogger
): void {
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      // Only react to GPP-related configuration changes
      if (!e.affectsConfiguration('gpp')) {
        return;
      }

      // Format all open GPP documents
      window.visibleTextEditors.forEach((editor: TextEditor) => {
        if (editor.document.languageId === getConstants().languageId) {
          commands.executeCommand('editor.action.formatDocument').then(undefined, err => logger?.error('Error formatting document on config change:', err));
        }
      });

      // Update internationalization settings
      i18n?.update();

      // Dispose old providers (without touching context.subscriptions)
      for (const d of providerDisposables) {
        d.dispose();
      }

      // Recreate providers with new settings
      providerDisposables = registerProviders(semanticHelper!, textParser!, i18n!, logger!);
    })
  );
}

/**
 * Deactivates the VS Code extension.
 *
 * This function is called when the extension is deactivated.
 * Cleans up Logger resources and provider disposables.
 */
export function deactivate() {
  for (const d of providerDisposables) {
    d.dispose();
  }
  providerDisposables = [];
  sharedTextParser?.clearCache();
  sharedSemanticHelper?.dispose();
  sharedLogger?.close();
  Logger.close();
}
