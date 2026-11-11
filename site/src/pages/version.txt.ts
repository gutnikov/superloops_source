// /version.txt: one line, the short hash of the commit the site is built from (the SiteVersion read model).
export function GET() {
  return new Response(`${__BUILD__.version}\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
