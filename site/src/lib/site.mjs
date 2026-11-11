/** The catalog this build reads (astro.config.mjs puts its folder in __BUILD__), read once for all the pages. */
import { loadCatalog } from './catalog.mjs';

let catalog;

/** @returns {import('./catalog.mjs').Catalog} */
export function getCatalog() {
  catalog ??= loadCatalog(__BUILD__.catalogDir);
  return catalog;
}
