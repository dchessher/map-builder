import React, { useMemo, useRef, useState } from 'react';
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
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'json'>('png');
  const [isDownloading, setIsDownloading] = useState(false);
  const mapSvgRef = useRef<SVGSVGElement | null>(null);

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

  const fileBaseName = useMemo(() => {
    const trimmed = seed.trim();
    if (!trimmed) {
      return 'generated-map';
    }

    const sanitized = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return sanitized || 'generated-map';
  }, [seed]);

  const handleWeightChange = (type: TileType, value: number) => {
    setWeights((previous) => ({
      ...previous,
      [type]: value,
    }));
  };

  const handleResetWeights = () => {
    setWeights({ ...DEFAULT_TERRAIN_WEIGHTS });
  };

  const triggerDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      if (downloadFormat === 'json') {
        const jsonPayload = {
          seed,
          weights,
          dimensions: {
            rows: map.length,
            columns: map[0]?.length ?? 0,
          },
          tiles: map,
        };

        const jsonBlob = new Blob([JSON.stringify(jsonPayload, null, 2)], {
          type: 'application/json',
        });
        const jsonUrl = URL.createObjectURL(jsonBlob);

        try {
          triggerDownload(jsonUrl, `${fileBaseName}.json`);
        } finally {
          URL.revokeObjectURL(jsonUrl);
        }

        return;
      }

      const svgElement = mapSvgRef.current;

      if (!svgElement) {
        throw new Error('Map preview is not available yet.');
      }

      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => resolve(img);
          img.onerror = (event) => reject(event);
          img.src = svgUrl;
        });

        const rect = svgElement.getBoundingClientRect();
        const exportWidth = rect.width || svgElement.viewBox.baseVal.width || 1024;
        const exportHeight = rect.height || svgElement.viewBox.baseVal.height || 576;
        const pixelRatio = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(exportWidth * pixelRatio));
        canvas.height = Math.max(1, Math.round(exportHeight * pixelRatio));

        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Unable to create drawing context.');
        }

        const background = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-panel')
          .trim() || '#06110d';

        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.drawImage(image, 0, 0, exportWidth, exportHeight);

        const pngBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );

        if (!pngBlob) {
          throw new Error('Failed to create PNG image.');
        }

        const pngUrl = URL.createObjectURL(pngBlob);

        try {
          triggerDownload(pngUrl, `${fileBaseName}.png`);
        } finally {
          URL.revokeObjectURL(pngUrl);
        }
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    } catch (error) {
      console.error('Failed to download the map', error);
    } finally {
      setIsDownloading(false);
    }
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
        <div className="map-toolbar" role="group" aria-label="Map export controls">
          <div className="format-select">
            <label htmlFor="download-format">Download format</label>
            <select
              id="download-format"
              value={downloadFormat}
              onChange={(event) => setDownloadFormat(event.target.value as 'png' | 'json')}
              disabled={isDownloading}
            >
              <option value="png">PNG image</option>
              <option value="json">JSON data</option>
            </select>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Preparing…' : 'Download map'}
          </button>
        </div>
        <MapGrid ref={mapSvgRef} map={map} />
      </section>
    </div>
  );
};

export default App;
