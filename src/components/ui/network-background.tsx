'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export function NetworkBackground({ nodeCount = 50, clusterCount = 5 }) {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);
  const animationRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const mousePositionRef = useRef({ x: null, y: null });
  const [canvasOpacity, setCanvasOpacity] = useState(0);

  // Инициализация и запуск анимации
  useEffect(() => {
    // Выходим, если канвас не готов
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Устанавливаем размеры канваса
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();

    // Обработчик движения мыши
    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    // Добавляем слушатели событий
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateCanvasSize);

    // Создаем узлы
    const createNodes = () => {
      // Случайное количество кластеров от 3 до 8
      const actualClusterCount = Math.floor(Math.random() * 6) + 3;

      // Создаем центры кластеров с разными размерами
      const clusterCenters = [];

      for (let i = 0; i < actualClusterCount; i++) {
        clusterCenters.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 70 + 50, // Увеличенный радиус кластера от 50 до 120
          size: Math.floor(Math.random() * 15) + 5 // Размер кластера от 5 до 20 узлов
        });
      }

      // Распределяем узлы по кластерам
      const nodes = [];
      let remainingNodes = nodeCount;

      // Сначала гарантируем минимальный размер для каждого кластера
      for (let i = 0; i < clusterCenters.length && remainingNodes > 0; i++) {
        const clusterSize = Math.min(clusterCenters[i].size, remainingNodes);

        for (let j = 0; j < clusterSize; j++) {
          // Создаем узел внутри кластера (с некоторым разбросом)
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * clusterCenters[i].radius;

          nodes.push({
            x: clusterCenters[i].x + Math.cos(angle) * distance,
            y: clusterCenters[i].y + Math.sin(angle) * distance,
            vx: 0,
            vy: 0,
            radius: Math.random() * 1.5 + 1, // Уменьшенный размер узлов от 1 до 2.5
            mass: Math.random() * 0.5 + 0.5,
            clusterId: i // Сохраняем ID кластера
          });

          remainingNodes--;
        }
      }

      // Если остались нераспределенные узлы, добавляем их в случайные кластеры
      while (remainingNodes > 0) {
        const clusterId = Math.floor(Math.random() * clusterCenters.length);
        const cluster = clusterCenters[clusterId];

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * cluster.radius;

        nodes.push({
          x: cluster.x + Math.cos(angle) * distance,
          y: cluster.y + Math.sin(angle) * distance,
          vx: 0,
          vy: 0,
          radius: Math.random() * 1.5 + 1, // Уменьшенный размер узлов
          mass: Math.random() * 0.5 + 0.5,
          clusterId: clusterId
        });

        remainingNodes--;
      }

      return nodes;
    };

    // Создаем связи
    const createConnections = (nodes) => {
      const connections = [];
      // Подсчет связей для каждого узла
      const connectionCounts = new Array(nodes.length).fill(0);

      // Создаем словарь узлов по кластерам для более эффективного доступа
      const clusterNodes = {};
      nodes.forEach((node, index) => {
        if (!clusterNodes[node.clusterId]) {
          clusterNodes[node.clusterId] = [];
        }
        clusterNodes[node.clusterId].push(index);
      });

      // Для каждого кластера создаем связи между узлами с вероятностью 60-80%
      Object.keys(clusterNodes).forEach((clusterId) => {
        const clusterNodeIndices = clusterNodes[clusterId];
        const connectionProbability = 0.6 + Math.random() * 0.2; // 60-80% вероятность связи

        for (let i = 0; i < clusterNodeIndices.length; i++) {
          for (let j = i + 1; j < clusterNodeIndices.length; j++) {
            // Создаем связь с определенной вероятностью
            if (Math.random() < connectionProbability) {
              const nodeIndex1 = clusterNodeIndices[i];
              const nodeIndex2 = clusterNodeIndices[j];
              const node1 = nodes[nodeIndex1];
              const node2 = nodes[nodeIndex2];

              const dx = node2.x - node1.x;
              const dy = node2.y - node1.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              connections.push({
                source: nodeIndex1,
                target: nodeIndex2,
                strength: Math.random() * 0.001 + 0.0001, // Еще больше уменьшена сила связи
                distance: distance,
                idealLength: distance * 1.5, // Значительно увеличено идеальное расстояние
                pulse: Math.random() > 0.8
              });

              // Увеличиваем счетчик связей для обоих узлов
              connectionCounts[nodeIndex1]++;
              connectionCounts[nodeIndex2]++;
            }
          }
        }
      });

      // Создаем некоторые межкластерные связи (с меньшей вероятностью)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          // Пропускаем узлы из одного кластера (они уже обработаны)
          if (nodes[i].clusterId === nodes[j].clusterId) continue;

          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Создаем межкластерную связь с вероятностью 5-10% и если расстояние не слишком большое
          if (Math.random() < 0.05 + Math.random() * 0.05 && distance < 300) {
            // Увеличено максимальное расстояние
            connections.push({
              source: i,
              target: j,
              strength: Math.random() * 0.0005 + 0.00005, // Еще больше уменьшена сила связи
              distance: distance,
              idealLength: distance * 1.8, // Значительно увеличено идеальное расстояние
              pulse: Math.random() > 0.8
            });

            // Увеличиваем счетчик связей для обоих узлов
            connectionCounts[i]++;
            connectionCounts[j]++;
          }
        }
      }

      // Обновляем размеры узлов на основе количества связей
      for (let i = 0; i < nodes.length; i++) {
        // Базовый размер + дополнительный размер в зависимости от количества связей
        nodes[i].radius = 1 + Math.min(2, connectionCounts[i] * 0.2); // Уменьшенный размер узлов
      }

      return connections;
    };

    // Создаем начальное состояние
    const nodes = createNodes();
    const connections = createConnections(nodes);

    nodesRef.current = nodes;
    connectionsRef.current = connections;

    // Функция для обновления позиций узлов
    const updateNodes = (deltaTime, intensity = 1) => {
      const nodes = nodesRef.current;
      const connections = connectionsRef.current;
      const mousePosition = mousePositionRef.current;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let fx = 0,
          fy = 0;

        // Отталкивание между узлами
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;

          const otherNode = nodes[j];
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0 && distance < 300) {
            // Увеличено расстояние отталкивания
            const repulsionForce = 80 / (distance * distance); // Значительно увеличена сила отталкивания
            const angle = Math.atan2(dy, dx);

            fx -= Math.cos(angle) * repulsionForce * intensity;
            fy -= Math.sin(angle) * repulsionForce * intensity;
          }
        }

        // Притяжение для связанных узлов
        for (const connection of connections) {
          if (connection.source === i || connection.target === i) {
            const otherNodeIndex =
              connection.source === i ? connection.target : connection.source;
            const otherNode = nodes[otherNodeIndex];

            const dx = otherNode.x - node.x;
            const dy = otherNode.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
              const springForce =
                (distance - connection.idealLength) * connection.strength;
              const angle = Math.atan2(dy, dx);

              fx += Math.cos(angle) * springForce * intensity;
              fy += Math.sin(angle) * springForce * intensity;
            }
          }
        }

        // Отталкивание от курсора мыши
        if (mousePosition.x !== null && mousePosition.y !== null) {
          const dx = mousePosition.x - node.x;
          const dy = mousePosition.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0 && distance < 40) {
            // Увеличено расстояние влияния курсора
            // Более плавное затухание с расстоянием
            const falloff = Math.max(0, 1 - distance / 40);
            const repulsionForce = 30 * falloff; // Увеличена сила отталкивания от курсора
            const angle = Math.atan2(dy, dx);

            fx -= Math.cos(angle) * repulsionForce * intensity;
            fy -= Math.sin(angle) * repulsionForce * intensity;
          }
        }

        // Сила трения и обновление скорости
        const friction = 0.97; // Увеличено трение для более спокойного движения
        node.vx = node.vx * friction + fx / node.mass;
        node.vy = node.vy * friction + fy / node.mass;

        // Дополнительное гашение скорости при высоких значениях
        if (Math.abs(node.vx) > 1.0) node.vx *= 0.85; // Более агрессивное гашение
        if (Math.abs(node.vy) > 1.0) node.vy *= 0.85;

        // Обновление позиции
        node.x += node.vx;
        node.y += node.vy;

        // Проверка границ
        if (node.x < 0) node.x = 0;
        if (node.x > canvas.width) node.x = canvas.width;
        if (node.y < 0) node.y = 0;
        if (node.y > canvas.height) node.y = canvas.height;
      }
    };

    // Функция для отрисовки сети
    const drawNetwork = (opacity = 1) => {
      const isDarkMode = resolvedTheme === 'dark';
      const time = Date.now() * 0.001;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Цвета для узлов и связей с улучшенной видимостью
      const nodeColor = isDarkMode
        ? `rgba(255, 255, 255, ${0.95 * opacity})`
        : `rgba(0, 0, 0, ${0.95 * opacity})`;
      const nodeGlowColor = isDarkMode
        ? `rgba(255, 255, 255, ${0.15 * opacity})`
        : `rgba(0, 0, 0, ${0.15 * opacity})`;

      // Разные настройки непрозрачности для темного и светлого режимов
      const lineBaseOpacityFactor = isDarkMode ? 0.9 : 0.5;
      const lineBaseColor = isDarkMode
        ? 'rgba(255, 255, 255, '
        : 'rgba(0, 0, 0, ';

      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Рисуем связи
      for (const connection of connections) {
        const sourceNode = nodes[connection.source];
        const targetNode = nodes[connection.target];

        if (!sourceNode || !targetNode) continue;

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Разная базовая непрозрачность для темного и светлого режимов
        let baseOpacity = Math.max(0, 0.8 - distance / 300) * opacity;

        // Уменьшаем непрозрачность для светлого режима
        if (!isDarkMode) {
          baseOpacity *= 0.6;
        } else {
          // Немного уменьшаем для темного режима
          baseOpacity *= 0.9;
        }

        if (connection.pulse) {
          baseOpacity *=
            0.5 +
            0.5 * Math.sin(time * 2 + connection.source + connection.target);
        }

        // Используем более высокую непрозрачность для связей в темном режиме
        // Немного уменьшаем для темного режима
        const pulseOpacityFactor = isDarkMode ? 0.8 : 0.6;
        const color =
          lineBaseColor +
          (connection.pulse
            ? baseOpacity * pulseOpacityFactor
            : baseOpacity * lineBaseOpacityFactor) +
          ')';

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = color;
        // Разная толщина линий для темного и светлого режимов
        ctx.lineWidth = isDarkMode
          ? connection.pulse
            ? 1.4
            : 0.9 // Немного уменьшаем толщину
          : connection.pulse
            ? 1.2
            : 0.8;
        ctx.stroke();
      }

      // Рисуем узлы
      for (const node of nodes) {
        // Свечение
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.5, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          node.radius * 0.5,
          node.x,
          node.y,
          node.radius * 2.5
        );
        gradient.addColorStop(0, nodeGlowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Узел
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
      }
    };

    // Прогреваем физику для избежания начальных резких движений
    // Запускаем несколько итераций физики с низкой интенсивностью
    for (let i = 0; i < 30; i++) {
      updateNodes(16, 0.1); // 16ms - типичное время кадра, низкая интенсивность
    }

    // Плавно показываем канвас
    setTimeout(() => {
      setCanvasOpacity(1);
    }, 100);

    // Переменная для контроля плавного появления
    let opacityLevel = 0;
    const opacityStep = 0.02; // Шаг увеличения прозрачности

    // Функция анимации
    const animate = () => {
      updateNodes(16); // Типичное время кадра

      // Постепенно увеличиваем прозрачность для плавного появления
      if (opacityLevel < 1) {
        opacityLevel += opacityStep;
        if (opacityLevel > 1) opacityLevel = 1;
      }

      drawNetwork(opacityLevel);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Запускаем анимацию
    const timer = setTimeout(() => {
      animate();
    }, 50);

    // Очистка
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(timer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodeCount, resolvedTheme]);

  return (
    <div className='absolute inset-0 -z-10 overflow-hidden'>
      <canvas
        ref={canvasRef}
        className='absolute inset-0 h-full w-full transition-opacity duration-1000'
        style={{ opacity: canvasOpacity }}
      />
    </div>
  );
}
