/**
 * Pure formatting functions extracted from GpplDocumentFormattingEditProvider.
 *
 * These functions have no VS Code dependencies and operate on plain strings.
 * @module gpplFormatter
 */

/**
 * Options for the formatting engine.
 */
export interface FormatOptions {
    /** The indentation string (e.g. two spaces or a tab) */
    indent: string;
    /** Whether to apply indentation to #region/#endregion blocks */
    applyIndentsToRegions: boolean;
}

/**
 * Creates an indentation string for the given indent level.
 */
function createIndent(indent: string, level: number): string {
    return indent.repeat(Math.max(0, level));
}

/**
 * Formats a single line with appropriate indentation using the original logic.
 */
function formatLineWithOriginalLogic(
    text: string,
    indentLevel: number,
    opts: FormatOptions
): { text: string; indentLevel: number } {
    // Block-starting constructs (indent increases AFTER)
    if (
        /^@\w+/.test(text) || // Procedure definitions
        /^\bif\b/i.test(text) || // Conditional statements
        /^\bwhile\b/i.test(text) || // Loops
        (opts.applyIndentsToRegions && /#region\b/.test(text))
    ) {
        const formattedText = createIndent(opts.indent, indentLevel) + text;
        return { text: formattedText, indentLevel: indentLevel + 1 };
    }

    // else/elseif constructs (special handling)
    if (/^\belse\b/i.test(text) || /^\belseif\b/i.test(text)) {
        indentLevel = Math.max(0, indentLevel - 1);
        const formattedText = createIndent(opts.indent, indentLevel) + text;
        return { text: formattedText, indentLevel: indentLevel + 1 };
    }

    // Block-ending constructs (indent decreases BEFORE)
    if (
        /^\bend(?:w|p|if)\b/i.test(text) || // endwhile, endproc, endif
        (opts.applyIndentsToRegions && /#endregion\b/.test(text))
    ) {
        indentLevel = Math.max(0, indentLevel - 1);
        return { text: createIndent(opts.indent, indentLevel) + text, indentLevel };
    }

    // Regular lines (current indent)
    if (text !== '') {
        return { text: createIndent(opts.indent, indentLevel) + text, indentLevel };
    }

    // Empty lines
    return { text, indentLevel };
}

/**
 * Computes formatted lines for an array of raw source lines.
 *
 * This is a pure function — it takes input lines and options, and returns
 * the formatted output without any side effects or VS Code API calls.
 *
 * @param lines - The raw source lines (already trimmed of leading whitespace by caller or not)
 * @param options - Formatting options
 * @returns Array of formatted lines with proper indentation
 */
export function computeFormattedLines(
    lines: string[],
    options: FormatOptions
): string[] {
    let indentLevel = 0;
    const result: string[] = [];

    for (const rawLine of lines) {
        let text = rawLine.trimStart();

        if (!text) {
            result.push('');
            continue;
        }

        // Normalize regions
        text = text.replace(/[;\s]*#\s*(end)?region\b/g, ';#$1region');

        // Check if line is a comment
        if (text.startsWith(';') && !/(;#(end)?region)/.test(text)) {
            result.push(createIndent(options.indent, indentLevel) + text);
            continue;
        }

        const formatted = formatLineWithOriginalLogic(text, indentLevel, options);
        result.push(formatted.text);
        indentLevel = formatted.indentLevel;
    }

    return result;
}
