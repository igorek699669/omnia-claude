import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // .next-e2e — каталог сборки E2E-прогона (см. e2e/scripts/config.mjs), такой же
    // артефакт, как и .next.
    ignores: [".next/**", ".next-e2e/**", "node_modules/**", "payload/payload-types.ts"],
  },
  {
    // Фикстуры Playwright объявляются как `async ({ ... }, use) => { await use(value) }`.
    // Правило принимает этот `use` за React-хук и требует компонент — здесь это не хук,
    // а способ отдать значение тесту.
    files: ["e2e/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
];

export default eslintConfig;
