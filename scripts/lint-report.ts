import { ESLint } from 'eslint';

(async function main() {
  const eslint = new ESLint({
    extensions: ['.ts', '.tsx'],
    overrideConfigFile: './.eslintrc.json',
  });

  const results = await eslint.lintFiles(['src/**/*.{ts,tsx}', 'webview-ui/**/*.{ts,tsx}']);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);
  console.log(resultText);
})(); 