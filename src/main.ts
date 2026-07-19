import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import { bootstrap } from './app';

void bootstrap().catch(() => {
  // StatusView already exposes the actionable error to the user.
});
