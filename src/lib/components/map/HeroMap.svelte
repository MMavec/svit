<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type maplibregl from 'maplibre-gl';
	import { theme } from '$lib/stores/theme.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { CRD_BBOX } from '$lib/config/municipalities';
	import { fetchDevelopments } from '$lib/api/development';
	import { fetchConstruction } from '$lib/api/construction';
	import { fetchSafetyAlerts } from '$lib/api/safety';
	import { fetchEvents } from '$lib/api/events';
	import { fetchWildlifeSightings } from '$lib/api/wildlife';
	import { fetchTreeObservations } from '$lib/api/trees';
	import { fetchEnvironmentReadings } from '$lib/api/environment';
	import { escapeHtml } from '$lib/utils/sanitize';
	import { mapFocusStore } from '$lib/stores/map-focus.svelte';
	import type { MapFeature } from '$lib/types/index';

	const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
	const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

	const CATEGORIES = {
		development: { label: 'Development', color: '#3182ce' },
		construction: { label: 'Roads', color: '#d69e2e' },
		safety: { label: 'Safety', color: '#e53e3e' },
		event: { label: 'Events', color: '#38a169' },
		wildlife: { label: 'Wildlife', color: '#805ad5' },
		trees: { label: 'Trees', color: '#2f855a' },
		environment: { label: 'Air & Water', color: '#00b5d8' }
	} as const;

	type Category = keyof typeof CATEGORIES;

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | undefined;
	let popup: maplibregl.Popup | undefined;
	let mapReady = $state(false);
	let features = $state<MapFeature[]>([]);
	let loading = $state(true);
	let abortController: AbortController | undefined;
	let activeCategories = new SvelteSet<Category>([
		'development',
		'construction',
		'safety',
		'event',
		'wildlife',
		'trees',
		'environment'
	]);

	const filteredFeatures = $derived(
		features.filter((f) => activeCategories.has(f.type as Category))
	);

	function toggleCategory(cat: Category) {
		if (activeCategories.has(cat)) {
			activeCategories.delete(cat);
		} else {
			activeCategories.add(cat);
		}
	}

	async function loadFeatures() {
		// Cancel any in-flight requests
		abortController?.abort();
		abortController = new AbortController();
		const { signal } = abortController;

		loading = true;
		const municipality = municipalityStore.slug;
		const allFeatures: MapFeature[] = [];

		const [devRes, conRes, safeRes, eventRes, wildRes, treeRes, envRes] = await Promise.allSettled([
			fetchDevelopments({ municipality, limit: 50 }),
			fetchConstruction({ municipality, limit: 50 }),
			fetchSafetyAlerts({ municipality, limit: 30 }),
			fetchEvents({ municipality, limit: 30 }),
			fetchWildlifeSightings({ municipality, limit: 50 }),
			fetchTreeObservations({ municipality, limit: 50 }),
			fetchEnvironmentReadings({ municipality, limit: 20 })
		]);

		// Bail if this request was superseded by a newer one
		if (signal.aborted) return;

		if (devRes.status === 'fulfilled' && devRes.value.data) {
			for (const d of devRes.value.data) {
				if (!d.coordinates) continue;
				allFeatures.push({
					id: d.id,
					type: 'development',
					coordinates: d.coordinates,
					title: d.address,
					description: d.description?.slice(0, 120) || d.type,
					severity: d.flagged ? 'high' : undefined,
					municipality: d.municipality,
					color: CATEGORIES.development.color,
					icon: 'D'
				});
			}
		}

		if (conRes.status === 'fulfilled' && conRes.value.data) {
			for (const c of conRes.value.data) {
				if (!c.coordinates) continue;
				allFeatures.push({
					id: c.id,
					type: 'construction',
					coordinates: c.coordinates,
					title: c.headline,
					description: c.description?.slice(0, 120) || c.eventType,
					severity: c.severity,
					municipality: c.municipality,
					color: CATEGORIES.construction.color,
					icon: 'C'
				});
			}
		}

		if (safeRes.status === 'fulfilled' && safeRes.value.data) {
			for (const s of safeRes.value.data) {
				if (!s.coordinates) continue;
				allFeatures.push({
					id: s.id,
					type: 'safety',
					coordinates: s.coordinates,
					title: s.title,
					description: s.description?.slice(0, 120) || s.type,
					severity: s.severity,
					municipality: s.municipality,
					color: CATEGORIES.safety.color,
					icon: 'S'
				});
			}
		}

		if (eventRes.status === 'fulfilled' && eventRes.value.data) {
			for (const e of eventRes.value.data) {
				const coords = (e as unknown as { coordinates?: [number, number] }).coordinates;
				if (!coords) continue;
				allFeatures.push({
					id: e.id,
					type: 'event',
					coordinates: coords,
					title: e.title,
					description: e.location || e.category,
					municipality: e.municipality,
					color: CATEGORIES.event.color,
					icon: 'E'
				});
			}
		}

		if (wildRes.status === 'fulfilled' && wildRes.value.data) {
			for (const w of wildRes.value.data) {
				if (!w.coordinates) continue;
				allFeatures.push({
					id: w.id,
					type: 'wildlife',
					coordinates: w.coordinates,
					title: w.commonName,
					description: w.species,
					municipality: w.municipality,
					color: CATEGORIES.wildlife.color,
					icon: 'W'
				});
			}
		}

		if (treeRes.status === 'fulfilled' && treeRes.value.data) {
			for (const t of treeRes.value.data) {
				if (!t.coordinates) continue;
				allFeatures.push({
					id: t.id,
					type: 'trees',
					coordinates: t.coordinates,
					title: t.commonName,
					description: t.species,
					municipality: t.municipality,
					color: CATEGORIES.trees.color,
					icon: 'T'
				});
			}
		}

		if (envRes.status === 'fulfilled' && envRes.value.data) {
			for (const r of envRes.value.data) {
				if (!r.coordinates) continue;
				allFeatures.push({
					id: r.id,
					type: 'environment',
					coordinates: r.coordinates,
					title: `${r.metric}: ${r.value} ${r.unit}`,
					description: `${r.location} — ${r.status}`,
					severity: r.status === 'good' ? undefined : r.status,
					municipality: r.municipality,
					color: CATEGORIES.environment.color,
					icon: 'Q'
				});
			}
		}

		features = allFeatures;
		loading = false;
	}

	function addLayers() {
		if (!map) return;

		if (!map.getSource('municipalities')) {
			map.addSource('municipalities', {
				type: 'geojson',
				data: '/data/crd-municipalities.geojson'
			});
		}

		if (!map.getLayer('municipality-fill')) {
			map.addLayer({
				id: 'municipality-fill',
				type: 'fill',
				source: 'municipalities',
				paint: {
					'fill-color': ['get', 'color'],
					'fill-opacity': 0.08
				}
			});
		}

		if (!map.getLayer('municipality-outline')) {
			map.addLayer({
				id: 'municipality-outline',
				type: 'line',
				source: 'municipalities',
				paint: {
					'line-color': ['get', 'color'],
					'line-width': 2,
					'line-opacity': 0.5
				}
			});
		}

		if (!map.getLayer('municipality-labels')) {
			map.addLayer({
				id: 'municipality-labels',
				type: 'symbol',
				source: 'municipalities',
				layout: {
					'text-field': ['get', 'name'],
					'text-size': 12,
					'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
					'text-allow-overlap': false
				},
				paint: {
					'text-color': theme.value === 'dark' ? '#cbd5e0' : '#4a5568',
					'text-halo-color': theme.value === 'dark' ? '#0a0e1a' : '#ffffff',
					'text-halo-width': 2
				}
			});
		}

		updateFeatureSource();
	}

	function updateFeatureSource() {
		if (!mapReady || !map) return;

		const geojson = {
			type: 'FeatureCollection' as const,
			features: filteredFeatures
				.filter((f) => f.coordinates)
				.map((f) => ({
					type: 'Feature' as const,
					properties: {
						id: f.id,
						title: f.title,
						description: f.description,
						type: f.type,
						color: f.color,
						icon: f.icon,
						severity: f.severity || ''
					},
					geometry: {
						type: 'Point' as const,
						coordinates: f.coordinates
					}
				}))
		};

		if (map.getSource('features')) {
			(map.getSource('features') as maplibregl.GeoJSONSource).setData(geojson);
		} else {
			map.addSource('features', {
				type: 'geojson',
				data: geojson,
				cluster: true,
				clusterMaxZoom: 13,
				clusterRadius: 40
			});

			// Cluster circles with color gradient by count
			map.addLayer({
				id: 'feature-clusters',
				type: 'circle',
				source: 'features',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': [
						'step',
						['get', 'point_count'],
						theme.value === 'dark' ? '#4a6fa5' : '#3182ce',
						10,
						theme.value === 'dark' ? '#6b46c1' : '#805ad5',
						50,
						theme.value === 'dark' ? '#c53030' : '#e53e3e'
					],
					'circle-radius': ['step', ['get', 'point_count'], 18, 10, 26, 50, 36],
					'circle-stroke-width': 3,
					'circle-stroke-color': theme.value === 'dark' ? '#1a202c' : '#ffffff',
					'circle-opacity': 0.9
				}
			});

			map.addLayer({
				id: 'feature-cluster-count',
				type: 'symbol',
				source: 'features',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': '{point_count_abbreviated}',
					'text-size': 13,
					'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
				},
				paint: {
					'text-color': '#ffffff'
				}
			});

			// Individual markers — zoom-responsive sizing
			map.addLayer({
				id: 'feature-circles',
				type: 'circle',
				source: 'features',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 12, 9, 16, 12],
					'circle-color': ['get', 'color'],
					'circle-stroke-width': 2.5,
					'circle-stroke-color': theme.value === 'dark' ? '#1a202c' : '#ffffff',
					'circle-opacity': 0.9
				}
			});
		}
	}

	onMount(async () => {
		let ml: typeof maplibregl;
		try {
			ml = (await import('maplibre-gl')).default;
			await import('maplibre-gl/dist/maplibre-gl.css');
		} catch {
			loading = false;
			return;
		}

		try {
			map = new ml.Map({
				container: mapContainer,
				style: theme.value === 'dark' ? DARK_STYLE : LIGHT_STYLE,
				bounds: CRD_BBOX as maplibregl.LngLatBoundsLike,
				fitBoundsOptions: { padding: 40 },
				attributionControl: false
			});
		} catch {
			// WebGL unavailable (headless browsers, older hardware)
			loading = false;
			return;
		}

		map.addControl(new ml.NavigationControl({ showCompass: true }), 'top-right');
		map.addControl(new ml.AttributionControl({ compact: true }), 'bottom-right');

		popup = new ml.Popup({ closeButton: true, maxWidth: '280px', offset: 12 });

		map.on('load', () => {
			mapReady = true;
			addLayers();
			loadFeatures();
		});

		map.on('style.load', () => {
			mapReady = true;
			addLayers();
		});

		map.on('click', 'feature-circles', (e) => {
			if (!e.features || !e.features[0]) return;
			const props = e.features[0].properties;
			const geom = e.features[0].geometry as unknown as { coordinates: [number, number] };
			const typeMeta = CATEGORIES[props?.type as Category];

			const badge = typeMeta
				? `<span style="display:inline-block;font-size:0.6875rem;font-weight:700;padding:2px 7px;border-radius:4px;background:${typeMeta.color};color:#fff;text-transform:uppercase;letter-spacing:0.03em">${escapeHtml(typeMeta.label)}</span>`
				: '';

			popup
				?.setLngLat(geom.coordinates)
				.setHTML(
					`<div style="font-size:0.875rem;line-height:1.4">
						<div style="margin-bottom:6px">${badge}</div>
						<strong style="font-size:0.9375rem">${escapeHtml(String(props?.title || ''))}</strong>
						<div style="font-size:0.8125rem;margin-top:4px;opacity:0.75">${escapeHtml(String(props?.description || ''))}</div>
					</div>`
				)
				.addTo(map!);
		});

		map.on('mouseenter', 'feature-circles', () => {
			if (map) map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', 'feature-circles', () => {
			if (map) map.getCanvas().style.cursor = '';
		});

		map.on('click', 'feature-clusters', (e) => {
			if (!map || !e.features || !e.features[0]) return;
			const clusterId = e.features[0].properties?.cluster_id;
			const source = map.getSource('features') as maplibregl.GeoJSONSource;
			source.getClusterExpansionZoom(clusterId).then((zoom) => {
				const geom = e.features![0].geometry as unknown as {
					coordinates: [number, number];
				};
				const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
				if (prefersReducedMotion) {
					map!.jumpTo({ center: geom.coordinates, zoom });
				} else {
					map!.easeTo({ center: geom.coordinates, zoom });
				}
			});
		});

		map.on('mouseenter', 'feature-clusters', () => {
			if (map) map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', 'feature-clusters', () => {
			if (map) map.getCanvas().style.cursor = '';
		});
	});

	onDestroy(() => {
		abortController?.abort();
		popup?.remove();
		map?.remove();
	});

	$effect(() => {
		const t = theme.value;
		if (map && mapReady) {
			map.setStyle(t === 'dark' ? DARK_STYLE : LIGHT_STYLE);
		}
	});

	$effect(() => {
		const bbox = municipalityStore.bbox;
		if (!mapReady || !map) return;
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		map.fitBounds(bbox as maplibregl.LngLatBoundsLike, {
			padding: 40,
			duration: prefersReducedMotion ? 0 : 1000
		});
		loadFeatures();
	});

	$effect(() => {
		const _f = filteredFeatures;
		updateFeatureSource();
	});

	// React to cross-panel map focus requests
	$effect(() => {
		const _v = mapFocusStore.version;
		const t = mapFocusStore.target;
		if (!t || !map || !mapReady) return;
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReducedMotion) {
			map.jumpTo({ center: t.coordinates, zoom: t.zoom || 14 });
		} else {
			map.flyTo({ center: t.coordinates, zoom: t.zoom || 14, duration: 1200 });
		}
		popup
			?.setLngLat(t.coordinates)
			.setHTML(
				`<div style="font-size:0.875rem;line-height:1.4">
					${t.color ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${t.color};margin-right:6px"></span>` : ''}
					<strong style="font-size:0.9375rem">${escapeHtml(t.title)}</strong>
					${t.description ? `<div style="font-size:0.8125rem;margin-top:4px;opacity:0.75">${escapeHtml(t.description)}</div>` : ''}
				</div>`
			)
			.addTo(map);
	});
</script>

<div class="hero-map">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions -->
	<div
		class="map-container"
		bind:this={mapContainer}
		tabindex="0"
		role="application"
		aria-label="Interactive overview map of the Capital Regional District"
		onkeydown={(e) => {
			if (e.key === 'Escape' && popup) popup.remove();
		}}
	></div>

	<div class="legend">
		{#each Object.entries(CATEGORIES) as [key, meta] (key)}
			<button
				class="legend-item"
				class:inactive={!activeCategories.has(key as Category)}
				onclick={() => toggleCategory(key as Category)}
				aria-pressed={activeCategories.has(key as Category)}
			>
				<span class="legend-dot" style="background: {meta.color}"></span>
				<span class="legend-label">{meta.label}</span>
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="loading-indicator">
			<span class="loading-pulse"></span>
			Loading live data...
		</div>
	{/if}

	<button
		class="reset-view-btn"
		onclick={() => {
			if (!map) return;
			const bbox = municipalityStore.bbox;
			const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			map.fitBounds(bbox as maplibregl.LngLatBoundsLike, {
				padding: 40,
				duration: prefersReducedMotion ? 0 : 800
			});
		}}
		title="Reset map view"
		aria-label="Reset map view"
	>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
			<polyline points="9 22 9 12 15 12 15 22" />
		</svg>
	</button>

	<div class="feature-count">
		{filteredFeatures.length} live item{filteredFeatures.length !== 1 ? 's' : ''}
	</div>
</div>

<style>
	.hero-map {
		position: relative;
		width: 100%;
		height: 55vh;
		min-height: 360px;
		max-height: 600px;
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid var(--border-primary);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
	}

	.map-container {
		width: 100%;
		height: 100%;
		outline: none;
	}

	.map-container:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: -2px;
	}

	.legend {
		position: absolute;
		bottom: 14px;
		left: 14px;
		display: flex;
		gap: 5px;
		flex-wrap: wrap;
		max-width: calc(100% - 120px);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 12px;
		border-radius: 20px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		opacity: 1;
	}

	.legend-item:hover {
		border-color: var(--text-tertiary);
		transform: translateY(-1px);
	}

	.legend-item.inactive {
		opacity: 0.35;
	}

	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.loading-indicator {
		position: absolute;
		top: 14px;
		left: 54px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 14px;
		border-radius: 10px;
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
		font-size: 0.8125rem;
		color: var(--text-secondary);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.loading-pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-primary);
		animation: pulse 1.2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	.feature-count {
		position: absolute;
		bottom: 14px;
		right: 14px;
		padding: 5px 12px;
		border-radius: 10px;
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-family: 'Geist Mono', monospace;
		font-weight: 500;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.reset-view-btn {
		position: absolute;
		top: 14px;
		left: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid var(--border-primary);
		background: var(--bg-surface);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		z-index: 1;
	}

	.reset-view-btn:hover {
		color: var(--text-primary);
		border-color: var(--text-tertiary);
		transform: translateY(-1px);
	}

	.map-container :global(.maplibregl-ctrl-top-right) {
		top: 8px;
		right: 8px;
	}

	.map-container :global(.maplibregl-ctrl-group) {
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		border-radius: 8px;
	}

	.map-container :global(.maplibregl-ctrl-group button) {
		width: 32px;
		height: 32px;
	}

	.map-container :global(.maplibregl-popup-content) {
		background: var(--bg-surface, #1a202c);
		color: var(--text-primary, #e2e8f0);
		border: 1px solid var(--border-primary, #2d3748);
		border-radius: 10px;
		padding: 10px 14px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.map-container :global(.maplibregl-popup-tip) {
		border-top-color: var(--bg-surface, #1a202c);
	}

	.map-container :global(.maplibregl-popup-close-button) {
		font-size: 16px;
		color: var(--text-tertiary);
		padding: 4px 8px;
	}

	@media (max-width: 768px) {
		.hero-map {
			height: 40vh;
			min-height: 260px;
			border-radius: 10px;
		}

		.legend {
			bottom: 10px;
			left: 10px;
			gap: 3px;
			max-width: calc(100% - 80px);
		}

		.legend-item {
			padding: 3px 8px;
			font-size: 0.6875rem;
		}

		.legend-dot {
			width: 8px;
			height: 8px;
		}
	}
</style>
