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

export interface IVariable {
  name: string;
  scope: string;
  type: string;
  references?: Location[];
  info?: string | undefined;
}

export interface IProcedure {
  name: string;
  args?: string;
  references?: Location[];
  info?: string | undefined;
}

class SemanticHelper {
  private editor: TextEditor | undefined;
  private _globalUserVariables: IVariable[] = [];
  private _globalUserArrays: IVariable[] = [];
  private _localUserVariables: IVariable[] = [];
  private _localUserArrays: IVariable[] = [];
  private _systemGppVariables: IVariable[] = [];
  private _procedures: IProcedure[] = [];
  private _date: number;
  private textParser = new TextParser();

  constructor() {
    workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e));
    window.onDidChangeActiveTextEditor(() => this.onDocumentChanged());
    this.editor = window.activeTextEditor;
    this._date = new Date().getTime();
    this.parseDocument();
  }

  getGpplSystemVariables(): IVariable[] {
    return this._systemGppVariables;
  }
  getGlobalUserVariables(): IVariable[] {
    return this._globalUserVariables;
  }
  getGlobalUserArrays(): IVariable[] {
    return this._globalUserArrays;
  }
  getLocalUserVariables(): IVariable[] {
    return this._localUserVariables;
  }
  getLocalUserArrays(): IVariable[] {
    return this._localUserArrays;
  }
  getProcedures(): IProcedure[] {
    return this._procedures;
  }
  getGlobalUserArray(name: string): IVariable | undefined {
    let res: IVariable | undefined = undefined;
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
  getGpplSystemVariable(name: string): IVariable | undefined {
    let res: IVariable | undefined = undefined;
    if (
      this._systemGppVariables.some((variable) => {
        res = variable;
        return variable.name === name;
      })
    ) {
      return res;
    } else {
      return undefined;
    }
  }
  getGpplProcedure(name: string): IProcedure | undefined {
    let res: IProcedure | undefined = undefined;
    if (
      this._procedures.some((procedure) => {
        res = procedure;
        return procedure.name === name;
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
          line.replace(/\s{2,}/gm, ' ').trim();
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
          line.trim().replace(/\s{2,}/gm, ' ');
          const gppInfo = this.getInfo(line);
          const gppScope = line.trim().split(' ')[0];
          const gppType = line.trim().split(' ')[1];
          this.getVariables(line).forEach((ugv) => {
            if (ugv.match(/<<.*>>/gm)) {
              const uga = ugv.replace(/<<.*>>/gm, '');
              this._globalUserArrays.push({
                name: uga /*.replace(/<<.*>>/gm, '')*/,
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
          line.trim().replace(/\s{2,}/gm, ' ');
          const gppInfo = this.getInfo(line);
          const gppScope = line.split(' ')[0];
          const gppType = line.split(' ')[1];
          this.getVariables(line).forEach((ulv) => {
            if (ulv.match(/<<.*>>/gm)) {
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
    if (/;/g.test(line)) {
      return line.replace(/^.+?;/gm, '').trim();
    } else {
      return undefined;
    }
  }

  private getProcedureName(line: string): string {
    return line.replace(/;.*/gm, '').trim().replace(/\(.*/gm, '');
  }

  getProcedureArgs(line: string): string | undefined {
    let _arg = line.replace(/;.*/gm, '').trim();
    if (/\(/.test(_arg)) {
      return _arg.replace(/^(.+?)\(/gm, '').replace(/\).*$/gm, '');
    } else {
      return undefined;
    }
  }

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
