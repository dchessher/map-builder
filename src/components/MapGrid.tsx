import React, { useId, useMemo } from 'react';
import type { Tile } from '../mapGenerator';

interface MapGridProps {
  map: Tile[][];
}

const tileColors: Record<Tile['type'], string> = {
  water: 'var(--color-water)',
  sand: 'var(--color-sand)',
  grass: 'var(--color-grass)',
  forest: 'var(--color-forest)',
  mountain: 'var(--color-mountain)',
};

const typeLabels: Record<Tile['type'], string> = {
  water: 'Water',
  sand: 'Sand',
  grass: 'Grassland',
  forest: 'Forest',
  mountain: 'Mountain',
};

const SQRT3 = Math.sqrt(3);
const HEX_SIZE = 1;
const HALF_SQRT3 = (SQRT3 / 2) * HEX_SIZE;

interface HexCell {
  tile: Tile;
  column: number;
  row: number;
  points: string;
  centerX: number;
  centerY: number;
}

function formatElevation(elevation: number): string {
  return `${Math.round(elevation * 100)}%`;
}

function buildHexPoints(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    const pointX = cx + size * Math.cos(angle);
    const pointY = cy + size * Math.sin(angle);
    return `${pointX.toFixed(4)},${pointY.toFixed(4)}`;
  }).join(' ');
}

export const MapGrid: React.FC<MapGridProps> = ({ map }) => {
  const titleId = useId();
  const descriptionId = useId();

  const { cells, viewBox } = useMemo(() => {
    if (map.length === 0 || map[0].length === 0) {
      return { cells: [] as HexCell[], viewBox: '0 0 1 1' };
    }

    const cells: HexCell[] = [];
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const horizontalStep = SQRT3 * HEX_SIZE;
    const verticalStep = 1.5 * HEX_SIZE;

    for (let row = 0; row < map.length; row += 1) {
      const offset = row % 2 === 1 ? horizontalStep / 2 : 0;
      for (let column = 0; column < map[row].length; column += 1) {
        const centerX = horizontalStep * column + offset;
        const centerY = verticalStep * row;

        minX = Math.min(minX, centerX - HALF_SQRT3);
        maxX = Math.max(maxX, centerX + HALF_SQRT3);
        minY = Math.min(minY, centerY - HEX_SIZE);
        maxY = Math.max(maxY, centerY + HEX_SIZE);

        cells.push({
          tile: map[row][column],
          column,
          row,
          centerX,
          centerY,
          points: '',
        });
      }
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return { cells: [] as HexCell[], viewBox: '0 0 1 1' };
    }

    const width = maxX - minX;
    const height = maxY - minY;

    const normalizedCells = cells.map((cell) => ({
      ...cell,
      points: buildHexPoints(cell.centerX - minX, cell.centerY - minY, HEX_SIZE),
      centerX: cell.centerX - minX,
      centerY: cell.centerY - minY,
    }));

    return {
      cells: normalizedCells,
      viewBox: `0 0 ${width.toFixed(4)} ${height.toFixed(4)}`,
    };
  }, [map]);

  return (
    <div className="map-container">
      <div className="map-viewport">
        <svg
          className="map-svg"
          viewBox={viewBox}
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={titleId}>Generated terrain map</title>
          <desc id={descriptionId}>
            {`A hexagonal map with ${map.length} rows and ${map[0]?.length ?? 0} columns.`}
          </desc>
          {cells.map((cell) => (
            <g key={`${cell.column}-${cell.row}`} className="map-hex-group">
              <polygon
                className="map-hex"
                points={cell.points}
                fill={tileColors[cell.tile.type]}
              >
                <title>{`${typeLabels[cell.tile.type]} tile with elevation ${formatElevation(cell.tile.elevation)}`}</title>
              </polygon>
              <text
                className="map-hex-label"
                x={cell.centerX.toFixed(4)}
                y={cell.centerY.toFixed(4)}
              >
                {formatElevation(cell.tile.elevation)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="map-legend" aria-label="Map legend">
        {Object.entries(tileColors).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: color }} />
            <span className="legend-label">{typeLabels[type as keyof typeof typeLabels]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapGrid;
