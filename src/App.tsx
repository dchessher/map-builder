import React, { useMemo, useState } from 'react';
import MapGrid from './components/MapGrid';
import {
  DEFAULT_TERRAIN_WEIGHTS,
  generateMap,
  type TerrainWeights,
  type TileType,
} from './mapGenerator';

const DEFAULT_SEED = 'Emerald Vale';

const App: React.FC = () => {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED);
  const [weights, setWeights] = useState<TerrainWeights>({ ...DEFAULT_TERRAIN_WEIGHTS });

  const weightEntries = useMemo(
    () => Object.entries(weights) as Array<[TileType, number]>,
    [weights],
  );

  const totalWeight = useMemo(
    () => weightEntries.reduce((sum, [, value]) => sum + value, 0),
    [weightEntries],
  );

  const weightsAreDefault = useMemo(
    () =>
      (Object.entries(DEFAULT_TERRAIN_WEIGHTS) as Array<[TileType, number]>).every(
        ([type, value]) => weights[type] === value,
      ),
    [weights],
  );

  const map = useMemo(() => generateMap(seed, { weights }), [seed, weights]);

  const handleWeightChange = (type: TileType, value: number) => {
    setWeights((previous) => ({
      ...previous,
      [type]: value,
    }));
  };

  const handleResetWeights = () => {
    setWeights({ ...DEFAULT_TERRAIN_WEIGHTS });
  };

  const weightLabels: Record<TileType, string> = {
    water: 'Water',
    sand: 'Sand',
    grass: 'Grassland',
    forest: 'Forest',
    mountain: 'Mountain',
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Seeded Map Builder</h1>
        <p>Enter a seed to generate a repeatable random map.</p>
      </header>
      <form
        className="seed-form"
        onSubmit={(event) => {
          event.preventDefault();
          setSeed(seedInput);
        }}
      >
        <label className="seed-label" htmlFor="seed-input">
          Seed
        </label>
        <input
          id="seed-input"
          name="seed"
          type="text"
          value={seedInput}
          onChange={(event) => setSeedInput(event.target.value)}
          placeholder="Type a seed value"
          className="seed-input"
        />
        <div className="seed-buttons">
          <button type="submit" className="primary-button">
            Generate map
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              const randomSeed = crypto.randomUUID().slice(0, 8);
              setSeed(randomSeed);
              setSeedInput(randomSeed);
            }}
          >
            Surprise me
          </button>
        </div>
      </form>
      <section className="weights-panel" aria-labelledby="weights-heading">
        <div className="weights-header">
          <div>
            <h2 id="weights-heading">Terrain weights</h2>
            <p className="weights-description">
              Adjust how frequently each terrain type appears when generating the map.
            </p>
          </div>
          <button
            type="button"
            className="tertiary-button"
            onClick={handleResetWeights}
            disabled={weightsAreDefault}
          >
            Reset weights
          </button>
        </div>
        <div className="weight-sliders" role="group" aria-label="Terrain weight sliders">
          {weightEntries.map(([type, value]) => {
            const percentage = totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 0;
            const sliderId = `${type}-weight`;

            return (
              <div key={type} className="weight-slider">
                <div className="weight-label">
                  <label htmlFor={sliderId}>{weightLabels[type]}</label>
                  <span className="weight-value">{percentage}%</span>
                </div>
                <input
                  id={sliderId}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  onChange={(event) => handleWeightChange(type, Number(event.target.value))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={value}
                  aria-valuetext={`${percentage}% chance of ${weightLabels[type].toLowerCase()}`}
                />
              </div>
            );
          })}
        </div>
      </section>
      <section className="map-section" aria-live="polite">
        <MapGrid map={map} />
      </section>
    </div>
  );
};

export default App;
