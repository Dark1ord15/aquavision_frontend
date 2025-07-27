// Импорт необходимых модулей
import { StrictMode } from 'react' // React StrictMode для дополнительных проверок
import { createRoot } from 'react-dom/client' // Новый API для рендеринга React 18+
import './index.css' // Глобальные стили приложения
import App from './App.jsx' // Главный компонент приложения

// Создание корневого элемента React и рендеринг приложения
createRoot(document.getElementById('root')).render(
  // Оборачиваем приложение в StrictMode для:
  // - Выявления потенциальных проблем
  // - Проверки устаревших API
  // - Дополнительных предупреждений
  <StrictMode>
    <App /> {/* Основной компонент приложения */}
  </StrictMode>,
)