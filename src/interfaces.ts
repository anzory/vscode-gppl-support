import { Location, Position, Range, TextDocument } from 'vscode';
import { TranslateOptions } from 'i18n';
import { IVariable, IProcedure } from './utils/semanticHelper';

/**
 * Interface for the semantic analysis helper.
 *
 * Provides access to parsed semantic information about the current GPP document,
 * including variables, arrays, procedures, and their references.
 */
export interface ISemanticHelper {
    initialize(): void;
    dispose(): void;
    getGpplSystemVariables(): IVariable[];
    getGlobalUserVariables(): IVariable[];
    getGlobalUserArrays(): IVariable[];
    getLocalUserVariables(): IVariable[];
    getLocalUserArrays(): IVariable[];
    getProcedures(): IProcedure[];
    getReferencesFor(name: string): Location[];
    getProcedureCallReferences(name: string): Location[];
    getGlobalUserArray(name: string): IVariable | undefined;
    getGlobalUserVariable(name: string): IVariable | undefined;
    getLocalUserArray(name: string): IVariable | undefined;
    getLocalUserVariable(name: string): IVariable | undefined;
    getGpplSystemVariable(name: string): IVariable | undefined;
    getGpplProcedure(name: string): IProcedure | undefined;
    getProcedureArgs(line: string): string | undefined;
    isThisSystemVariable(name: string): boolean;
    isThisUserVariableOrArray(name: string): boolean;
    isThisGlobalUserVariable(name: string): boolean;
    isThisLocalUserVariable(name: string): boolean;
    isThisGlobalUserArray(name: string): boolean;
    isThisLocalUserArray(name: string): boolean;
    isThisProcedureDeclaration(name: string): boolean;
    parseDocument(): void;
}

/**
 * Interface for the text parser utility.
 *
 * Provides text searching and pattern matching functionality for GPP documents.
 */
export interface ITextParser {
    escapeRegExp(value: string): string;
    getWordLocationsInDoc(doc: TextDocument | undefined, word: string): Location[];
    getLocationsInDoc(doc: TextDocument | undefined, pattern: string): Location[];
    getWordLocationsForLiteral(doc: TextDocument | undefined, word: string): Location[];
    getRegExpRangesInDoc(doc: TextDocument | undefined, regExp: RegExp): Range[];
    clearCache(): void;
    isInsideComment(doc: TextDocument, position: Position): boolean;
}

/**
 * Interface for the internationalization helper.
 *
 * Provides translation of UI strings and messages.
 */
export interface II18n {
    t(phraseOrOptions: string | TranslateOptions): string;
    update(): void;
}

/**
 * Interface for the logger.
 *
 * Provides logging functionality with different log levels.
 */
export interface ILogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string | Error, error?: unknown): void;
    debug(message: string): void;
    show(): void;
}
