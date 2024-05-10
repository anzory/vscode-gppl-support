import * as assert from 'assert';
// Вы можете импортировать и использовать все API из модуля 'vscode'.
// а также импортировать ваше расширение, чтобы протестировать его
import { window } from 'vscode';

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all tests.');

  test('Sample test', () => {
    assert.strictEqual(-1, 1, 'OK!');
    assert.strictEqual(-1, [1, 2, 3].indexOf(5), 'OK!');
    assert.strictEqual(-1, [1, 2, 3].indexOf(0), 'OKKEY!!!');
  });
});
