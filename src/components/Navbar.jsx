// Импорт компонентов из библиотек
import { Disclosure } from '@headlessui/react'  // Компонент для доступных раскрывающихся элементов
import { Link } from 'react-router-dom'        // Компонент для навигации между страницами
import logo from '../assets/logo.svg'          // Импорт логотипа

// Основной компонент навигационной панели
export default function Navbar() {
  return (
    // Компонент Disclosure как навигация с заданными стилями
    <Disclosure as="nav" className="bg-[#0B0C10] z-50">
      {/* Фрагмент React (<>...</>) для группировки элементов без дополнительного DOM-узла */}
      <>
        {/* Основной контейнер навигации */}
        <div className="flex items-center h-22 px-4">
          
          {/* Контейнер для логотипа (занимает 10% ширины) */}
          <div className="flex-shrink-0 w-[10%] mt-8">
            {/* Изображение логотипа с адаптивными размерами */}
            <img 
              className="h-30 w-auto"  // Высота 30, ширина автоматическая
              src={logo}               // Источник изображения
              alt="AquaVision"         // Альтернативный текст
            />
          </div>

          {/* Контейнер для ссылок (занимает 90% ширины) */}
          <div className="flex w-[90%] justify-between">
            
            {/* Ссылка на страницу детекции */}
            <Link
              to="/"  // Путь к главной странице
              className="w-[45%] text-center text-2xl font-semibold py-2 flex items-center justify-center rounded-md text-white hover:bg-[#1F2833] hover:text-[#66FCF1]"
              /* Стили:
                 - ширина 45%
                 - крупный текст (text-2xl)
                 - полужирный шрифт
                 - вертикальные отступы
                 - скругленные углы
                 - белый текст
                 - эффекты при наведении: изменение фона и цвета текста
              */
            >
              Распознавание
            </Link>

            {/* Ссылка на страницу истории */}
            <Link
              to="/history"  // Путь к странице истории
              className="w-[45%] text-center text-2xl font-semibold py-2 flex items-center justify-center rounded-md text-white hover:bg-[#1F2833] hover:text-[#66FCF1]"
              /* Аналогичные стили как у первой ссылки */
            >
              История
            </Link>
          </div>
        </div>
      </>
    </Disclosure>
  )
}