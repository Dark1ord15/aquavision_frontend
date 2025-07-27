import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon, Cog6ToothIcon, ArrowDownTrayIcon, FunnelIcon, CheckIcon } from '@heroicons/react/24/outline';

// Константы для пагинации и классов объектов
const PAGE_SIZE = 10; // Количество элементов на странице

// Доступные классы объектов для детекции
const AVAILABLE_CLASSES = [
  'контейнеровоз',
  'лайнер',
  'военный корабль',
  'рыбацкая лодка',
  'балкер',
  'парусное судно',
  'яхта'
];

// Цвета для визуализации разных классов объектов
const classColors = {
  'контейнеровоз': '#0000ff',
  'лайнер': '#ff00ff',
  'военный корабль': '#ffa500',
  'рыбацкая лодка': '#ffff00',
  'балкер': '#ff0000',
  'парусное судно': '#00ffff',
  'яхта': '#00cc44',
};

// Соответствие русских названий классов английским ключам для API
const CLASS_TO_API_KEY = {
  'контейнеровоз': 'container_ship',
  'лайнер': 'liner',
  'военный корабль': 'warship',
  'рыбацкая лодка': 'fishing_boat',
  'балкер': 'bulk_carrier',
  'парусное судно': 'sailboat',
  'яхта': 'canoe',
};

/**
 * Компонент модального окна для просмотра настроек классов
 */
function SettingsModal({ isOpen, onClose, settingsClasses = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Распознаваемые классы</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {settingsClasses.length > 0 ? (
          <ul className="space-y-2 max-h-60 overflow-auto">
            {settingsClasses.map(cls => (
              <li key={cls} className="px-3 py-1 rounded text-[#1F2833]"
                style={{
                  backgroundColor: `${classColors[cls] || '#999999'}20`,
                  border: `1px solid ${classColors[cls] || '#999999'}`,
                }}>
                {cls}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Нет классов для отображения</p>
        )}
      </div>
    </div>
  );
}

/**
 * Кнопка для открытия модального окна с настройками
 */
function SettingsButton({ settingsClasses }) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <button onClick={() => setModalOpen(true)} className="p-1 rounded text-blue-600 hover:text-[#66FCF1]">
        <Cog6ToothIcon className="w-6 h-6" />
      </button>
      <SettingsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} settingsClasses={settingsClasses} />
    </>
  );
}

/**
 * Основной компонент страницы истории детекций
 */
