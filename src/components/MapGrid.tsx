import React, { forwardRef, useId, useMemo } from 'react';
import type { Tile } from '../mapGenerator';

interface MapGridProps {
  map: Tile[][];
  showDetailedLabels?: boolean;
  showThreeD?: boolean;
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
const EXTRUSION_MIN = HEX_SIZE * 0.35;
const EXTRUSION_RANGE = HEX_SIZE * 5.75;
const PLATFORM_DEPTH = HEX_SIZE * 0.85;

interface Vertex {
  x: number;
  y: number;
}

interface HexCell {
  tile: Tile;
  column: number;
  row: number;
  points: string;
  vertices: Vertex[];
  centerX: number;
  centerY: number;
  extrusionHeight: number;
}

function formatElevation(elevation: number): string {
  return `${Math.round(elevation * 100)}%`;
}

function buildHexGeometry(cx: number, cy: number, size: number): {
  points: string;
  vertices: Vertex[];
} {
  const vertices = Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return {
      x: cx + size * Math.cos(angle),
      y: cy + size * Math.sin(angle),
    };
  });

  const points = vertices.map((vertex) => `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)}`).join(' ');

  return { points, vertices };
}

export const MapGrid = forwardRef<SVGSVGElement, MapGridProps>(
  ({ map, showDetailedLabels = false, showThreeD = false }, ref) => {
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
          const groundCenterX = horizontalStep * column + offset;
          const groundCenterY = verticalStep * row;
          const tile = map[row][column];
          const normalizedElevation = Math.max(tile.elevation, 0.04);
          const extrusionHeight = showThreeD
            ? EXTRUSION_MIN + normalizedElevation * EXTRUSION_RANGE
            : 0;
          const topCenterY = showThreeD ? groundCenterY - extrusionHeight : groundCenterY;

          minX = Math.min(minX, groundCenterX - HALF_SQRT3);
          maxX = Math.max(maxX, groundCenterX + HALF_SQRT3);
          minY = Math.min(minY, topCenterY - HEX_SIZE);
          const depthWithPlatform = showThreeD ? extrusionHeight + PLATFORM_DEPTH : 0;
          maxY = Math.max(maxY, topCenterY + HEX_SIZE + depthWithPlatform);

          cells.push({
            tile,
            column,
            row,
            centerX: groundCenterX,
            centerY: topCenterY,
            points: '',
            vertices: [],
            extrusionHeight,
          });
        }
      }

      if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
        return { cells: [] as HexCell[], viewBox: '0 0 1 1' };
      }

      const horizontalPadding = showThreeD ? HEX_SIZE * 3.4 : HEX_SIZE * 0.6;
      const topPadding = showThreeD ? HEX_SIZE * 3.2 : HEX_SIZE * 0.6;
      const bottomPadding = showThreeD ? HEX_SIZE * 6.2 : HEX_SIZE * 0.6;

      minX -= horizontalPadding;
      maxX += horizontalPadding;
      minY -= topPadding;
      maxY += bottomPadding;

      const width = maxX - minX;
      const height = maxY - minY;

      const normalizedCells = cells.map((cell) => {
        const normalizedCenterX = cell.centerX - minX;
        const normalizedCenterY = cell.centerY - minY;
        const geometry = buildHexGeometry(normalizedCenterX, normalizedCenterY, HEX_SIZE);

        return {
          ...cell,
          points: geometry.points,
          vertices: geometry.vertices,
          centerX: normalizedCenterX,
          centerY: normalizedCenterY,
        };
      });

      return {
        cells: normalizedCells,
        viewBox: `0 0 ${width.toFixed(4)} ${height.toFixed(4)}`,
      };
    }, [map, showThreeD]);

    return (
      <div className="map-container">
        <div className={`map-viewport${showThreeD ? ' map-viewport--3d' : ''}`}>
          <svg
            className={`map-svg${showThreeD ? ' map-svg--3d' : ''}`}
            viewBox={viewBox}
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
            preserveAspectRatio="xMidYMid meet"
            ref={ref}
          >
            <title id={titleId}>Generated terrain map</title>
            <desc id={descriptionId}>
              {`A hexagonal map with ${map.length} rows and ${map[0]?.length ?? 0} columns.`}
            </desc>
            {cells.map((cell) => {
              const labelX = cell.centerX.toFixed(4);
              const labelY = cell.centerY.toFixed(4);
              const detailY = (cell.centerY - 0.4).toFixed(4);

              if (!showThreeD) {
                return (
                  <g key={`${cell.column}-${cell.row}`} className="map-hex-group">
                    <polygon
                      className="map-hex"
                      points={cell.points}
                      fill={tileColors[cell.tile.type]}
                    >
                      <title>{`${typeLabels[cell.tile.type]} tile with elevation ${formatElevation(cell.tile.elevation)}`}</title>
                    </polygon>
                    <text className="map-hex-label" x={labelX} y={labelY}>
                      {formatElevation(cell.tile.elevation)}
                    </text>
                    {showDetailedLabels ? (
                      <text className="map-hex-detail" x={labelX} y={detailY}>
                        <tspan x={labelX} dy="0">{`${typeLabels[cell.tile.type]}`}</tspan>
                        <tspan x={labelX} dy="0.45">
                          {`(${cell.column}, ${cell.row})`}
                        </tspan>
                        <tspan x={labelX} dy="0.45">
                          {`Elev ${formatElevation(cell.tile.elevation)}`}
                        </tspan>
                      </text>
                    ) : null}
                  </g>
                );
              }

              const baseDepth = showThreeD ? cell.extrusionHeight + PLATFORM_DEPTH : 0;
              const bottomVertices = cell.vertices.map((vertex) => ({
                x: vertex.x,
                y: vertex.y + baseDepth,
              }));
              const bottomPoints = bottomVertices
                .map((vertex) => `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)}`)
                .join(' ');

              const sidePolygons = cell.vertices.map((vertex, index) => {
                const nextIndex = (index + 1) % cell.vertices.length;
                const nextVertex = cell.vertices[nextIndex];
                const bottomVertex = bottomVertices[index];
                const nextBottomVertex = bottomVertices[nextIndex];
                const faceCenterY =
                  (vertex.y + nextVertex.y + bottomVertex.y + nextBottomVertex.y) / 4;
                const frontThreshold = cell.centerY + baseDepth * 0.65;
                const backThreshold = cell.centerY + baseDepth * 0.2;
                let shade: 'front' | 'mid' | 'back';

                if (faceCenterY >= frontThreshold) {
                  shade = 'front';
                } else if (faceCenterY <= backThreshold) {
                  shade = 'back';
                } else {
                  shade = 'mid';
                }

                return {
                  path: `M${vertex.x.toFixed(4)},${vertex.y.toFixed(4)} L${nextVertex.x.toFixed(4)},${nextVertex.y.toFixed(4)} L${nextBottomVertex.x.toFixed(4)},${nextBottomVertex.y.toFixed(4)} L${bottomVertex.x.toFixed(4)},${bottomVertex.y.toFixed(4)} Z`,
                  shade,
                };
              });

              return (
                <g
                  key={`${cell.column}-${cell.row}`}
                  className="map-hex-group map-hex-group--3d"
                >
                  <polygon
                    className="map-hex-base"
                    points={bottomPoints}
                    fill={tileColors[cell.tile.type]}
                  />
                  {sidePolygons.map((polygon, index) => (
                    <path
                      key={`side-${index}`}
                      className={`map-hex-side map-hex-side--${polygon.shade}`}
                      d={polygon.path}
                      fill={tileColors[cell.tile.type]}
                    />
                  ))}
                  <polygon
                    className="map-hex map-hex--top"
                    points={cell.points}
                    fill={tileColors[cell.tile.type]}
                  >
                    <title>{`${typeLabels[cell.tile.type]} tile with elevation ${formatElevation(cell.tile.elevation)}`}</title>
                  </polygon>
                  <text className="map-hex-label" x={labelX} y={labelY}>
                    {formatElevation(cell.tile.elevation)}
                  </text>
                  {showDetailedLabels ? (
                    <text className="map-hex-detail" x={labelX} y={detailY}>
                      <tspan x={labelX} dy="0">{`${typeLabels[cell.tile.type]}`}</tspan>
                      <tspan x={labelX} dy="0.45">
                        {`(${cell.column}, ${cell.row})`}
                      </tspan>
                      <tspan x={labelX} dy="0.45">
                        {`Elev ${formatElevation(cell.tile.elevation)}`}
                      </tspan>
                    </text>
                  ) : null}
                </g>
              );
            })}
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
  },
);

MapGrid.displayName = 'MapGrid';

export default MapGrid;
