<template>
  <div class="image-editor">
    <canvas
      ref="canvas"
      width="800"
      height="600"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      class="bg-[#808080]"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';

interface Point {
  x: number;
  y: number;
}

interface TransformationState {
  vertices: Point[];
  isActive: boolean;
  actionType: 'nothing' | 'drag' | 'scale' | 'rotate';
  dragStart: Point;
  initialVertices: Point[];
  rotateStartAngle: number;
  scaleStartDistance: number;
}

const ROTATE_BUTTON_INDENT = 40; // отступ снизу кнопки вращения

const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const image = new Image();
const isImageLoaded = ref<boolean>(false);

const state = reactive<TransformationState>({
  vertices: [
    { x: 200, y: 150 },
    { x: 400, y: 150 },
    { x: 400, y: 350 },
    { x: 200, y: 350 }
  ],
  isActive: false,
  actionType: 'nothing',
  dragStart: { x: 0, y: 0 },
  initialVertices: [],
  rotateStartAngle: 0,
  scaleStartDistance: 0
});

const computeBoxCenter = (vertices: Point[]): Point => {
  const avgX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const avgY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;

  return { x: avgX, y: avgY };
};

const applyTransformVector = (point: Point, vector: Point): Point => {
  return { x: point.x + vector.x, y: point.y + vector.y };
};

const applyScaleTransform = (point: Point, center: Point, scale: number): Point => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale
  };
};

const applyRotationTransform = (point: Point, center: Point, angle: number): Point => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: center.y + dx * Math.sin(angle) + dy * Math.cos(angle)
  };
};

const calculateAngleFromCenter = (point: Point, center: Point): number => {
  return Math.atan2(point.y - center.y, point.x - center.x);
};

const calculateDistanceFromCenter = (point: Point, center: Point): number => {
  return Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2));
};

const renderScene = () => {
  if (!ctx.value || !canvas.value) return;

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

  if (isImageLoaded.value && image.value) {
    const center = computeBoxCenter(state.vertices);

    ctx.value.save();
    ctx.value.translate(center.x, center.y);

    const dx = state.vertices[1].x - state.vertices[0].x;
    const dy = state.vertices[1].y - state.vertices[0].y;
    const rotationAngle = Math.atan2(dy, dx);
    ctx.value.rotate(rotationAngle);

    const width = Math.sqrt(
      Math.pow(state.vertices[1].x - state.vertices[0].x, 2) + Math.pow(state.vertices[1].y - state.vertices[0].y, 2)
    );
    const height = Math.sqrt(
      Math.pow(state.vertices[3].x - state.vertices[0].x, 2) + Math.pow(state.vertices[3].y - state.vertices[0].y, 2)
    );

    ctx.value.drawImage(
      image.value,
      -width / 2, -height / 2,
      width, height
    );

    ctx.value.restore();
  }

  if (state.isActive) {
    const strokeColor = '#2c3e50';

    ctx.value.strokeStyle = strokeColor;
    ctx.value.setLineDash([5, 5]);
    ctx.value.lineWidth = 2;
    ctx.value.beginPath();
    ctx.value.moveTo(state.vertices[0].x, state.vertices[0].y);
    state.vertices.forEach(v => ctx.value?.lineTo(v.x, v.y));
    ctx.value.closePath();
    ctx.value.stroke();
    ctx.value.setLineDash([]);

    // Угловые точки
    state.vertices.forEach(vertex => {
      ctx.value.fillStyle = '#fff';
      ctx.value.strokeStyle = strokeColor;
      ctx.value.lineWidth = 2;
      ctx.value.beginPath();
      ctx.value.arc(vertex.x, vertex.y, 8, 0, Math.PI * 2);
      ctx.value.fill();
      ctx.value.stroke();
    });

    // Кнопка вращения
    const center = computeBoxCenter(state.vertices);
    const rotateHandle = {
      x: center.x,
      y: center.y + Math.sqrt(
        Math.pow(state.vertices[3].x - state.vertices[0].x, 2) + Math.pow(state.vertices[3].y - state.vertices[0].y, 2)
      ) / 2 + ROTATE_BUTTON_INDENT
    };

    ctx.value.fillStyle = strokeColor;
    ctx.value.strokeStyle = '#e2e2e2';
    ctx.value.lineWidth = 2;
    ctx.value.beginPath();
    ctx.value.arc(rotateHandle.x, rotateHandle.y, 12, 0, Math.PI * 2);
    ctx.value.fill();
    ctx.value.stroke();

    ctx.value.strokeStyle = strokeColor;
    ctx.value.setLineDash([3, 3]);
    ctx.value.beginPath();
    ctx.value.moveTo(center.x, center.y);
    ctx.value.lineTo(rotateHandle.x, rotateHandle.y);
    ctx.value.stroke();
    ctx.value.setLineDash([]);
  }
};