export default function HistoryPage() {
  // Состояния компонента
  const [detections, setDetections] = useState([]); // Список детекций
  const [currentPage, setCurrentPage] = useState(1); // Текущая страница
  const [loading, setLoading] = useState(false); // Состояние загрузки
  const [error, setError] = useState(null); // Ошибки
  const [modalImage, setModalImage] = useState(null); // URL изображения для модального окна
  const [showFilters, setShowFilters] = useState(false); // Видимость фильтров
  
  // Черновик фильтров (еще не примененные)
  const [draftFilters, setDraftFilters] = useState({
    detectionId: '',
    dateRange: { start: '', end: '' },
    objectCount: { min: '', max: '' },
    classFilters: AVAILABLE_CLASSES.reduce((acc, cls) => {
      acc[cls] = {
        enabled: true,
        min: '',
        max: ''
      };
      return acc;
    }, {})
  });

  // Примененные фильтры (на их основе делаются запросы)
  const [filters, setFilters] = useState(draftFilters);

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    fetchDetections();
  }, [filters]);

  /**
   * Загрузка детекций с сервера с учетом текущих фильтров
   */
  const fetchDetections = async () => {
    setLoading(true);
    setError(null);
    try {
      // Формируем параметры запроса
      const params = {
        start_date: filters.dateRange.start || undefined,
        end_date: filters.dateRange.end || undefined,
        min_objects: filters.objectCount.min || undefined,
        max_objects: filters.objectCount.max || undefined,
        detection_id: filters.detectionId || undefined,
      };

      // Добавляем фильтры для классов
      AVAILABLE_CLASSES.forEach(cls => {
        const serverName = CLASS_TO_API_KEY[cls];
        if (filters.classFilters[cls].enabled) {
          const minVal = filters.classFilters[cls].min === '' ? '0' : filters.classFilters[cls].min;
          const maxVal = filters.classFilters[cls].max === '' ? '1000' : filters.classFilters[cls].max;
          params[`min_${serverName}`] = minVal;
          params[`max_${serverName}`] = maxVal;
        } else {
          params[`min_${serverName}`] = '0';
          params[`max_${serverName}`] = '0';
        }
      });

      // Удаляем undefined параметры
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const res = await axios.get('http://localhost:8000/detections', { params });
      setDetections(res.data.detections || []);
      setCurrentPage(1); // Сбрасываем страницу при загрузке новых данных
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('Ошибка при загрузке данных:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Переключение фильтра класса
   */
  const toggleClassFilter = (cls) => {
    setDraftFilters(prev => ({
      ...prev,
      classFilters: {
        ...prev.classFilters,
        [cls]: {
          ...prev.classFilters[cls],
          enabled: !prev.classFilters[cls].enabled
        }
      }
    }));
  };

  /**
   * Изменение диапазона значений для фильтра класса
   */
  const handleClassRangeChange = (cls, field, value) => {
    setDraftFilters(prev => ({
      ...prev,
      classFilters: {
        ...prev.classFilters,
        [cls]: {
          ...prev.classFilters[cls],
          [field]: value
        }
      }
    }));
  };

  /**
   * Обработчик изменения фильтров
   */
  const handleFilterChange = (filterType, field, value) => {
    setDraftFilters(prev => ({
      ...prev,
      [filterType]: {
        ...prev[filterType],
        [field]: value
      }
    }));
  };

  /**
   * Сброс всех фильтров
   */
  const resetFilters = () => {
    const initialFilters = {
      dateRange: { start: '', end: '' },
      objectCount: { min: '', max: '' },
      classFilters: AVAILABLE_CLASSES.reduce((acc, cls) => {
        acc[cls] = {
          enabled: true,
          min: '',
          max: ''
        };
        return acc;
      }, {})
    };
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  /**
   * Применение фильтров
   */
  const applyFilters = () => {
    setFilters(draftFilters);
  };

  /**
   * Подсчет количества объектов по классам
   */
  const countByClass = classes => classes.reduce((acc, cls) => {
    acc[cls] = (acc[cls] || 0) + 1;
    return acc;
  }, {});

  /**
   * Рендер бейджей классов
   */
  const renderBadges = classes => Object.entries(countByClass(classes)).map(([cls, count]) => (
    <span key={cls} className="inline-block px-2 py-1 mr-1 mb-1 rounded text-xs"
      style={{
        backgroundColor: `${classColors[cls] || '#999999'}80`,
        border: `1px solid ${classColors[cls] || '#999999'}`,
      }}>
      {cls}: {count}
    </span>
  ));

  // Пагинация
  const totalPages = Math.ceil(detections.length / PAGE_SIZE);
  const currentData = detections.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Управление модальным окном
  const openModal = url => setModalImage(url);
  const closeModal = () => setModalImage(null);

  /**
   * Скачивание изображения
   */
  const handleDownload = async url => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = url.split('/').pop() || 'download.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Ошибка при скачивании:', error);
      alert('Не удалось скачать изображение');
    }
  };

  /**
   * Генерация элементов пагинации
   */
  const getPaginationItems = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, 'ellipsis-right', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, 'ellipsis-left', ...Array.from({length: 5}, (_, i) => totalPages - 4 + i));
      } else {
        pages.push(1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen p-6 bg-[#1F2833]">
      {/* Заголовок и кнопка фильтров */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#66FCF1]">История распознаваний</h1>
        <button onClick={() => setShowFilters(!showFilters)} 
          className="flex items-center gap-2 px-4 py-2 bg-[#45A29E] hover:bg-[#66FCF1] text-[#1F2833] rounded">
          <FunnelIcon className="w-5 h-5" />
          {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
        </button>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="mb-6 p-6 bg-[#2B3A4A] rounded-lg shadow-xl border border-[#45A29E]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#66FCF1]">Фильтры распознаваний</h2>
            <div className="flex gap-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#3D4F5D] hover:bg-[#4A5D6C] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <XMarkIcon className="w-5 h-5" />
                Сбросить
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-[#45A29E] hover:bg-[#66FCF1] text-[#1F2833] font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <CheckIcon className="w-5 h-5" />
                Применить
              </button>
            </div>
          </div>

          {/* Основные фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Фильтр по ID детекции */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#C5C6C7]">№ Распознавания</label>
              <div className="relative">
                <input
                  type="number"
                  value={draftFilters.detectionId}
                  onChange={(e) => setDraftFilters(prev => ({ ...prev, detectionId: e.target.value }))}
                  placeholder="Введите ID"
                  className="w-full p-3 bg-[#1F2833] border border-[#45A29E] rounded-lg text-[#C5C6C7] focus:ring-2 focus:ring-[#66FCF1] focus:border-transparent"
                />
              </div>
            </div>

            {/* Фильтр по дате */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#C5C6C7]">Диапазон времени распознавания</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={draftFilters.dateRange.start}
                    onChange={e => handleFilterChange('dateRange', 'start', e.target.value)}
                    className="w-full p-3 bg-[#1F2833] border border-[#45A29E] rounded-lg text-[#C5C6C7] focus:ring-2 focus:ring-[#66FCF1] focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={draftFilters.dateRange.end}
                    onChange={e => handleFilterChange('dateRange', 'end', e.target.value)}
                    className="w-full p-3 bg-[#1F2833] border border-[#45A29E] rounded-lg text-[#C5C6C7] focus:ring-2 focus:ring-[#66FCF1] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Фильтр по количеству объектов */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#C5C6C7]">Количество обнаруженных объектов</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Минимум"
                    min="0"
                    value={draftFilters.objectCount.min}
                    onChange={e => handleFilterChange('objectCount', 'min', e.target.value)}
                    className="w-full p-3 bg-[#1F2833] border border-[#45A29E] rounded-lg text-[#C5C6C7] focus:ring-2 focus:ring-[#66FCF1] focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Максимум"
                    min="0"
                    value={draftFilters.objectCount.max}
                    onChange={e => handleFilterChange('objectCount', 'max', e.target.value)}
                    className="w-full p-3 bg-[#1F2833] border border-[#45A29E] rounded-lg text-[#C5C6C7] focus:ring-2 focus:ring-[#66FCF1] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Фильтры по классам */}
          <div className="border-t border-[#45A29E] pt-6">
            <h3 className="text-lg font-semibold text-[#66FCF1] mb-4">Фильтрация по классам объектов и их количеству</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {AVAILABLE_CLASSES.map(cls => {
                const isEnabled = draftFilters.classFilters[cls].enabled;
                const color = classColors[cls] || '#999999';
                
                return (
                  <div 
                    key={cls} 
                    className={`p-4 rounded-lg transition-all ${isEnabled ? 'bg-[#C5C6C7] border-2' : 'bg-[#1F2833]/50 border border-dashed'} border-[${color}]`}
                    style={{ borderColor: color }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {/* Кнопка включения/выключения фильтра класса */}
                        <button
                          onClick={() => toggleClassFilter(cls)}
                          className={`w-6 h-6 mr-3 flex items-center justify-center rounded border-2 transition-colors cursor-pointer ${
                            isEnabled ? 'bg-[#1F2833] border-[#1F2833]' : 'border-gray-400'
                          }`}
                          onMouseEnter={(e) => {
                            if (isEnabled) {
                              e.currentTarget.querySelector('svg').style.color = color;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isEnabled) {
                              e.currentTarget.querySelector('svg').style.color = 'white';
                            }
                          }}
                        >
                          {isEnabled && (
                            <CheckIcon className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <span 
                          className="text-sm font-medium capitalize"
                          style={{ color: isEnabled ? '#1F2833' : '#C5C6C7' }}
                        >
                          {cls}
                        </span>
                      </div>
                    </div>
                    
                    {/* Поля для ввода диапазона значений (если класс включен) */}
                    {isEnabled && (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Минимум"
                            min="0"
                            value={draftFilters.classFilters[cls].min}
                            onChange={e => handleClassRangeChange(cls, 'min', e.target.value)}
                            className="w-full p-2 bg-[#2B3A4A] border border-[#45A29E] rounded text-[#C5C6C7] text-sm focus:ring-1 focus:ring-[#66FCF1] focus:border-transparent"
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Максимум"
                            min="0"
                            value={draftFilters.classFilters[cls].max}
                            onChange={e => handleClassRangeChange(cls, 'max', e.target.value)}
                            className="w-full p-2 bg-[#2B3A4A] border border-[#45A29E] rounded text-[#C5C6C7] text-sm focus:ring-1 focus:ring-[#66FCF1] focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Таблица с результатами */}
      {loading ? (
        <p className="text-[#66FCF1]">Загрузка...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg bg-[#C5C6C7] shadow">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="text-[#1F2833]">
                  <th className="border px-4 py-2 w-20 text-center">№ Распознавания</th>
                  <th className="border px-4 py-2 w-40 text-center">Время распознавания</th>
                  <th className="border px-4 py-2 w-32 text-center">Количество обнаруженных объектов</th>
                  <th className="border px-4 py-2 text-center">Количество объектов по классам</th>
                  <th className="border px-4 py-2 w-32 text-center">Исходное изображение</th>
                  <th className="border px-4 py-2 w-32 text-center">Результат распознавания</th>
                  <th className="border px-4 py-2 w-16 text-center" title="Настройки">
                    <Cog6ToothIcon className="w-6 h-6 inline-block" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map(item => (
                    <tr key={item.id} className="hover:bg-[#66FCF130]">
                      <td className="border px-4 py-2 text-center">{item.id}</td>
                      <td className="border px-4 py-2 text-center whitespace-nowrap">
                        {new Date(item.detection_time).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2 text-center">{item.object_count}</td>
                      <td className="border px-4 py-2">{renderBadges(item.object_classes)}</td>
                      <td className="border px-4 py-2 text-center">
                        <button 
                          onClick={() => openModal(`http://localhost:9000/detections/${item.input_image_key}`)}
                          className="underline text-blue-600 hover:text-[#66FCF1]"
                        >
                          Открыть
                        </button>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button 
                          onClick={() => openModal(`http://localhost:9000/detections/${item.output_image_key}`)}
                          className="underline text-blue-600 hover:text-[#66FCF1]"
                        >
                          Открыть
                        </button>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <SettingsButton settingsClasses={item.settings_classes || []} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center p-4 text-gray-600">
                      Нет записей, соответствующих фильтрам
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          <div className="mt-4 flex justify-center items-center gap-2 text-[#66FCF1] select-none">
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-[#1F2833] disabled:opacity-50 hover:bg-[#45A29E]"
            >
              Назад
            </button>

            {getPaginationItems().map((page, idx) => (
              page === 'ellipsis-left' || page === 'ellipsis-right' ? (
                <span key={`${page}-${idx}`} className="px-2 py-1">...</span>
              ) : (
                <button 
                  key={page} 
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${
                    page === currentPage 
                      ? 'bg-[#45A29E] font-bold' 
                      : 'bg-[#1F2833] hover:bg-[#45A29E]'
                  }`}
                >
                  {page}
                </button>
              )
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-[#1F2833] disabled:opacity-50 hover:bg-[#45A29E]"
            >
              Вперед
            </button>
          </div>
        </>
      )}

      {/* Модальное окно для просмотра изображения */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={closeModal}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-2 right-2 flex space-x-2">
              <button 
                onClick={() => handleDownload(modalImage)} 
                title="Скачать"
                className="p-1 rounded bg-black/60 text-white hover:text-[#66FCF1]"
              >
                <ArrowDownTrayIcon className="w-6 h-6" />
              </button>
              <button 
                onClick={closeModal} 
                title="Закрыть"
                className="p-1 rounded bg-black/60 text-white hover:text-[#66FCF1]"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <img 
              src={modalImage} 
              alt="Просмотр изображения" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded" 
            />
          </div>
        </div>
      )}
    </div>
  );
}