'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MapboxMap, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { BrandPlace } from '@/lib/brand-map';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const FRAME_NORTH = 37;

const CATEGORY_COLORS: Record<string, string> = {
  'Food & beverage': '#e54926',
  CPG: '#d4920a',
  Industrial: '#15345e',
  Retail: '#2c6a9c',
  Automotive: '#c43718',
  Apparel: '#6b4c9a',
  Healthcare: '#0f766e',
  'Home appliances': '#b45309',
  Tobacco: '#64748b',
  Electronics: '#0e7490',
  Chemical: '#9a3412',
  Defense: '#334155',
  Technology: '#1d4ed8',
  Biotechnology: '#15803d',
};

function categoryColor(category: string) {
  return CATEGORY_COLORS[category] || '#15345e';
}

function placeColor(place: BrandPlace) {
  const categories = new Set(
    place.brands.map((brand) => brand.category).filter(Boolean),
  );
  if (categories.size === 1) return categoryColor([...categories][0]);
  return '#15345e';
}

export function BrandMap({ places }: { places: BrandPlace[] }) {
  const mapRef = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const place of places) {
      for (const brand of place.brands) {
        if (brand.category)
          counts.set(brand.category, (counts.get(brand.category) || 0) + 1);
      }
    }
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [places]);

  const visible = useMemo(() => {
    if (filter === 'All') return places;
    return places
      .map((place) => ({
        ...place,
        brands: place.brands.filter((brand) => brand.category === filter),
      }))
      .filter((place) => place.brands.length > 0);
  }, [filter, places]);

  const selected = visible.find((place) => place.id === selectedId) || null;

  useEffect(() => {
    if (!ready || visible.length === 0) return;
    const map = mapRef.current;
    if (!map) return;
    const framed = visible.filter((place) => place.latitude <= FRAME_NORTH);
    const frame = framed.length > 0 ? framed : visible;
    const first = frame[0];
    let west = first.longitude;
    let east = first.longitude;
    let south = first.latitude;
    let north = first.latitude;
    for (const place of frame) {
      west = Math.min(west, place.longitude);
      east = Math.max(east, place.longitude);
      south = Math.min(south, place.latitude);
      north = Math.max(north, place.latitude);
    }
    map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: 36, maxZoom: 7, duration: 600 },
    );
  }, [ready, visible]);

  if (!TOKEN) {
    return (
      <p className='mt-8 text-cream/75'>The map token is not configured.</p>
    );
  }

  return (
    <div className='mt-8'>
      <div className='flex flex-wrap gap-2'>
        <FilterChip
          active={filter === 'All'}
          color='#f7f4ef'
          label='All'
          onClick={() => {
            setFilter('All');
            setSelectedId(null);
          }}
        />
        {categories.map(([name]) => (
          <FilterChip
            key={name}
            active={filter === name}
            color={categoryColor(name)}
            label={name}
            onClick={() => {
              setFilter(name);
              setSelectedId(null);
            }}
          />
        ))}
      </div>
      <div className='mt-4 overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'>
        <MapboxMap
          ref={mapRef}
          mapboxAccessToken={TOKEN}
          initialViewState={{ longitude: -82.4, latitude: 34.7, zoom: 5.2 }}
          style={{ width: '100%', height: 560 }}
          mapStyle='mapbox://styles/mapbox/light-v11'
          cooperativeGestures
          onLoad={() => setReady(true)}
          onClick={() => setSelectedId(null)}
        >
          <NavigationControl position='top-right' showCompass={false} />
          {visible.map((place) => {
            const where = [place.city, place.region].filter(Boolean).join(', ');
            const count = filter === 'All' ? place.count : place.brands.length;
            const color =
              filter === 'All' ? placeColor(place) : categoryColor(filter);
            return (
              <Marker
                key={place.id}
                longitude={place.longitude}
                latitude={place.latitude}
                anchor='center'
              >
                <button
                  type='button'
                  aria-label={
                    count === 1
                      ? place.brands[0]?.name || where
                      : `${count} in ${where}`
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(place.id);
                  }}
                  className={
                    count === 1
                      ? 'block h-3.5 w-3.5 rounded-full border-2 border-white shadow'
                      : 'grid h-7 min-w-7 place-items-center rounded-full border-2 border-white px-1 font-display text-[11px] font-semibold text-white shadow'
                  }
                  style={{ background: color }}
                >
                  {count > 1 ? count : ''}
                </button>
              </Marker>
            );
          })}
          {selected && (
            <Popup
              longitude={selected.longitude}
              latitude={selected.latitude}
              anchor='bottom'
              offset={14}
              closeOnClick={false}
              onClose={() => setSelectedId(null)}
              className='brand-map-popup'
              maxWidth='280px'
            >
              <p className='font-display text-sm font-semibold text-[#071e36]'>
                {[selected.city, selected.region].filter(Boolean).join(', ')}
              </p>
              <ul className='mt-2 max-h-56 space-y-2 overflow-y-auto pr-1'>
                {selected.brands.map((brand) => (
                  <li key={brand.name} className='flex items-start gap-2'>
                    <span
                      className='mt-1.5 h-2 w-2 shrink-0 rounded-full'
                      style={{ background: categoryColor(brand.category) }}
                    />
                    <span>
                      <span className='block text-sm font-semibold leading-snug text-[#071e36]'>
                        {brand.name}
                      </span>
                      {brand.category && (
                        <span className='block text-xs text-[#071e36]/60'>
                          {brand.category}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Popup>
          )}
        </MapboxMap>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  color,
  label,
  onClick,
}: {
  active: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-display text-xs font-semibold tracking-wide ${
        active
          ? 'border-transparent bg-cream text-deep'
          : 'border-white/20 text-cream/90'
      }`}
    >
      <span className='h-2 w-2 rounded-full' style={{ background: color }} />
      {label}
    </button>
  );
}
