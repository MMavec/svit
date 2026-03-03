// Re-export commonly used items
export { municipalities, CRD_BBOX, CRD_CENTER, getMunicipality } from './config/municipalities.ts';
export { panels, getPanelsByTier, getPanel } from './config/panels.ts';
export { councillors, getCouncillorsByMunicipality, getCouncillor } from './config/councillors.ts';
export { newsSources } from './config/news-sources.ts';
export type {
	Theme,
	Municipality,
	PanelConfig,
	GridPosition,
	PanelLayout,
	Meeting,
	Bylaw,
	Councillor,
	NewsItem,
	SocialPost,
	PublicHearing,
	DevelopmentApplication,
	ApiResponse
} from './types/index.ts';
