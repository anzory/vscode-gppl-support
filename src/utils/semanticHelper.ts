import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  Disposable,
  Range,
  Location,
  TextDocumentChangeEvent,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import { constants } from './constants';
import { Logger } from './logger';
import { textParser } from './textParser';

/**
 * Interface representing a variable in GPP code.
 */
export interface IVariable {
  /** The name of the variable */
  name: string;
  /** The scope of the variable (global/local) */
  scope: string;
  /** The data type of the variable */
  type: string;
  /** Array of locations where this variable is referenced */
  references?: Location[];
  /** Additional information about the variable */
  info?: string | undefined;
}

/**
 * Interface representing a procedure in GPP code.
 */
export interface IProcedure {
  /** The name of the procedure */
  name: string;
  /** The arguments of the procedure */
  args?: string;
  /** Array of locations where this procedure is referenced */
  references?: Location[];
  /** Additional information about the procedure */
  info?: string | undefined;
}

/**
 * Cached system variable names loaded from language configuration.
 * This is static because system variables don't change between documents.
 */
let cachedSystemVariableNames: string[] | null = null;

/**
 * Loads system variable names from the GPP language configuration file.
 * Results are cached for performance.
 *
 * @returns Array of system variable names
 */
function getSystemVariableNames(): string[] {
  if (cachedSystemVariableNames !== null) {
    return cachedSystemVariableNames;
  }

  try {
    const tmLanguage = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          'languages',
          constants.languageId,
          'gpp.tmLanguage.json'
        )
      ).toString()
    );

    const keywordsPattern = tmLanguage.repository?.keywords?.patterns?.find(
      (pattern: { name?: string; match?: string }) => pattern.name === 'keyword.control.gpp'
    );

    if (keywordsPattern && keywordsPattern.match) {
      cachedSystemVariableNames = keywordsPattern.match
        .replace(/\(\?i\)\\b\(/g, '')
        .replace(/\)\\b/g, '')
        .split('|');
    } else {
      cachedSystemVariableNames = [];
    }
  } catch (error) {
    Logger.error('Error loading system variables:', error);
    cachedSystemVariableNames = [];
  }

  return cachedSystemVariableNames!;
}

/**
 * Provides semantic analysis functionality for GPP code.
 *
 * This class analyzes GPP documents to extract:
 * - User-defined variables and arrays (global and local)
 * - System variables
 * - Procedure definitions and calls
 * - References and relationships between elements
 */
class SemanticHelper implements Disposable {
  /** Current active text editor */
  private editor: TextEditor | undefined;
  /** Global user-defined variables extracted from the document */
  private _globalUserVariables: IVariable[] = [];
  /** Global user-defined arrays extracted from the document */
  private _globalUserArrays: IVariable[] = [];
  /** Local user-defined variables extracted from the document */
  private _localUserVariables: IVariable[] = [];
  /** Local user-defined arrays extracted from the document */
  private _localUserArrays: IVariable[] = [];
  /** System variables defined in GPP language configuration */
  private _systemGppVariables: IVariable[] = [];
  /** Procedure definitions extracted from the document */
  private _procedures: IProcedure[] = [];
  /** Timer for debouncing document change events */
  private debounceTimer?: ReturnType<typeof setTimeout>;
  /** Text parser instance for document analysis */
  private textParser = textParser;
  /** Cached document version to avoid unnecessary reparsing */
  private lastDocumentVersion: number = -1;
  /** Disposables to clean up on dispose */
  private disposables: Disposable[] = [];

