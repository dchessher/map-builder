import React from 'react';
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

function formatElevation(elevation: number): string {
  return `${Math.round(elevation * 100)}%`;
}

export const MapGrid: React.FC<MapGridProps> = ({ map }) => {
  const width = map[0]?.length ?? 0;

  return (
    <div className="map-container">
      <div
        className="map-grid"
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        }}
      >
        {map.flatMap((row, y) =>
          row.map((tile, x) => (
            <div
              key={`${x}-${y}`}
              className="map-tile"
              style={{ backgroundColor: tileColors[tile.type] }}
              aria-label={`${typeLabels[tile.type]} tile with elevation ${formatElevation(tile.elevation)}`}
            >
              <span className="tile-elevation">{formatElevation(tile.elevation)}</span>
            </div>
          )),
        )}
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
