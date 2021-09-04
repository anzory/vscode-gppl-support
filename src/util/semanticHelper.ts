import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Location, TextDocumentChangeEvent, TextEditor, window, workspace } from 'vscode';
import { textParser } from './textParser';

export interface IGppVariable {
  name: string;
  scope: string;
  type: string;
  references?: Location[];
  info?: string | undefined;
}

class SemanticHelper {
  private editor: TextEditor | undefined;
  private _globalUserVariables: string[] = [];
  private _globalGppUserVariables: IGppVariable[] = [];
  private _localUserVariables: string[] = [];
  private _localGppUserVariables: IGppVariable[] = [];
  private _systemVariables: string[] = [];
  private _systemGppVariables: IGppVariable[] = [];

  constructor() {
    workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
    window.onDidChangeActiveTextEditor(() => this.onDocumentChanged());
    this.editor = window.activeTextEditor;
    this.onDocumentChanged(undefined);
  }

  getSystemVariables(): string[] {
    return this._systemVariables;
  }
  getGppSystemVariables(): IGppVariable[] {
    return this._systemGppVariables;
  }
  getGppSystemVariable(name: string): IGppVariable | undefined {
    let res: IGppVariable | undefined = undefined;
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

  getGlobalUserVariables(): string[] {
    return this._globalUserVariables;
  }
  getGlobalGppUserVariables(): IGppVariable[] {
    return this._globalGppUserVariables;
  }
  getGlobalGppUserVariable(name: string): IGppVariable | undefined {
    let res: IGppVariable | undefined = undefined;
    if (
      this._globalGppUserVariables.some((gppVar) => {
        res = gppVar;
        return gppVar.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
  }
  getLocalUserVariables(): string[] {
    return this._localUserVariables;
  }
  getLocalGppUserVariables(): IGppVariable[] {
    return this._localGppUserVariables;
  }
  getLocalGppUserVariable(name: string): IGppVariable | undefined {
    let res: IGppVariable | undefined = undefined;
    if (
      this._localGppUserVariables.some((gppVar) => {
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
    this._systemVariables = JSON.parse(
      readFileSync(resolve(__dirname, 'languages', 'gpp', 'gpp.tmLanguage.json')).toString()
    )
      .repository.keywords.patterns[12].match.replace('(?i)\\b(', '')
      .replace(')\\b', '')
      .split('|');
    this._systemVariables.forEach((sv) => {
      this._systemGppVariables.push({
        name: sv,
        scope: 'global',
        type: '',
        references: textParser.getWordLocations(this.editor?.document, '\\b' + sv),
        info: undefined,
      });
    });
  }

  private parseUserVariables() {
    this._globalUserVariables = [];
    this._globalGppUserVariables = [];
    this._localUserVariables = [];
    this._localGppUserVariables = [];

    this.editor = window.activeTextEditor;
    let doc = this.editor?.document;
    if (doc) {
      let locations: Location[] = textParser.getRegExpLocations(doc, /\bglobal\b.*$/gm);
      locations.forEach((location) => {
        let line = doc?.getText(location.range);
        if (line) {
          line.trim().replaceAll(/\s{2,}/g, ' ');
          let gppInfo = this.getInfo(line);
          let gppScope = line.trim().split(' ')[0];
          let gppType = line.trim().split(' ')[1];
          this.getVariables(line).forEach((ugv) => {
            this._globalUserVariables.push(ugv);
            this._globalGppUserVariables.push({
              name: ugv,
              scope: gppScope,
              type: gppType,
              references: textParser.getWordLocations(doc, '\\b' + ugv),
              info: gppInfo,
            });
          });
        }
      });

      //

      locations = textParser.getRegExpLocations(doc, /\blocal\b.*$/gm);
      locations.forEach((location) => {
        let line = doc?.getText(location.range);
        if (line) {
          line.trim().replaceAll(/\s{2,}/g, ' ');
          let gppInfo = this.getInfo(line);
          let gppScope = line.split(' ')[0];
          let gppType = line.split(' ')[1];
          this.getVariables(line).forEach((ulv) => {
            this._localUserVariables.push(ulv);
            this._localGppUserVariables.push({
              name: ulv,
              scope: gppScope,
              type: gppType,
              references: textParser.getWordLocations(doc, '\\b' + ulv),
              info: gppInfo,
            });
          });
        }
      });
    }
  }

  private getInfo(line: string): string | undefined {
    if (/\;/.test(line)) {
      return line.replace(/^([^\;]+);\s{0,}/g, '');
    } else {
      return undefined;
    }
  }

  private getVariables(line: string): string[] {
    let _items: string[] = [];
    line
      .replace(/\;.*/g, '')
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
    return this._systemVariables.find((x) => x === name) ? true : false;
  }

  isThisUserVariable(name: string): boolean {
    return this.isThisLocalUserVariable(name) || this.isThisGlobalUserVariable(name);
  }

  isThisGlobalUserVariable(name: string): boolean {
    return this._globalUserVariables.find((x) => x === name) ? true : false;
  }

  isThisLocalUserVariable(name: string): boolean {
    return this._localUserVariables.find((x) => x === name) ? true : false;
  }

  isThisProcedureDeclaration(name: string): boolean {
    let i = name.match(/\@/);
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
