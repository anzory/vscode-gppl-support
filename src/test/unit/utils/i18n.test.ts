import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nService, createI18n } from '../../../utils/i18n';

// Mock the i18n npm package
vi.mock('i18n', () => {
    const I18n = vi.fn().mockImplementation(function (this: any, options: any) {
        this.options = options;
        this.__ = vi.fn().mockImplementation((phraseOrOptions: any) => {
            if (typeof phraseOrOptions === 'string') {
                return phraseOrOptions;
            }
            return phraseOrOptions.phrase || JSON.stringify(phraseOrOptions);
        });
    });
    return { I18n };
});

describe('I18nService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createI18n returns I18nService instance', () => {
        const i18n = createI18n();
        expect(i18n).toBeInstanceOf(I18nService);
    });

    it('t() initializes lazily on first call', () => {
        const service = new I18nService();
        const result = service.t('hello');
        expect(result).toBe('hello');
    });

    it('t() returns translation for string phrase', () => {
        const service = new I18nService();
        const result = service.t('some.key');
        expect(typeof result).toBe('string');
    });

    it('t() accepts TranslateOptions object', () => {
        const service = new I18nService();
        const result = service.t({ phrase: 'my.key', locale: 'en' });
        expect(typeof result).toBe('string');
    });

    it('t() does not reinitialize i18n on subsequent calls', () => {
        const service = new I18nService();
        // Access private field via any to verify
        service.t('first');
        const i18nInstanceAfterFirst = (service as any).i18n;
        service.t('second');
        const i18nInstanceAfterSecond = (service as any).i18n;
        // Should be the same instance
        expect(i18nInstanceAfterFirst).toBe(i18nInstanceAfterSecond);
    });

    it('update() reinitializes i18n', () => {
        const service = new I18nService();
        service.t('initial');
        const i18nBefore = (service as any).i18n;
        service.update();
        const i18nAfter = (service as any).i18n;
        // After update, a new i18n instance should be created
        expect(i18nAfter).not.toBe(i18nBefore);
    });

    it('update() after t() allows further translations', () => {
        const service = new I18nService();
        service.t('before update');
        service.update();
        const result = service.t('after update');
        expect(typeof result).toBe('string');
    });

    it('update() works even before t() is called', () => {
        const service = new I18nService();
        expect(() => service.update()).not.toThrow();
    });

    it('t() after update() works correctly', () => {
        const service = new I18nService();
        service.update();
        const result = service.t('key');
        expect(typeof result).toBe('string');
    });
});
