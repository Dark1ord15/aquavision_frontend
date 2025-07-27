// Импорт необходимых ESLint конфигураций и плагинов
import js from '@eslint/js' // Базовые правила ESLint
import globals from 'globals' // Глобальные переменные для разных сред (browser, node и т.д.)
import reactHooks from 'eslint-plugin-react-hooks' // Плагин для правил React Hooks
import reactRefresh from 'eslint-plugin-react-refresh' // Плагин для Fast Refresh

// Экспорт конфигурации ESLint (массив конфигов)
export default [
  // 1. Игнорируем папку dist при линтинге
  { ignores: ['dist'] },
  
  // 2. Основная конфигурация для JS/JSX файлов
  {
    files: ['**/*.{js,jsx}'], // Применять для всех JS/JSX файлов
    
    // Настройки языка
    languageOptions: {
      ecmaVersion: 2020, // Версия ECMAScript
      globals: globals.browser, // Глобальные переменные браузера (window, document и т.д.)
      parserOptions: {
        ecmaVersion: 'latest', // Использовать последнюю версию ECMAScript
        ecmaFeatures: { jsx: true }, // Поддержка JSX
        sourceType: 'module', // Использование ES-модулей
      },
    },
    
    // Подключаемые плагины
    plugins: {
      'react-hooks': reactHooks, // Плагин для работы с React Hooks
      'react-refresh': reactRefresh, // Плагин для React Fast Refresh
    },
    
    // Правила линтинга
    rules: {
      ...js.configs.recommended.rules, // Базовые рекомендуемые правила ESLint
      ...reactHooks.configs.recommended.rules, // Рекомендуемые правила для Hooks
      
      // Кастомные правила:
      'no-unused-vars': [ // Правило для неиспользуемых переменных
        'error', // Уровень ошибки
        { 
          varsIgnorePattern: '^[A-Z_]' // Игнорировать переменные в верхнем регистре (константы)
        }
      ],
      
      'react-refresh/only-export-components': [ // Правило для Fast Refresh
        'warn', // Уровень предупреждения
        { 
          allowConstantExport: true // Разрешить экспорт констант
        }
      ],
    },
  },
]