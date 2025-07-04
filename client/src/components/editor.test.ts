import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Editor from './Editor.vue';

describe('Editor', () => {
  let wrapper: ReturnType<typeof mount>;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    wrapper = mount(Editor);

    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d');
  })

  it('Canvas присутствует', () => {
    const wrapper = mount(Editor);
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  describe('Математические методы', () => {
    it('Получаем центр изображения', () => {
      const vertices = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      const center = wrapper.vm.computeBoxCenter(vertices);

      expect(center).toEqual({ x: 50, y: 50 });
    });

    it('Проверяем расчеты расстояния от центра', () => {
      const center = { x: 0, y: 0 };
      const point = { x: 3, y: 4 };
      const distance = wrapper.vm.calculateDistanceFromCenter(point, center);

      expect(distance).toBe(5);
    });

    it('Проверяем вращение', () => {
      const point = { x: 10, y: 0 };
      const center = { x: 0, y: 0 };
      const rotated = wrapper.vm.applyRotationTransform(point, center, Math.PI / 2);

      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.y).toBeCloseTo(10);
    });
  })

  describe('Отрисовка', () => {
    it('Изображение загрузилось и отрисовалось', async () => {
      wrapper.vm.isImageLoaded = true;
      wrapper.vm.image = {
        width: 100,
        height: 100,
        onload: null,
        src: 'http://i.pinimg.com/736x/e2/69/da/e269da2a37e97a289c694644a3e18ab3.jpg'
      } as unknown as HTMLImageElement;

      wrapper.vm.renderScene();

      expect(wrapper.vm.ctx.drawImage).toHaveBeenCalled();
    });

    it('Точки изменения размера и вращения отрисованы', () => {
      wrapper.vm.state.isActive = true;
      wrapper.vm.renderScene();

      expect(wrapper.vm.ctx.arc).toHaveBeenCalled();
    });
  })
})
