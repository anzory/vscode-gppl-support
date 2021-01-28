'use strict';
import { Range, TreeItemCollapsibleState } from 'vscode';
import { Logger } from '../util/logger';
import { GPPlTreeNode } from './GPPlProceduresTreeProvider';

export class GPPlTextParser {

    private procedures: Array<GPPlTreeNode>;

    constructor(readonly text: string) {

        this.procedures = this.getProcedures(text);

    }

    getTree(): Array<GPPlTreeNode> {
        return this.procedures;
    }

    // Split Text into Procedures by newline or ;
    private getProcedures(text: string): Array<any> {

        const nodes: Array<any> = [];
        const lines = text.match(/.*(?:\r\n|\r|\n)/g) || [];

        for (let i = 0; i < lines.length; ++i) {

            const line = lines[i].trim();

            if (line.length === 0) {
                Logger.log("line.length === 0, continue");
                continue;
            }

            const result = this.parseLine(line, i);
            if (result.length !== 0) {
                nodes.push(result);
            }
        }

        return nodes;

    }

    // Parse Line for Procedures
    private parseLine(line: string, lineNum: number): Array<GPPlTreeNode> {

        const procedures: Array<GPPlTreeNode> = [];
        let node: GPPlTreeNode;
        const len = line.length;

        // Regexp to Pull key words
        const re = /^@.*\b/;

        // Strip Comments
        line = this.stripComments(line);

        // Get Procedures
        const words = line.match(re) || [];

        words.forEach(word => {
            node = new GPPlTreeNode(
                word,
                TreeItemCollapsibleState.None,
            );
            node.command = {
                command: 'gppl.gpplProceduresTree.Selection',
                title: "",
                arguments: [new Range(lineNum, 0, lineNum, len)]
            };

            procedures.push(node);
        });

        return procedures;
    }

    // Comments
    private stripComments(line: string): string {

        // Удалить всё после точки с запятой до конца строки, включая предшествующие пробелы.
        const re1 = new RegExp(/\s*;.*/g);
        const re2 = new RegExp(/\s+/g);

        return (line.replace(re1, '').replace(re2, ''));
    }
}