const getCanvasMousePosition = (event: MouseEvent): Point => {
  if (!canvas.value) {
    return { x: 0, y: 0 };
  }

  const rect = canvas.value.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
};

const handleMouseDown = (event: MouseEvent) => {
  const mousePos = getCanvasMousePosition(event);
  const center = computeBoxCenter(state.vertices);
  const rotateHandle = {
    x: center.x,
    y: center.y + Math.sqrt(
      Math.pow(state.vertices[3].x - state.vertices[0].x, 2) + Math.pow(state.vertices[3].y - state.vertices[0].y, 2)
    ) / 2 + ROTATE_BUTTON_INDENT
  };

  console.log(rotateHandle)

  if (Math.sqrt(
    Math.pow(mousePos.x - rotateHandle.x, 2) + Math.pow(mousePos.y - rotateHandle.y, 2)
  ) <= 15) { // "хитбокс" кнопки вращения = 15
    state.actionType = 'rotate';
    state.rotateStartAngle = calculateAngleFromCenter(mousePos, center);
    state.initialVertices = [...state.vertices];
    return;
  }

  for (let i = 0; i < state.vertices.length; i++) {
    const vertex = state.vertices[i];
    if (Math.sqrt(Math.pow(mousePos.x - vertex.x, 2) + Math.pow(mousePos.y - vertex.y, 2)) <= 6) {
      state.actionType = 'scale';
      state.scaleStartDistance = calculateDistanceFromCenter(vertex, center);
      state.initialVertices = [...state.vertices];
      return;
    }
  }

  const x = mousePos.x, y = mousePos.y;
  let isInside = false;

  for (let i = 0, j = 3; i < 4; j = i++) {
    const x1 = state.vertices[i].x;
    const y1 = state.vertices[i].y;
    const x2 = state.vertices[j].x;
    const y2 = state.vertices[j].y

    const intersect = ((y1 > y) !== (y2 > y)) && (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1);
    if (intersect) {
      isInside = !isInside;
    }
  }

  if (isInside) {
    state.isActive = true;
    state.actionType = 'drag';
    state.dragStart = mousePos;
    state.initialVertices = [...state.vertices];
  } else {
    state.isActive = false;
  }
};

const handleMouseUp = () => {
  state.actionType = 'nothing';
};

const handleMouseMove = (event: MouseEvent) => {
  const mousePos = getCanvasMousePosition(event);
  const center = computeBoxCenter(state.vertices);

  switch (state.actionType) {
    case 'nothing': return;

    case 'drag':
      const moveVector = {
        x: mousePos.x - state.dragStart.x,
        y: mousePos.y - state.dragStart.y
      };
      state.vertices = state.initialVertices.map(v =>
        applyTransformVector(v, moveVector)
      );
      break;

    case 'scale':
      const currentDistance = calculateDistanceFromCenter(mousePos, center);
      const scaleFactor = currentDistance / state.scaleStartDistance;

      state.vertices = state.initialVertices.map(v =>
        applyScaleTransform(v, center, scaleFactor)
      );
      break;

    case 'rotate':
      const currentAngle = calculateAngleFromCenter(mousePos, center);
      const rotationDelta = currentAngle - state.rotateStartAngle;

      state.vertices = state.initialVertices.map(v =>
        applyRotationTransform(v, center, rotationDelta)
      );
      break;
  }

  renderScene();
};

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d');

    image.value = new Image();
    image.value.onload = () => {
      isImageLoaded.value = true;
      renderScene();
    };
    image.value.src = 'http://i.pinimg.com/736x/e2/69/da/e269da2a37e97a289c694644a3e18ab3.jpg';
  }
});
</script>
