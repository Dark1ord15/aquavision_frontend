import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import UploadForm from '../components/UploadForm';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Cog6ToothIcon } from '@heroicons/react/24/solid';

// Константы классов и их цветов для детекции
const AVAILABLE_CLASSES = [
  'балкер',
  'контейнеровоз',
  'парусное судно',
  'рыбацкая лодка',
  'лайнер',
  'военный корабль',
  'яхта'
];

// Цвета для каждого класса объектов (используются для визуализации)
const CLASS_COLORS = {
  'контейнеровоз': '#0000ff',      // Синий
  'лайнер': '#ff00ff',             // Пурпурный
  'военный корабль': '#ffa500',    // Оранжевый
  'рыбацкая лодка': '#ffff00',     // Желтый
  'балкер': '#ff0000',             // Красный
  'парусное судно': '#00ffff',     // Голубой
  'яхта': '#00cc44'                // Зеленый
};

// Ключ для хранения настроек в localStorage
const STORAGE_KEY = 'detectionSettings';

/**
 * Загружает настройки из localStorage
 * @returns {Array} Массив выбранных классов или все классы по умолчанию
 */
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Проверяем, что сохраненные классы являются подмножеством доступных
      if (parsed.selectedClasses && Array.isArray(parsed.selectedClasses)) {
        return parsed.selectedClasses.filter(cls => AVAILABLE_CLASSES.includes(cls));
      }
    }
  } catch (e) {
    console.error('Ошибка загрузки настроек:', e);
  }
  // Возвращаем все классы по умолчанию
  return [...AVAILABLE_CLASSES];
};

/**
 * Основной компонент страницы детекции
 */
