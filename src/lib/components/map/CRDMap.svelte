<script lang="ts">
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

		const geojson = {
			type: 'FeatureCollection' as const,
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
			map.addSource('features', {
				type: 'geojson',
				data: geojson,
				cluster: true,
				clusterMaxZoom: 14,
				clusterRadius: 50
			});

			// Cluster circles
			map.addLayer({
				id: 'feature-clusters',
				type: 'circle',
				source: 'features',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': theme.value === 'dark' ? '#4a6fa5' : '#3182ce',
					'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 30],
					'circle-stroke-width': 2,
					'circle-stroke-color': theme.value === 'dark' ? '#1a202c' : '#ffffff'
				}
			});

			// Cluster count labels
			map.addLayer({
				id: 'feature-cluster-count',
				type: 'symbol',
				source: 'features',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': '{point_count_abbreviated}',
					'text-size': 11,
					'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
				},
				paint: {
					'text-color': '#ffffff'
				}
			});

			// Individual feature circles (unclustered)
			map.addLayer({
				id: 'feature-circles',
				type: 'circle',
				source: 'features',
				filter: ['!', ['has', 'point_count']],
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
			const geom = e.features[0].geometry as unknown as { coordinates: [number, number] };
			const coords = geom.coordinates;

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

		// Cluster click: zoom into cluster
		map.on('click', 'feature-clusters', (e) => {
			if (!map || !e.features || !e.features[0]) return;
			const clusterId = e.features[0].properties?.cluster_id;
			const source = map.getSource('features') as maplibregl.GeoJSONSource;
			source.getClusterExpansionZoom(clusterId).then((zoom) => {
				const geom = e.features![0].geometry as unknown as { coordinates: [number, number] };
				map!.easeTo({ center: geom.coordinates, zoom });
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

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="map-wrapper"
	bind:this={mapContainer}
	tabindex="0"
	role="application"
	aria-label="Interactive map of CRD municipalities"
	onkeydown={(e) => {
		if (e.key === 'Escape' && popup) {
			popup.remove();
		}
	}}
></div>

<style>
	.map-wrapper {
		width: 100%;
		height: 100%;
		border-radius: 4px;
		overflow: hidden;
		outline: none;
	}

	.map-wrapper:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: -2px;
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
