import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Отримуємо шлях до main.js
const mainJsPath = path.resolve(__dirname, '../main.js');
const carouselCode = fs.readFileSync(mainJsPath, 'utf-8');

// Налаштування DOM перед тестами
function setupDOM() {
  document.body.innerHTML = `
    <div id="carousel">
      <div class="slide active"></div>
      <div class="slide"></div>
      <div class="slide"></div>
      <div id="indicators-container">
        <div class="indicator active" data-slide-to="0"></div>
        <div class="indicator" data-slide-to="1"></div>
        <div class="indicator" data-slide-to="2"></div>
      </div>
      <div id="controls-container">
        <button id="pause-btn"><i class="far fa-pause-circle"></i></button>
        <button id="prev-btn"></button>
        <button id="next-btn"></button>
      </div>
    </div>
  `;
}

describe('Carousel Functionality', () => {
  let container, slides, indicators, pauseBtn, prevBtn, nextBtn;

  beforeEach(() => {
    // Налаштовуємо DOM
    setupDOM();

    // Використовуємо фіктивні таймери
    vi.useFakeTimers();

    // Мокуємо setInterval і clearInterval як шпигуни
    vi.spyOn(window, 'setInterval');
    vi.spyOn(window, 'clearInterval');

    // Виконуємо код із main.js
    eval(carouselCode);

    // Отримуємо елементи
    container = document.querySelector('#carousel');
    slides = container.querySelectorAll('.slide');
    indicators = container.querySelectorAll('.indicator');
    pauseBtn = document.querySelector('#pause-btn');
    prevBtn = document.querySelector('#prev-btn');
    nextBtn = document.querySelector('#next-btn');
  });

  afterEach(() => {
    vi.clearAllTimers(); // Очищаємо всі таймери
    vi.useRealTimers();  // Повертаємо реальні таймери
    vi.restoreAllMocks(); // Відновлюємо всі моковані функції
    document.body.innerHTML = '';
  });

  test('Ініціалізація: перший слайд активний', () => {
    expect(slides[0].classList.contains('active')).toBe(true);
    expect(indicators[0].classList.contains('active')).toBe(true);
    expect(window.setInterval).toHaveBeenCalled();
  });

  test('Перехід до наступного слайда кнопкою', () => {
    nextBtn.click();
    expect(slides[0].classList.contains('active')).toBe(false);
    expect(slides[1].classList.contains('active')).toBe(true);
    expect(indicators[1].classList.contains('active')).toBe(true);
    expect(window.clearInterval).toHaveBeenCalled();
  });

  test('Перехід до попереднього слайда кнопкою', () => {
    prevBtn.click();
    expect(slides[0].classList.contains('active')).toBe(false);
    expect(slides[2].classList.contains('active')).toBe(true);
    expect(indicators[2].classList.contains('active')).toBe(true);
  });

  test('Пауза та відтворення', () => {
    pauseBtn.click();
    expect(pauseBtn.innerHTML).toContain('play-circle');
    expect(window.clearInterval).toHaveBeenCalled();

    pauseBtn.click();
    expect(pauseBtn.innerHTML).toContain('pause-circle');
    expect(window.setInterval).toHaveBeenCalledTimes(2);
  });

  test('Перехід через індикатори', () => {
    indicators[1].click();
    expect(slides[1].classList.contains('active')).toBe(true);
    expect(indicators[1].classList.contains('active')).toBe(true);
  });

  test('Керування клавіатурою', () => {
    // Перевірка стрілки вправо
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }));
    expect(slides[1].classList.contains('active')).toBe(true);

    // Повернення до початкового слайда
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }));
    expect(slides[0].classList.contains('active')).toBe(true);

    // Перевіряємо, що preventDefault викликається при натисканні пробілу
    const spaceEvent = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
    const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault');
    document.dispatchEvent(spaceEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
    
    // Перевіряємо, що clearInterval викликається при натисканні пробілу
    expect(window.clearInterval).toHaveBeenCalled();
  });

  test('Свайп', () => {
    container.dispatchEvent(new MouseEvent('mousedown', { clientX: 300 }));
    container.dispatchEvent(new MouseEvent('mouseup', { clientX: 450 }));
    expect(slides[2].classList.contains('active')).toBe(true);

    container.dispatchEvent(new MouseEvent('mousedown', { clientX: 300 }));
    container.dispatchEvent(new MouseEvent('mouseup', { clientX: 150 }));
    expect(slides[0].classList.contains('active')).toBe(true);
  });

  test('Автоматичне перемикання', () => {
    vi.advanceTimersByTime(2000);
    expect(slides[1].classList.contains('active')).toBe(true);
  });
});
