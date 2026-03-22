<script lang="ts">
	/* global GeoJSON */
	import { onMount, onDestroy } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { theme } from '$lib/stores/theme.svelte';
	import { municipalityStore } from '$lib/stores/municipality.svelte';
	import { CRD_BBOX } from '$lib/config/municipalities';
	import type { MapFeature } from '$lib/types/index';

	interface Props {
		features?: MapFeature[];
		onFeatureClick?: (feature: MapFeature) => void;
	}

	let { features = [], onFeatureClick }: Props = $props();
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | undefined;
	let popup: maplibregl.Popup | undefined;
	let mapReady = $state(false);

	const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
	const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

	function addLayers() {
		if (!map) return;

		// Municipality boundaries
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
					'fill-opacity': 0.15
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
					'line-width': 1.5,
					'line-opacity': 0.6
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
					'text-size': 11,
					'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
					'text-allow-overlap': false
				},
				paint: {
					'text-color': theme.value === 'dark' ? '#e2e8f0' : '#2d3748',
					'text-halo-color': theme.value === 'dark' ? '#0a0e1a' : '#ffffff',
					'text-halo-width': 1.5
				}
			});
		}

		// Feature markers
		updateFeatureSource();
	}

	function updateFeatureSource() {
		if (!map || !mapReady) return;

		const geojson: GeoJSON.FeatureCollection = {
			type: 'FeatureCollection',
			features: features
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
			map.addSource('features', { type: 'geojson', data: geojson });

			map.addLayer({
				id: 'feature-circles',
				type: 'circle',
				source: 'features',
				paint: {
					'circle-radius': 6,
					'circle-color': ['get', 'color'],
					'circle-stroke-width': 2,
					'circle-stroke-color': theme.value === 'dark' ? '#1a202c' : '#ffffff'
				}
			});
		}
	}

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: theme.value === 'dark' ? DARK_STYLE : LIGHT_STYLE,
			bounds: CRD_BBOX as maplibregl.LngLatBoundsLike,
			fitBoundsOptions: { padding: 20 }
		});

		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

		popup = new maplibregl.Popup({ closeButton: false, maxWidth: '240px' });

		map.on('load', () => {
			mapReady = true;
			addLayers();
		});

		// Re-add layers after style change
		map.on('style.load', () => {
			mapReady = true;
			addLayers();
		});

		// Feature click
		map.on('click', 'feature-circles', (e) => {
			if (!e.features || !e.features[0]) return;
			const props = e.features[0].properties;
			const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

			popup
				?.setLngLat(coords)
				.setHTML(
					`<div style="font-size:0.8125rem">
						<strong>${props?.title || ''}</strong>
						<div style="font-size:0.6875rem;margin-top:4px;opacity:0.8">${props?.description || ''}</div>
					</div>`
				)
				.addTo(map!);

			if (onFeatureClick && props?.id) {
				const feature = features.find((f) => f.id === props.id);
				if (feature) onFeatureClick(feature);
			}
		});

		map.on('mouseenter', 'feature-circles', () => {
			if (map) map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', 'feature-circles', () => {
			if (map) map.getCanvas().style.cursor = '';
		});
	});

	onDestroy(() => {
		popup?.remove();
		map?.remove();
	});

	// React to theme changes — swap basemap style
	$effect(() => {
		const t = theme.value;
		if (map && mapReady) {
			map.setStyle(t === 'dark' ? DARK_STYLE : LIGHT_STYLE);
			// style.load event will re-add layers
		}
	});

	// React to municipality selection — fly to bbox
	$effect(() => {
		const bbox = municipalityStore.bbox;
		if (map && mapReady) {
			map.fitBounds(bbox as maplibregl.LngLatBoundsLike, {
				padding: 40,
				duration: 1000
			});
		}
	});

	// React to features changes
	$effect(() => {
		const _features = features;
		updateFeatureSource();
	});
</script>

<div class="map-wrapper" bind:this={mapContainer}></div>

<style>
	.map-wrapper {
		width: 100%;
		height: 100%;
		border-radius: 4px;
		overflow: hidden;
	}

	.map-wrapper :global(.maplibregl-ctrl-top-right) {
		top: 4px;
		right: 4px;
	}

	.map-wrapper :global(.maplibregl-ctrl-group) {
		background: var(--bg-surface);
		border: 1px solid var(--border-primary);
		box-shadow: none;
	}

	.map-wrapper :global(.maplibregl-ctrl-group button) {
		width: 28px;
		height: 28px;
	}

	.map-wrapper :global(.maplibregl-popup-content) {
		background: var(--bg-surface, #1a202c);
		color: var(--text-primary, #e2e8f0);
		border: 1px solid var(--border-primary, #2d3748);
		border-radius: 8px;
		padding: 8px 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}

	.map-wrapper :global(.maplibregl-popup-tip) {
		border-top-color: var(--bg-surface, #1a202c);
	}
</style>
