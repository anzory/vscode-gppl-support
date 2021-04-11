import { readFileSync } from 'fs';
import { resolve } from 'path';
import { TextDocumentChangeEvent, TextEditor, window, workspace } from 'vscode';
import { textParser } from './textParser';

class SemanticHelper {
  private editor: TextEditor | undefined;
  private _globalUserVariables: string[] = [];
  private _localUserVariables: string[] = [];
  private _systemVariables: string[] = [];

  constructor() {
    workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
    this.onDocumentChanged(undefined);
  }

  getSystemVariables(): string[] {
    return this._systemVariables;
  }
  getGlobalUserVariables(): string[] {
    return this._globalUserVariables;
  }
  getLocalUserVariables(): string[] {
    return this._localUserVariables;
  }

  private parseSystemVariables() {
    this._systemVariables = JSON.parse(
      readFileSync(
        resolve(__dirname, 'languages', 'gpp', 'gpp.tmLanguage.json')
      ).toString()
    )
      .repository.keywords.patterns[12].match.replace('(?i)\\b(', '')
      .replace(')\\b', '')
      .split('|');
  }

  private parseUserVariables() {
    this.editor = window.activeTextEditor;
    this._globalUserVariables = [];
    this._localUserVariables = [];
    let doc = this.editor?.document;
    if (doc === undefined) {
      return [];
    } else {
      let regExp = /(\bglobal\b).*$/gm;
      let locations = textParser.getItemLocations(doc, regExp);
      locations.forEach((loc) => {
        let line = doc?.getText(loc.range);
        if (line) {
          this.parseLine(line).forEach((ugv) => {
            this._globalUserVariables.push(ugv);
          });
        }
      });
      regExp = /(\blocal\b).*$/gm;
      locations = textParser.getItemLocations(doc, regExp);
      locations.forEach((loc) => {
        let line = doc?.getText(loc.range);
        if (line) {
          this.parseLine(line).forEach((ulv) => {
            this._localUserVariables.push(ulv);
          });
        }
      });
    }
  }
  private parseLine(line: string): string[] {
    let _items: string[] = [];
    line
      .replace(/\bglobal\b/g, '')
      .replace(/\blocal\b/g, '')
      .replace(/\bstring\b/g, '')
      .replace(/\blogical\b/g, '')
      .replace(/\binteger\b/g, '')
      .replace(/\bnumeric\b/g, '')
      .trim()
      .split(/\s/)
      .forEach((uv) => {
        if (!this.isThisSystemVariable(uv)) {
          _items.push(uv);
        }
      });
    return _items;
  }

  isThisSystemVariable(name: string): boolean {
    if (this._systemVariables.find((x) => x === name)) {
      return true;
    } else {
      return false;
    }
  }
  isThisUserVariable(name: string): boolean {
    if (this._globalUserVariables.find((x) => x === name)) {
      return true;
    } else if (this._localUserVariables.find((x) => x === name)) {
      return true;
    } else {
      return false;
    }
  }

  isThisProcedureDefinition(name: string): boolean {
    if (name.includes('@', 0)) {
    }
    return false;
  }

  onDocumentChanged(e?: TextDocumentChangeEvent) {
    this.parseUserVariables();
    this.parseSystemVariables();
  }
}
export const semanticHelper = new SemanticHelper();
