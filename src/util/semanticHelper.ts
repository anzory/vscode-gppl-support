import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  Range,
  Location,
  TextDocumentChangeEvent,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import { constants } from './constants';
import TextParser from './textParser';

export interface IGpplVariable {
  name: string;
  scope: string;
  type: string;
  references?: Location[];
  info?: string | undefined;
}

export interface IGpplProcedure {
  name: string;
  references?: Location[];
  info?: string | undefined;
}

class SemanticHelper {
  private editor: TextEditor | undefined;
  private _globalUserVariables: IGpplVariable[] = [];
  private _globalUserArrays: IGpplVariable[] = [];
  private _localUserVariables: IGpplVariable[] = [];
  private _localUserArrays: IGpplVariable[] = [];
  private _systemGppVariables: IGpplVariable[] = [];
  private _procedures: IGpplProcedure[] = [];
  private _date: number;
  private textParser = new TextParser();

  constructor() {
    workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
    window.onDidChangeActiveTextEditor(() => this.onDocumentChanged());
    this.editor = window.activeTextEditor;
    this._date = new Date().getTime();
    this.parseDocument();
  }

  getGpplSystemVariables(): IGpplVariable[] {
    return this._systemGppVariables;
  }
  getGlobalUserVariables(): IGpplVariable[] {
    return this._globalUserVariables;
  }
  getGlobalUserArrays(): IGpplVariable[] {
    return this._globalUserArrays;
  }
  getLocalUserVariables(): IGpplVariable[] {
    return this._localUserVariables;
  }
  getLocalUserArrays(): IGpplVariable[] {
    return this._localUserArrays;
  }
  getProcedures(): IGpplProcedure[] {
    return this._procedures;
  }
  getGlobalUserArray(name: string): IGpplVariable | undefined {
    let res: IGpplVariable | undefined = undefined;
    if (
      this._globalUserArrays.some((gppVar) => {
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
  getLocalUserArray(name: string): IGpplVariable | undefined {
    let res: IGpplVariable | undefined = undefined;
    if (
      this._localUserArrays.some((gppVar) => {
        res = gppVar;
        return gppVar.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
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
  getGpplProcedure(name: string): IGpplProcedure | undefined {
    let res: IGpplProcedure | undefined = undefined;
    if (
      this._procedures.some((gppVar) => {
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
    this._systemGppVariables = [];

    JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          'languages',
          constants.languageId,
          'gpp.tmLanguage.json'
        )
      ).toString()
    )
      .repository.keywords.patterns[12].match.replace('(?i)\\b(', '')
      .replace(')\\b', '')
      .split('|')
      .forEach((sv: string) => {
        this._systemGppVariables.push({
          name: sv,
          scope: 'global',
          type: '',
          references: this.textParser.getWordLocationsInDoc(
            this.editor?.document,
            '\\b' + sv
          ),
          info: undefined,
        });
      });
  }

  private parseProcedures() {
    this._procedures = [];

    this.editor = window.activeTextEditor;
    const doc = this.editor?.document;
    if (doc) {
      let ranges: Range[] = this.textParser.getRegExpRangesInDoc(
        doc,
        /^\s*\@\w*\b.*$/gm
      );
      ranges.forEach((range) => {
        const line = doc?.getText(range);
        if (line) {
          line.trim().replace(/\s{2,}/g, ' ');
          const info = this.getInfo(line);
          const name = this.getProcedure(line);
          this._procedures.push({
            name: name,
            info: info,
            references: this.textParser.getWordLocationsInDoc(
              doc,
              'call *' + name
            ),
          });
        }
      });
    }
  }

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
        const line = doc?.getText(range);
        if (line) {
          line.trim().replace(/\s{2,}/g, ' ');
          const gppInfo = this.getInfo(line);
          const gppScope = line.trim().split(' ')[0];
          const gppType = line.trim().split(' ')[1];
          this.getVariables(line).forEach((ugv) => {
            if (ugv.match(/<<.*>>/g)) {
              const uga = ugv.replace(/<<.*>>/g, '');
              this._globalUserArrays.push({
                name: uga /*.replace(/<<.*>>/g, '')*/,
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

      //

      ranges = this.textParser.getRegExpRangesInDoc(doc, /\blocal\b.*$/gm);
      ranges.forEach((range) => {
        const line = doc?.getText(range);
        if (line) {
          line.trim().replace(/\s{2,}/g, ' ');
          const gppInfo = this.getInfo(line);
          const gppScope = line.split(' ')[0];
          const gppType = line.split(' ')[1];
          this.getVariables(line).forEach((ulv) => {
            if (ulv.match(/<<.*>>/g)) {
              const ula = ulv.replace(/<<.*>>/, '');
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

  private getInfo(line: string): string | undefined {
    if (/;/.test(line)) {
      return line.replace(/^([^;]+);\s{0,}/g, '');
    } else {
      return undefined;
    }
  }

  private getProcedure(line: string) {
    return line
      .replace(/;.*/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
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

  isThisUserVariableOrArray(name: string): boolean {
    return (
      this.isThisLocalUserVariable(name) ||
      this.isThisGlobalUserVariable(name) ||
      this.isThisGloballUserArray(name) ||
      this.isThisLocalUserArray(name)
    );
  }

  isThisGlobalUserVariable(name: string): boolean {
    return this._globalUserVariables.find((x) => x.name === name)
      ? true
      : false;
  }

  isThisLocalUserVariable(name: string): boolean {
    return this._localUserVariables.find((x) => x.name === name) ? true : false;
  }

  isThisGloballUserArray(name: string): boolean {
    return this._globalUserArrays.find((x) => x.name === name) ? true : false;
  }

  isThisLocalUserArray(name: string): boolean {
    return this._localUserArrays.find((x) => x.name === name) ? true : false;
  }

  isThisProcedureDeclaration(name: string): boolean {
    const i = name.match(/@/);
    return i ? i.index === 0 : false;
  }

  parseDocument() {
    this.parseUserVariables();
    this.parseSystemVariables();
    this.parseProcedures();
  }

  onDocumentChanged(e?: TextDocumentChangeEvent) {
    const _p = 650;
    const _d = new Date().getTime();

    const timeoutId = setTimeout(() => {
      this.parseDocument();
    }, _p);

    if (_d - this._date < _p) {
      clearTimeout(timeoutId);
      this._date = new Date().getTime();
    }

    //
    //
  }
}
export const semanticHelper = new SemanticHelper();
