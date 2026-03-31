import { describe, it, expect } from 'vitest';
import { getProcedureName, getProcedureArgs, getInfo, getVariables } from '../../../utils/gpplParser';

describe('getProcedureName', () => {
    it('should extract procedure name', () => {
        expect(getProcedureName('@MyProc(arg1, arg2)')).toBe('@MyProc');
    });

    it('should handle name with spaces', () => {
        expect(getProcedureName('  @MyProc(arg1)  ')).toBe('@MyProc');
    });

    it('should handle name without args', () => {
        expect(getProcedureName('@SimpleProc')).toBe('@SimpleProc');
    });

    it('should strip comment', () => {
        expect(getProcedureName('@MyProc(arg1) ; some comment')).toBe('@MyProc');
    });

    it('should return empty for empty string', () => {
        expect(getProcedureName('')).toBe('');
    });
});

describe('getProcedureArgs', () => {
    it('should extract arguments', () => {
        expect(getProcedureArgs('@MyProc(arg1, arg2)')).toBe('arg1, arg2');
    });

    it('should return undefined when no arguments', () => {
        expect(getProcedureArgs('@SimpleProc')).toBeUndefined();
    });

    it('should handle single argument', () => {
        expect(getProcedureArgs('@MyProc(x)')).toBe('x');
    });

    it('should strip comment before parsing', () => {
        expect(getProcedureArgs('@MyProc(a, b) ; comment')).toBe('a, b');
    });
});

describe('getInfo', () => {
    it('should extract comment text', () => {
        expect(getInfo('@MyProc ; This is info')).toBe('This is info');
    });

    it('should return undefined when no comment', () => {
        expect(getInfo('@MyProc')).toBeUndefined();
    });

    it('should handle comment-only line', () => {
        expect(getInfo('; Just a comment')).toBe('; Just a comment');
    });
});

describe('getVariables', () => {
    it('should extract variable names', () => {
        expect(getVariables('local myVar', [])).toEqual(['myVar']);
    });

    it('should handle comma-separated variables', () => {
        expect(getVariables('local a, b, c', [])).toEqual(['a', 'b', 'c']);
    });

    it('should filter system variables', () => {
        expect(getVariables('local a, b, c', ['b'])).toEqual(['a', 'c']);
    });

    it('should handle multiple type keywords', () => {
        expect(getVariables('global integer count', [])).toEqual(['count']);
    });

    it('should strip comments', () => {
        expect(getVariables('local x ; comment', [])).toEqual(['x']);
    });
});
