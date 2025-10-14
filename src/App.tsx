import React, { useMemo, useState } from 'react';
import MapGrid from './components/MapGrid';
import { generateMap } from './mapGenerator';

const DEFAULT_SEED = 'Emerald Vale';

const App: React.FC = () => {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [seedInput, setSeedInput] = useState(DEFAULT_SEED);

  const map = useMemo(() => generateMap(seed), [seed]);

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
      <section className="map-section" aria-live="polite">
        <MapGrid map={map} />
      </section>
    </div>
  );
};

export default App;
