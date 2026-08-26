import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // У слайса checkout два публичных входа, и это осознанно (см. CLAUDE.md и комментарий
    // в самом файле): index.ts тянут клиентские компоненты, а server.ts — серверные, потому
    // что иначе Payload с его node:fs уехал бы в браузерный бандл. Для steiger второй вход
    // выглядит обходом public API, хотя направление зависимостей правильное: pages -> features.
    files: ['./src/**'],
    rules: {
      'fsd/no-public-api-sidestep': 'off',
    },
  },
])