export default function DetectionPage() {
  // Состояния компонента
  const [file, setFile] = useState(null);              // Выбранный файл
  const [detection, setDetection] = useState(null);    // Результаты детекции
  const [selectedClasses, setSelectedClasses] = useState(() => loadSettings()); // Выбранные классы
  const [settingsOpen, setSettingsOpen] = useState(false); // Открыто ли меню настроек
  const [isLoading, setIsLoading] = useState(false);  // Состояние загрузки
  
  // Рефы
  const fileInputRef = useRef(null);      // Ссылка на скрытый input файла
  const settingsRef = useRef(null);       // Ссылка на меню настроек

  // Сохраняем настройки в localStorage при изменении
  useEffect(() => {
    const settings = { selectedClasses };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [selectedClasses]);

  // Обработчик клика вне области настроек
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Отправляет изображение на сервер для детекции
   */
  const handleDetect = async () => {
    if (!file) return alert('Выберите файл');
    
    setIsLoading(true);
    
    try {
      // 1. Загружаем изображение на сервер
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await axios.post('http://localhost:8000/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2. Отправляем запрос на детекцию
      const classesToSend = selectedClasses.length === AVAILABLE_CLASSES.length 
        ? AVAILABLE_CLASSES 
        : selectedClasses;

      const detectRes = await axios.post('http://localhost:8000/detect-image', {
        image_key: uploadRes.data.image_key,
        classes: classesToSend,
      });

      // 3. Сохраняем результаты
      setDetection({
        ...detectRes.data,
        originalImage: `http://localhost:9000/detections/${uploadRes.data.image_key}`,
        processedImage: `http://localhost:9000/detections/${detectRes.data.processed_image_key}`,
      });
    } catch (error) {
      console.error(error);
      alert('Ошибка при распознавании');
    } finally {
      setIsLoading(false);
    }
  };

  // Сброс состояния
  const handleReset = () => {
    setFile(null);
    setDetection(null);
  };

  // Обработчик выбора файла
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setDetection(null);
      e.target.value = ''; // Сбрасываем значение для возможности повторной загрузки
    }
  };

  /**
   * Скачивает обработанное изображение
   */
  const handleDownload = async () => {
    if (!detection) return;

    try {
      const response = await fetch(detection.processedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `detection_${detection.detection_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      alert('Не удалось скачать изображение');
    }
  };

  // Выбрать/снять все классы
  const toggleSelectAll = () => {
    setSelectedClasses(prev => 
      prev.length === AVAILABLE_CLASSES.length ? [] : [...AVAILABLE_CLASSES]
    );
  };

  // Переключить выбор конкретного класса
  const toggleClass = (cls) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // Подсчет количества объектов по классам
  const countByClass = () => {
    if (!detection?.object_classes) return {};
    return detection.object_classes.reduce((acc, cls) => {
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {});
  };

  return (
    <main className="min-h-screen bg-[#1F2833] px-6 py-8">
      <div className="flex flex-col gap-6 min-h-full">
        {/* Основная панель с загрузкой и результатами */}
        <div className="flex gap-6">
          {/* Левая панель - загрузка изображения */}
          <div className="w-1/2 bg-[#C5C6C7] rounded-lg shadow p-4 flex flex-col">
            <div className="flex items-center justify-center mb-4 gap-2">
              {/* Кнопка настроек (отображается только при выбранном файле) */}
              {file && !detection && (
                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="p-1 rounded hover:bg-gray-200"
                    title="Настройки классов"
                  >
                    <Cog6ToothIcon className="w-6 h-6 text-[#1F2833]" />
                  </button>

                  {/* Выпадающее меню настроек классов */}
                  {settingsOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded shadow-lg z-50 p-3 border border-gray-300">
                      <label className="flex items-center mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mr-2 accent-[#66FCF1]"
                          checked={selectedClasses.length === AVAILABLE_CLASSES.length}
                          onChange={toggleSelectAll}
                        />
                        <span className="font-semibold">Выбрать все</span>
                      </label>

                      <div className="max-h-48 overflow-y-auto">
                        {AVAILABLE_CLASSES.map(cls => (
                          <label key={cls} className="flex items-center mb-1 cursor-pointer">
                            <input
                              type="checkbox"
                              className="mr-2 accent-[#66FCF1]"
                              checked={selectedClasses.includes(cls)}
                              onChange={() => toggleClass(cls)}
                            />
                            <span>{cls}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h2 className="text-lg font-semibold text-center flex-grow text-[#0B0C10]">
                Исходное изображение
              </h2>

              {/* Кнопки управления (изменить/сбросить) */}
              {(file || detection) && (detection ? (
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-[#1F2833] text-white rounded-full p-1 ml-4 hover:text-[#66FCF1]"
                >
                  Изменить
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="bg-[#1F2833] rounded-full p-1 ml-4 hover:brightness-110 group"
                >
                  <XMarkIcon className="w-5 h-5 text-white group-hover:text-[#66FCF1]" />
                </button>
              ))}
            </div>

            {/* Область отображения/загрузки изображения */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {detection ? (
                <img
                  src={detection.originalImage}
                  alt="Original"
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <UploadForm file={file} setFile={setFile} />
              )}
            </div>

            {/* Кнопка детекции (отображается до получения результатов) */}
            {!detection && (
              <button
                onClick={handleDetect}
                disabled={!file || isLoading}
                className={`mt-4 w-full py-2 font-semibold rounded transition flex items-center justify-center ${
                  file && !isLoading
                    ? 'bg-[#1F2833] text-white hover:text-[#66FCF1]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Распознавание...
                  </>
                ) : (
                  'Распознать'
                )}
              </button>
            )}

            {/* Скрытый input для выбора файла */}
            <input
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {/* Правая панель - результаты детекции */}
          <div className="w-1/2 bg-[#C5C6C7] rounded-lg shadow p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-center flex-grow text-[#0B0C10]">
                Результат распознования
              </h2>
              {/* Кнопка скачивания результата */}
              {detection && (
                <button
                  onClick={handleDownload}
                  className="ml-4 bg-[#C5C6C7] border border-gray-300 rounded-full p-1 hover:bg-[#1F2833] group"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 text-[#1F2833] group-hover:text-[#66FCF1]" />
                </button>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#45A29E] mb-2"></div>
                  <p className="text-[#1F2833]">Обработка...</p>
                </div>
              ) : detection ? (
                <img
                  src={detection.processedImage}
                  alt="Результат"
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <p className="text-gray-500 text-center">
                  Здесь будет результат распознавания
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Детальная информация о детекции */}
        {detection && (
          <div className="bg-[#C5C6C7] rounded-lg shadow p-4 mt-6">
            <h2 className="text-lg font-semibold mb-3">Детали распознавания</h2>
            <div className="grid grid-cols-4 gap-4">
              {/* ID детекции */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm mb-1 text-[#1F2833]">№ Распознавания
                </div>
                <div className="font-medium">{detection.detection_id}</div>
              </div>
              
              {/* Общее количество объектов */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm mb-1 text-[#1F2833]">Количество обнаруженных объектов</div>
                <div className="font-medium">{detection.object_count}</div>
              </div>
              
              {/* Список обнаруженных классов */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm mb-1 text-[#1F2833]">Обнаруженные классы</div>
                <div className="flex flex-wrap gap-1">
                  {[...new Set(detection.object_classes)].map((cls, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: `${CLASS_COLORS[cls] || '#999999'}80`,
                        color: '#1F2833',
                        border: `1px solid ${CLASS_COLORS[cls] || '#999999'}`,
                      }}
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Количество объектов по классам */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm mb-1 text-[#1F2833]">Количество объектов по классам</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(countByClass()).map(([cls, count]) => (
                    <span
                      key={cls}
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: `${CLASS_COLORS[cls] || '#999999'}80`,
                        color: '#1F2833',
                        border: `1px solid ${CLASS_COLORS[cls] || '#999999'}`,
                      }}
                    >
                      {cls}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}