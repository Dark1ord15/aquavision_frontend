// Импорт необходимых компонентов из react-router-dom для навигации
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Импорт компонентов приложения
import Navbar from './components/Navbar'         // Навигационная панель
import DetectionPage from './pages/DetectionPage' // Страница детекции
import HistoryPage from './pages/HistoryPage'    // Страница истории

/**
 * Главный компонент приложения, который:
 * 1. Настраивает маршрутизацию
 * 2. Отображает навигационную панель
 * 3. Управляет отображением страниц
 */
export default function App() {
  return (
    // Компонент Router - корневой для маршрутизации
    <Router>
      {/* Навигационная панель (отображается на всех страницах) */}
      <Navbar />
      
      {/* Контейнер для маршрутов */}
      <Routes>
        {/* Маршрут для главной страницы (детекция) */}
        <Route path="/" element={<DetectionPage />} />
        
        {/* Маршрут для страницы истории */}
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Router>
  )
}