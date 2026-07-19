// Stable npm-script entrypoint. The implementation stays in refresh.ts so the
// CLI shell remains tiny and the refresh pipeline can evolve independently.
import './refresh.ts';
