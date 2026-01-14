'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';

interface SpotlightTourProps {
  isActive: boolean;
  targetSelector: string; // CSS селектор для элемента
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'left-bottom';
  onComplete: () => void;
  onSkip: () => void;
  onClose?: () => void; // Закрыть весь тур
  waitForClick?: boolean; // Ждать клика на элемент
}

export function SpotlightTour({
  isActive,
  targetSelector,
  title,
  description,
  position = 'top',
  onComplete,
  onSkip,
  onClose,
  waitForClick = true
}: SpotlightTourProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  const [elementBorderRadius, setElementBorderRadius] = useState<string>('0.375rem'); // rounded-md по умолчанию
  const [dialogPosition, setDialogPosition] = useState({ top: 0, left: 0, transformX: '-50%', transformY: '-50%' });
  const overlayRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Ищем элемент через селектор
    const findElement = () => {
      try {
        // Специальная обработка для селектора с :has()
        if (targetSelector.includes(':has')) {
          // Универсальная обработка :has-text('<TEXT>') c необязательным тегом перед ним (например, button:has-text('Filters'))
          if (targetSelector.includes(':has-text')) {
            const textMatch = targetSelector.match(/:has-text\(['"](.+?)['"]\)/);
            const wantedText = textMatch?.[1];
            if (wantedText) {
              // Определяем тег до :has-text(..), если указан, иначе ищем по нескольким интерактивным элементам
              const before = targetSelector.split(':has-text')[0].trim();
              let candidates: NodeListOf<Element> | Element[] = [] as any;
              if (before) {
                candidates = document.querySelectorAll(before);
              } else {
                // Ищем среди кнопок, ссылок и элементов с ролью button
                const buttons = Array.from(document.querySelectorAll('button'));
                const links = Array.from(document.querySelectorAll('a'));
                const roleButtons = Array.from(document.querySelectorAll('[role="button"]'));
                candidates = [...buttons, ...links, ...roleButtons];
              }
              for (const el of candidates) {
                if (el.textContent && el.textContent.trim().includes(wantedText)) {
                  setTargetElement(el as HTMLElement);
                  updateElementPosition(el as HTMLElement);
                  return;
                }
              }
            }
          }
          // Ищем кнопку с иконкой settings
          if (targetSelector.includes('.tabler-icon-settings')) {
            const buttons = document.querySelectorAll("button[data-slot='button']");
            for (const button of buttons) {
              const icon = button.querySelector('.tabler-icon-settings');
              if (icon) {
                setTargetElement(button as HTMLElement);
                updateElementPosition(button as HTMLElement);
                return;
              }
            }
          }
          // Ищем кнопку с иконкой filter
          if (targetSelector.includes('.tabler-icon-filter')) {
            const icons = document.querySelectorAll('.tabler-icon-filter');
            for (const icon of Array.from(icons)) {
              const wrapper = (icon as HTMLElement).closest('button, [role="button"], a');
              if (wrapper) {
                setTargetElement(wrapper as HTMLElement);
                updateElementPosition(wrapper as HTMLElement);
                return;
              }
            }
          }
          // Специальные кейсы (оставляем на случай, если нет общего совпадения выше)
          if (targetSelector.includes(':has-text') && (targetSelector.includes('Newly Added') || targetSelector.includes('Недавно добавленные'))) {
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
              if (button.textContent && (button.textContent.includes('Newly Added') || button.textContent.includes('Недавно добавленные'))) {
                setTargetElement(button as HTMLElement);
                updateElementPosition(button as HTMLElement);
                return;
              }
            }
          }
          if (targetSelector.includes(':has-text') && targetSelector.includes('Investors')) {
            const links = document.querySelectorAll('a[href="/app/investors"]');
            if (links.length > 0) {
              setTargetElement(links[0] as HTMLElement);
              updateElementPosition(links[0] as HTMLElement);
              return;
            }
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
              if (button.textContent && button.textContent.includes('Investors')) {
                setTargetElement(button as HTMLElement);
                updateElementPosition(button as HTMLElement);
                return;
              }
            }
          }
        } else {
          const element = document.querySelector(targetSelector) as HTMLElement;
          if (element) {
            setTargetElement(element);
            updateElementPosition(element);
          }
        }
      } catch (error) {
        console.error('Error finding target element:', error);
      }
    };

    // Поиск элемента с интервалом
    findElement();
    intervalRef.current = setInterval(findElement, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, targetSelector]);

  // Добавляем обработчик клика только если waitForClick=true
  useEffect(() => {
    if (!isActive || !targetElement || !waitForClick) {
      // Даже без ожидания клика, поднимаем элемент выше overlay
      if (targetElement) {
        const originalZIndex = targetElement.style.zIndex;
        const originalPosition = targetElement.style.position;
        
        targetElement.style.zIndex = '9999';
        targetElement.style.position = 'relative';

        return () => {
          targetElement.style.zIndex = originalZIndex;
          if (!originalPosition) {
            targetElement.style.position = '';
          } else {
            targetElement.style.position = originalPosition;
          }
        };
      }
      return;
    }

    // Поднимаем элемент выше overlay
    const originalZIndex = targetElement.style.zIndex;
    const originalPosition = targetElement.style.position;
    
    targetElement.style.zIndex = '9999';
    targetElement.style.position = 'relative';

    const handleClick = (e: Event) => {
      console.log('Spotlight: Button clicked!');
      e.preventDefault();
      e.stopPropagation();
      onComplete();
    };

    targetElement.addEventListener('click', handleClick, true);
    
    return () => {
      targetElement.removeEventListener('click', handleClick, true);
      targetElement.style.zIndex = originalZIndex;
      if (!originalPosition) {
        targetElement.style.position = '';
      } else {
        targetElement.style.position = originalPosition;
      }
    };
  }, [targetElement, waitForClick, onComplete, isActive]);

  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        updateElementPosition(targetElement);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [targetElement]);

  const updateElementPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setElementRect(rect);
    
    // Получаем borderRadius элемента
    const computedStyle = window.getComputedStyle(element);
    const borderRadius = computedStyle.borderRadius;
    setElementBorderRadius(borderRadius);

    // Вычисляем позицию диалога относительно элемента
    let top = 0;
    let left = 0;
    let transformX = '-50%';
    let transformY = '-50%';

    switch (position) {
      case 'top':
        // Сверху от элемента
        top = rect.top - 10;
        left = rect.left + rect.width / 2;
        transformX = '-50%';
        transformY = '-100%';
        break;
      case 'bottom':
        // Снизу от элемента
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2;
        transformX = '-50%';
        transformY = '0';
        break;
      case 'left':
        // Слева от элемента
        top = rect.top; // Выравниваем по верхнему краю
        left = rect.left - 10;
        transformX = '-100%';
        transformY = '0';
        break;
      case 'left-bottom':
        // Слева от элемента, выравнивание по нижней границе
        top = rect.bottom; // нижняя грань элемента
        left = rect.left - 10;
        transformX = '-100%';
        transformY = '-100%';
        break;
      case 'right':
        // Справа от элемента
        top = rect.top; // Выравниваем по верхнему краю
        left = rect.right + 10;
        transformX = '0';
        transformY = '0';
        break;
    }

    setDialogPosition({ top, left, transformX, transformY });
  };

  if (!isActive || !targetElement || !elementRect) return null;

  return (
    <>
      {/* Overlay с "дыркой" - 4 части для визуального эффекта */}
      {/* Верхняя часть */}
      <div
        className="fixed z-30 bg-black/60"
        style={{
          top: 0,
          left: 0,
          right: 0,
          height: `${elementRect.top}px`,
          pointerEvents: 'auto'
        }}
      />
      {/* Нижняя часть */}
      <div
        className="fixed z-30 bg-black/60"
        style={{
          top: `${elementRect.bottom}px`,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'auto'
        }}
      />
      {/* Левая часть */}
      <div
        className="fixed z-30 bg-black/60"
        style={{
          top: `${elementRect.top}px`,
          left: 0,
          width: `${elementRect.left}px`,
          height: `${elementRect.height}px`,
          pointerEvents: 'auto'
        }}
      />
      {/* Правая часть */}
      <div
        className="fixed z-30 bg-black/60"
        style={{
          top: `${elementRect.top}px`,
          left: `${elementRect.right}px`,
          right: 0,
          height: `${elementRect.height}px`,
          pointerEvents: 'auto'
        }}
      />

      {/* Подсветка элемента */}
      <div
        className="fixed z-50 pointer-events-none border-2 border-border"
        style={{
          top: `${elementRect.top - 4}px`,
          left: `${elementRect.left - 4}px`,
          width: `${elementRect.width + 8}px`,
          height: `${elementRect.height + 8}px`,
          borderRadius: elementBorderRadius,
          boxShadow: '0 0 0 4px hsl(var(--foreground) / 0.05)',
        }}
      />

      {/* Подсказка - простая карточка без Dialog */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          top: `${dialogPosition.top}px`,
          left: `${dialogPosition.left}px`,
          transform: `translate(${dialogPosition.transformX}, ${dialogPosition.transformY})`
        }}
      >
        <div className="max-w-[380px] w-[380px] bg-popover border border-border rounded-lg shadow-xl p-4 pointer-events-auto">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              </div>
              {onClose && (
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-xs h-6 w-6 p-0 shrink-0"
                  size="sm"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={onComplete}
                className="text-xs h-7 px-3"
                size="sm"
              >
                Skip
              </Button>
              <Button
                onClick={onComplete}
                className="text-xs h-7 px-3"
                size="sm"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
}

