import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Range, Location, TextDocumentChangeEvent, TextEditor, window, workspace } from 'vscode';
import { constants } from './constants';
import { textParser } from './textParser';

export interface IGpplVariable {
  name: string;
  scope: string;
  type: string;
  references?: Location[];
  info?: string | undefined;
}

class SemanticHelper {
  private editor: TextEditor | undefined;
  private _globalUserVariables: IGpplVariable[] = [];
  private _localUserVariables: IGpplVariable[] = [];
  private _systemGppVariables: IGpplVariable[] = [];

  constructor() {
    workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
    window.onDidChangeActiveTextEditor(() => this.onDocumentChanged());
    this.editor = window.activeTextEditor;
    this.onDocumentChanged(undefined);
  }

  getGpplSystemVariable(name: string): IGpplVariable | undefined {
    let res: IGpplVariable | undefined = undefined;
    if (
      this._systemGppVariables.some((gppVar) => {
        res = gppVar;
        return gppVar.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
  }

  getGlobalUserVariable(name: string): IGpplVariable | undefined {
    let res: IGpplVariable | undefined = undefined;
    if (
      this._globalUserVariables.some((gppVar) => {
        res = gppVar;
        return gppVar.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
  }
  getGpplSystemVariables(): IGpplVariable[] {
    return this._systemGppVariables;
  }
  getGlobalUserVariables(): IGpplVariable[] {
    return this._globalUserVariables;
  }
  getLocalUserVariables(): IGpplVariable[] {
    return this._localUserVariables;
  }
  getLocalUserVariable(name: string): IGpplVariable | undefined {
    let res: IGpplVariable | undefined = undefined;
    if (
      this._localUserVariables.some((gppVar) => {
        res = gppVar;
        return gppVar.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
  }

  private parseSystemVariables() {
    JSON.parse(readFileSync(resolve(__dirname, 'languages', constants.languageId, 'gppl.tmLanguage.json')).toString())
      .repository.keywords.patterns[12].match.replace('(?i)\\b(', '')
      .replace(')\\b', '')
      .split('|')
      .forEach((sv: string) => {
        this._systemGppVariables.push({
          name: sv,
          scope: 'global',
          type: '',
          references: textParser.getWordLocationsInDoc(this.editor?.document, '\\b' + sv),
          info: undefined,
        });
      });
  }

  private parseUserVariables() {
    this._globalUserVariables = [];
    this._localUserVariables = [];

    this.editor = window.activeTextEditor;
    const doc = this.editor?.document;
    if (doc) {
      let ranges: Range[] = textParser.getRegExpRangesInDoc(doc, /\bglobal\b.*$/gm);
      ranges.forEach((range) => {
        const line = doc?.getText(range);
        if (line) {
          line.trim().replace(/\s{2,}/g, ' ');
          const gppInfo = this.getInfo(line);
          const gppScope = line.trim().split(' ')[0];
          const gppType = line.trim().split(' ')[1];
          this.getVariables(line).forEach((ugv) => {
            this._globalUserVariables.push({
              name: ugv,
              scope: gppScope,
              type: gppType,
              references: textParser.getWordLocationsInDoc(doc, '\\b' + ugv),
              info: gppInfo,
            });
          });
        }
      });

      //

      ranges = textParser.getRegExpRangesInDoc(doc, /\blocal\b.*$/gm);
      ranges.forEach((range) => {
        const line = doc?.getText(range);
        if (line) {
          line.trim().replace(/\s{2,}/g, ' ');
          const gppInfo = this.getInfo(line);
          const gppScope = line.split(' ')[0];
          const gppType = line.split(' ')[1];
          this.getVariables(line).forEach((ulv) => {
            this._localUserVariables.push({
              name: ulv,
              scope: gppScope,
              type: gppType,
              references: textParser.getWordLocationsInDoc(doc, '\\b' + ulv),
              info: gppInfo,
            });
          });
        }
      });
    }
  }

  private getInfo(line: string): string | undefined {
    if (/;/.test(line)) {
      return line.replace(/^([^;]+);\s{0,}/g, '');
    } else {
      return undefined;
    }
  }

  private getVariables(line: string): string[] {
    const _items: string[] = [];
    line
      .replace(/;.*/g, '')
      .replace(/\bglobal\b/g, '')
      .replace(/\blocal\b/g, '')
      .replace(/\bstring\b/g, '')
      .replace(/\blogical\b/g, '')
      .replace(/\binteger\b/g, '')
      .replace(/\bnumeric\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .split(' ')
      .forEach((uv) => {
        if (uv && !this.isThisSystemVariable(uv)) {
          _items.push(uv);
        }
      });
    return _items;
  }

  isThisSystemVariable(name: string): boolean {
    return this._systemGppVariables.find((x) => x.name === name) ? true : false;
  }

  isThisUserVariable(name: string): boolean {
    return this.isThisLocalUserVariable(name) || this.isThisGlobalUserVariable(name);
  }

  isThisGlobalUserVariable(name: string): boolean {
    return this._globalUserVariables.find((x) => x.name === name) ? true : false;
  }

  isThisLocalUserVariable(name: string): boolean {
    return this._localUserVariables.find((x) => x.name === name) ? true : false;
  }

  isThisProcedureDeclaration(name: string): boolean {
    const i = name.match(/@/);
    return i ? i.index === 0 : false;
  }

  onDocumentChanged(e?: TextDocumentChangeEvent) {
    this.parseUserVariables();
    this.parseSystemVariables();

    //
    //
  }
}
export const semanticHelper = new SemanticHelper();