  /**
   * Creates an instance of SemanticHelper.
   *
   * Sets up event listeners for document changes and initializes
   * the semantic analysis with the current active editor.
   */
  constructor() {
    this.disposables.push(
      workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e))
    );
    this.disposables.push(
      window.onDidChangeActiveTextEditor(() => this.onDocumentChanged())
    );
    this.editor = window.activeTextEditor;
    this.parseDocument();
  }

  /**
   * Disposes of the semantic helper and cleans up resources.
   */
  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.clearAllData();
  }

  /**
   * Gets all system variables defined in GPP.
   *
   * @returns Array of system variable definitions
   */
  getGpplSystemVariables(): IVariable[] {
    return this._systemGppVariables;
  }

  /**
   * Gets all global user-defined variables.
   *
   * @returns Array of global user variable definitions
   */
  getGlobalUserVariables(): IVariable[] {
    return this._globalUserVariables;
  }

  /**
   * Gets all global user-defined arrays.
   *
   * @returns Array of global user array definitions
   */
  getGlobalUserArrays(): IVariable[] {
    return this._globalUserArrays;
  }

  /**
   * Gets all local user-defined variables.
   *
   * @returns Array of local user variable definitions
   */
  getLocalUserVariables(): IVariable[] {
    return this._localUserVariables;
  }

  /**
   * Gets all local user-defined arrays.
   *
   * @returns Array of local user array definitions
   */
  getLocalUserArrays(): IVariable[] {
    return this._localUserArrays;
  }

  /**
   * Gets all procedure definitions.
   *
   * @returns Array of procedure definitions
   */
  getProcedures(): IProcedure[] {
    return this._procedures;
  }
  /**
   * Gets a global user-defined array by name.
   *
   * @param name - The name of the array to find
   * @returns The array definition or undefined if not found
   */
  getGlobalUserArray(name: string): IVariable | undefined {
    return this._globalUserArrays.find((gppVar) => gppVar.name === name);
  }

  /**
   * Gets a global user-defined variable by name.
   *
   * @param name - The name of the variable to find
   * @returns The variable definition or undefined if not found
   */
  getGlobalUserVariable(name: string): IVariable | undefined {
    let res: IVariable | undefined = undefined;
    if (
      this._globalUserVariables.some((variable) => {
        res = variable;
        return variable.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
  }

  /**
   * Gets a local user-defined array by name.
   *
   * @param name - The name of the array to find
   * @returns The array definition or undefined if not found
   */
  getLocalUserArray(name: string): IVariable | undefined {
    let res: IVariable | undefined = undefined;
    if (
      this._localUserArrays.some((array) => {
        res = array;
        return array.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
  }

  /**
   * Gets a local user-defined variable by name.
   *
   * @param name - The name of the variable to find
   * @returns The variable definition or undefined if not found
   */
  getLocalUserVariable(name: string): IVariable | undefined {
    let res: IVariable | undefined = undefined;
    if (
      this._localUserVariables.some((variable) => {
        res = variable;
        return variable.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
  }

  /**
   * Gets a system variable by name.
   *
   * @param name - The name of the system variable to find
   * @returns The system variable definition or undefined if not found
   */
  getGpplSystemVariable(name: string): IVariable | undefined {
    return this.findInArray(this._systemGppVariables, name);
  }

  /**
   * Gets a procedure by name.
   *
   * @param name - The name of the procedure to find
   * @returns The procedure definition or undefined if not found
   */
  getGpplProcedure(name: string): IProcedure | undefined {
    return this.findInArray(this._procedures, name);
  }

  /**
   * Finds an item in an array by name.
   *
   * @private
   * @param array - The array to search in
   * @param name - The name to search for
   * @returns The found item or undefined if not found
   */
  private findInArray<T extends { name: string }>(
    array: T[],
    name: string
  ): T | undefined {
    return array.find((item) => item.name === name);
  }

  /**
   * Parses system variables from the GPP language configuration.
   * Uses cached system variable names for better performance.
   *
   * @private
   */
  private parseSystemVariables() {
    this._systemGppVariables = [];

    const systemVarNames = getSystemVariableNames();
    const doc = this.editor?.document;

    systemVarNames.forEach((sv: string) => {
      this._systemGppVariables.push({
        name: sv,
        scope: 'global',
        type: '',
        references: doc
          ? this.textParser.getWordLocationsInDoc(doc, '\\b' + sv)
          : [],
        info: undefined,
      });
    });
  }

  /**
   * Parses procedure definitions from the current document.
   *
   * @private
   */
  private parseProcedures() {
    this._procedures = [];

    this.editor = window.activeTextEditor;
    const doc = this.editor?.document;
    if (doc) {
      const ranges: Range[] = this.textParser.getRegExpRangesInDoc(
        doc,
        /^\s*\@\w*\b.*$/gm
      );
      ranges.forEach((range) => {
        const line = doc.getText(range);
        if (line) {
          const info = this.getInfo(line);
          const name = this.getProcedureName(line);
          const args = this.getProcedureArgs(line);
          this._procedures.push({
            name: name,
            args: args,
            info: info,
            references: this.textParser.getWordLocationsInDoc(
              doc,
              'call ' + name
            ),
          });
        }
      });
    }
  }

  /**
   * Parses user-defined variables and arrays from the current document.
   *
   * @private
   */
  private parseUserVariables() {
    this._globalUserVariables = [];
    this._globalUserArrays = [];
    this._localUserVariables = [];
    this._localUserArrays = [];

    this.editor = window.activeTextEditor;
    const doc = this.editor?.document;
    if (doc) {
      let ranges: Range[] = this.textParser.getRegExpRangesInDoc(
        doc,
        /\bglobal\b.*$/gm
      );
      ranges.forEach((range) => {
        const line = doc.getText(range);
        if (line) {
          const gppInfo = this.getInfo(line);
          const gppScope = line.trim().split(' ')[0];
          const gppType = line.trim().split(' ')[1];
          this.getVariables(line).forEach((ugv) => {
            if (ugv.match(/<<.*>>/g)) {
              const uga = ugv.replace(/<<.*>>/g, '');
              this._globalUserArrays.push({
                name: uga,
                scope: gppScope,
                type: gppType + ' array',
                references: this.textParser.getWordLocationsInDoc(
                  doc,
                  '\\b' + uga
                ),
                info: gppInfo,
              });
            } else {
              this._globalUserVariables.push({
                name: ugv,
                scope: gppScope,
                type: gppType,
                references: this.textParser.getWordLocationsInDoc(
                  doc,
                  '\\b' + ugv
                ),
                info: gppInfo,
              });
            }
          });
        }
      });

      ranges = this.textParser.getRegExpRangesInDoc(doc, /\blocal\b.*$/gm);
      ranges.forEach((range) => {
        const line = doc.getText(range);
        if (line) {
          const gppInfo = this.getInfo(line);
          const gppScope = line.trim().split(' ')[0];
          const gppType = line.trim().split(' ')[1];
          this.getVariables(line).forEach((ulv) => {
            if (ulv.match(/<<.*>>/g)) {
              const ula = ulv.replace(/<<.*>>/g, '');
              this._localUserArrays.push({
                name: ula,
                scope: gppScope,
                type: gppType + ' array',
                references: this.textParser.getWordLocationsInDoc(
                  doc,
                  '\\b' + ula
                ),
                info: gppInfo,
              });
            } else {
              this._localUserVariables.push({
                name: ulv,
                scope: gppScope,
                type: gppType,
                references: this.textParser.getWordLocationsInDoc(
                  doc,
                  '\\b' + ulv
                ),
                info: gppInfo,
              });
            }
          });
        }
      });
    }
  }

  /**
   * Extracts additional information from a comment on the same line.
   *
   * @private
   * @param line - The line of code to extract info from
   * @returns The comment text or undefined if no comment found
   */
  private getInfo(line: string): string | undefined {
    if (/;/g.test(line)) {
      return line.replace(/^.+?;/gm, '').trim();
    } else {
      return undefined;
    }
  }

  /**
   * Extracts the procedure name from a procedure declaration line.
   *
   * @private
   * @param line - The procedure declaration line
   * @returns The procedure name
   */
  private getProcedureName(line: string): string {
    return line.replace(/;.*/gm, '').trim().replace(/\(.*/gm, '');
  }

  /**
   * Extracts procedure arguments from a procedure declaration line.
   *
   * @param line - The procedure declaration line
   * @returns The procedure arguments or undefined if no arguments
   */
  getProcedureArgs(line: string): string | undefined {
    let _arg = line.replace(/;.*/gm, '').trim();
    if (/\(/.test(_arg)) {
      return _arg.replace(/^(.+?)\(/gm, '').replace(/\).*$/gm, '');
    } else {
      return undefined;
    }
  }

  /**
   * Extracts variable names from a variable declaration line.
   *
   * @private
   * @param line - The variable declaration line
   * @returns Array of variable names found in the line
   */
  private getVariables(line: string): string[] {
    const _items: string[] = [];
    line
      .replace(/;.*/gm, '')
      .replace(/\bglobal\b/gm, '')
      .replace(/\blocal\b/gm, '')
      .replace(/\bstring\b/gm, '')
      .replace(/\blogical\b/gm, '')
      .replace(/\binteger\b/gm, '')
      .replace(/\bnumeric\b/gm, '')
      .replace(/\s{2,}/gm, ' ')
      .trim()
      .split(' ')
      .forEach((uv) => {
        if (uv && !this.isThisSystemVariable(uv)) {
          _items.push(uv);
        }
      });
    return _items;
  }

  /**
   * Checks if a given name is a system variable.
   *
   * @param name - The name to check
   * @returns True if the name is a system variable
   */
  isThisSystemVariable(name: string): boolean {
    return this._systemGppVariables.find((x) => x.name === name) ? true : false;
  }

  /**
   * Checks if a given name is a user-defined variable or array.
   *
   * @param name - The name to check
   * @returns True if the name is a user variable or array
   */
  isThisUserVariableOrArray(name: string): boolean {
    return (
      this.isThisLocalUserVariable(name) ||
      this.isThisGlobalUserVariable(name) ||
      this.isThisGloballUserArray(name) ||
      this.isThisLocalUserArray(name)
    );
  }

  /**
   * Checks if a given name is a global user-defined variable.
   *
   * @param name - The name to check
   * @returns True if the name is a global user variable
   */
  isThisGlobalUserVariable(name: string): boolean {
    return this._globalUserVariables.find((x) => x.name === name)
      ? true
      : false;
  }

  /**
   * Checks if a given name is a local user-defined variable.
   *
   * @param name - The name to check
   * @returns True if the name is a local user variable
   */
  isThisLocalUserVariable(name: string): boolean {
    return this._localUserVariables.find((x) => x.name === name) ? true : false;
  }

  /**
   * Checks if a given name is a global user-defined array.
   *
   * @param name - The name to check
   * @returns True if the name is a global user array
   */
  isThisGloballUserArray(name: string): boolean {
    return this._globalUserArrays.find((x) => x.name === name) ? true : false;
  }

  // Correctly spelled alias to avoid breaking callers and provide a clearer API
  isThisGlobalUserArray(name: string): boolean {
    return this.isThisGloballUserArray(name);
  }

  /**
   * Checks if a given name is a local user-defined array.
   *
   * @param name - The name to check
   * @returns True if the name is a local user array
   */
  isThisLocalUserArray(name: string): boolean {
    return this._localUserArrays.find((x) => x.name === name) ? true : false;
  }

  /**
   * Checks if a given name is a procedure declaration.
   *
   * @param name - The name to check
   * @returns True if the name starts with '@' (procedure declaration)
   */
  isThisProcedureDeclaration(name: string): boolean {
    const i = name.match(/@/);
    return i ? i.index === 0 : false;
  }

  /**
   * Parses the entire document to extract semantic information.
   */
  parseDocument() {
    try {
      this.parseUserVariables();
      this.parseSystemVariables();
      this.parseProcedures();
    } catch (error) {
      Logger.error('Error during document parsing:', error);
      // Clear data on error to prevent inconsistent state
      this.clearAllData();
    }
  }

  /**
   * Clears all parsed data arrays.
   *
   * @private
   */
  private clearAllData() {
    this._globalUserVariables = [];
    this._globalUserArrays = [];
    this._localUserVariables = [];
    this._localUserArrays = [];
    this._systemGppVariables = [];
    this._procedures = [];
  }

  /**
   * Handles document change events with debouncing.
   *
   * @param e - The document change event (optional)
   */
  onDocumentChanged(e?: TextDocumentChangeEvent) {
    // Use debouncing to prevent multiple parsing calls
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      try {
        this.parseDocument();
      } catch (error) {
        Logger.error('Error parsing document:', error);
      }
    }, 300);
  }
}
/**
 * Global instance of SemanticHelper for semantic analysis.
 *
 * This singleton instance provides semantic analysis functionality
 * for the currently active document in the extension.
 */
export const semanticHelper = new SemanticHelper();
