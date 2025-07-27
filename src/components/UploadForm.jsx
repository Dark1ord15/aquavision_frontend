// Импорт необходимых зависимостей
import React, { useState, useRef, useEffect } from 'react' // Базовые хуки React
import { CloudArrowUpIcon } from '@heroicons/react/24/outline' // Иконка загрузки

// Компонент формы для загрузки файлов
export default function UploadForm({ file, setFile }) {
  // Состояние для превью изображения
  const [preview, setPreview] = useState(null)
  // Реф для доступа к скрытому input элементу
  const fileInputRef = useRef(null)

  // Эффект для генерации превью при изменении файла
  useEffect(() => {
    if (file) {
      // Создаем URL для превью изображения
      setPreview(URL.createObjectURL(file))
    } else {
      // Очищаем превью если файл удален
      setPreview(null)
    }
  }, [file])

  // Обработчик изменения файла в input
  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      // Сбрасываем значение input для возможности повторной загрузки того же файла
      e.target.value = ''
    }
  }

  // Обработчик события перетаскивания файла
  const handleDrop = (e) => {
    e.preventDefault() // Предотвращаем стандартное поведение браузера
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
    }
  }

  return (
    <div
      // Основной контейнер с динамическими классами в зависимости от наличия файла
      className={`flex-1 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
        file
          ? 'border-none bg-[#0B0C10]' // Стили когда файл выбран
          : 'border-2 border-dashed border-gray-300 bg-[#C5C6C7]' // Стили по умолчанию
      }`}
      onDrop={handleDrop} // Обработчик перетаскивания
      onDragOver={(e) => e.preventDefault()} // Обязательно для работы drop
      onClick={() => !file && fileInputRef.current.click()} // Открываем выбор файла по клику
    >
      {preview ? (
        // Если есть превью - показываем изображение
        <img
          src={preview}
          alt="preview"
          className="w-full h-full object-contain rounded"
        />
      ) : (
        // Если нет файла - показываем зону загрузки
        <div className="flex flex-col items-center justify-center select-none px-4 text-[#0B0C10]">
          {/* Иконка загрузки */}
          <CloudArrowUpIcon className="w-12 h-12 mb-2" />
          {/* Инструкция для пользователя */}
          <p className="text-sm text-center">Перетащите файл сюда или</p>
          {/* Кнопка выбора файла */}
          <button
            type="button"
            className="mt-2 px-4 py-1 text-sm font-semibold text-[#0B0C10] border border-[#0B0C10] rounded hover:bg-[#1F2833] hover:text-[#66FCF1] transition-colors"
            onClick={(e) => {
              e.stopPropagation() // Предотвращаем всплытие события
              fileInputRef.current.click() // Программно кликаем по input
            }}
          >
            Выберите файл
          </button>
        </div>
      )}
      {/* Скрытый input для выбора файла */}
      <input
        type="file"
        accept="image/jpeg, image/png" // Разрешенные форматы
        className="hidden" // Скрываем элемент
        ref={fileInputRef} // Привязываем реф
        onChange={handleFileChange} // Обработчик выбора файла
      />
    </div>
  )
}