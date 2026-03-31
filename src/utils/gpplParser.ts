/**
 * Pure parsing functions extracted from SemanticHelper.
 *
 * These functions have no side effects and operate only on their input strings.
 * @module gpplParser
 */

/**
 * Regex that matches all GPP variable type keywords in a single pass.
 */
const VARIABLE_KEYWORDS_RE = /\b(global|local|string|logical|integer|numeric)\b/g;

/**
 * Extracts the procedure name from a procedure declaration line.
 *
 * @param line - The procedure declaration line
 * @returns The procedure name (e.g. `@MyProc`)
 */
export function getProcedureName(line: string): string {
    return line.replace(/;.*/gm, '').trim().replace(/\(.*/gm, '');
}

/**
 * Extracts procedure arguments from a procedure declaration line.
 *
 * @param line - The procedure declaration line
 * @returns The procedure arguments string, or undefined if no arguments
 */
export function getProcedureArgs(line: string): string | undefined {
    const _arg = line.replace(/;.*/gm, '').trim();
    if (/\(/.test(_arg)) {
        return _arg.replace(/^(.+?)\(/gm, '').replace(/\).*$/gm, '');
    } else {
        return undefined;
    }
}

/**
 * Extracts additional information from a comment on the same line.
 *
 * @param line - The line of code to extract info from
 * @returns The comment text or undefined if no comment found
 */
export function getInfo(line: string): string | undefined {
    if (/;/g.test(line)) {
        return line.replace(/^.+?;/gm, '').trim();
    } else {
        return undefined;
    }
}

/**
 * Extracts variable names from a variable declaration line.
 * Filters out system variables provided in the `systemVariables` array.
 *
 * @param line - The variable declaration line
 * @param systemVariables - Array of system variable names to exclude
 * @returns Array of variable names found in the line
 */
export function getVariables(line: string, systemVariables: string[]): string[] {
    const _items: string[] = [];
    line
        .replace(/;.*/gm, '')
        .replace(VARIABLE_KEYWORDS_RE, '')
        .replace(/,/g, ' ')
        .replace(/\s{2,}/gm, ' ')
        .trim()
        .split(' ')
        .forEach((uv) => {
            const trimmed = uv.trim();
            if (trimmed && !systemVariables.includes(trimmed)) {
                _items.push(trimmed);
            }
        });
    return _items;
}
