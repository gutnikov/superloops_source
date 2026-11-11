// /loops/<id>/<image>: a card's image, the card's own file byte for byte, next to the loop's page (SITE-2#3; seam 4
// of tests/site/README.md). The static build writes it as loops/<id>/<image>.
import fs from 'node:fs';
import path from 'node:path';
import { getCatalog } from '../../../lib/site.mjs';

/** The image types loops/loop.schema.json allows; for `astro dev`, since the static build writes only the bytes. */
const TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

export function getStaticPaths() {
  return getCatalog().loopTypes.flatMap((card) =>
    card.image ? [{ params: { id: card.id, image: card.image.file }, props: { source: card.image.source } }] : [],
  );
}

export function GET({ props }: { props: { source: string } }) {
  const type = TYPES[path.extname(props.source).toLowerCase()] ?? 'application/octet-stream';
  return new Response(fs.readFileSync(props.source), { headers: { 'content-type': type } });
}
