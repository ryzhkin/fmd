import type { Map as MapLibreMap } from 'maplibre-gl';
import { FOOTPRINT_LAYER_IDS, LAYER_IDS, WORLD_SOURCE_ID } from '../map/layer-ids';

export type MapMode = 'fantasy' | 'reality';
export interface MapViewState { mode: MapMode; footprintsVisible: boolean }

export class MapViewController {
  readonly #modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
  readonly #footprintsButton = document.querySelector<HTMLButtonElement>('[data-toggle-footprints]');
  readonly #listeners: Array<() => void> = [];
  #state: MapViewState = { mode: 'fantasy', footprintsVisible: true };

  constructor(private readonly map: MapLibreMap) {}

  install(): () => void {
    for (const button of this.#modeButtons) {
      const listener = (): void => this.setMode(button.dataset.mode === 'reality' ? 'reality' : 'fantasy');
      button.addEventListener('click', listener);
      this.#listeners.push(() => button.removeEventListener('click', listener));
    }
    if (this.#footprintsButton) {
      const listener = (): void => this.setFootprintsVisible(!this.#state.footprintsVisible);
      this.#footprintsButton.addEventListener('click', listener);
      this.#listeners.push(() => this.#footprintsButton?.removeEventListener('click', listener));
    }
    this.apply();
    return () => this.#listeners.splice(0).forEach(dispose => dispose());
  }

  setMode(mode: MapMode): void {
    this.#state = { ...this.#state, mode };
    this.apply();
  }

  setFootprintsVisible(visible: boolean): void {
    this.#state = { ...this.#state, footprintsVisible: visible };
    this.apply();
  }

  private apply(): void {
    const fantasy = this.#state.mode === 'fantasy';
    document.body.classList.toggle('fantasy', fantasy);
    this.map.setLayoutProperty(LAYER_IDS.reality, 'visibility', fantasy ? 'none' : 'visible');
    for (const layer of this.map.getStyle().layers) {
      if ('source' in layer && layer.source === WORLD_SOURCE_ID) {
        this.map.setLayoutProperty(layer.id, 'visibility', fantasy ? 'visible' : 'none');
      }
    }
    for (const id of FOOTPRINT_LAYER_IDS) {
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, 'visibility', fantasy && this.#state.footprintsVisible ? 'visible' : 'none');
    }
    for (const button of this.#modeButtons) button.classList.toggle('active', button.dataset.mode === this.#state.mode);
    if (this.#footprintsButton) {
      this.#footprintsButton.classList.toggle('active', this.#state.footprintsVisible);
      this.#footprintsButton.setAttribute('aria-pressed', String(this.#state.footprintsVisible));
    }
  }
}
