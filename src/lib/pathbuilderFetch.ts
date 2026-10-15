/** Fetches a Pathbuilder export by the id shown after "Export JSON" in Pathbuilder. */

export const PATHBUILDER_ID = /^\d{4,8}$/;

export const pathbuilderUrl = (id: string): string => `https://pathbuilder2e.com/json.php?id=${encodeURIComponent(id)}`;

/**
 * Returns the parsed JSON, or throws with a message that points at the paste fallback. The site sits
 * behind Cloudflare, so a cross-origin fetch may be blocked; the caller must always offer pasting.
 */
export const fetchPathbuilderExport = async (id: string, fetchFn: typeof fetch = fetch): Promise<unknown> => {
  if (!PATHBUILDER_ID.test(id)) throw new Error('Enter the numeric export id shown in Pathbuilder.');
  let response: Response;
  try {
    response = await fetchFn(pathbuilderUrl(id), { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error('Could not reach pathbuilder2e.com from the browser – paste the JSON instead.');
  }
  if (!response.ok) throw new Error(`Pathbuilder answered ${response.status} – paste the JSON instead.`);
  try {
    return await response.json();
  } catch {
    throw new Error('Pathbuilder did not return JSON (the request may have been blocked) – paste the JSON instead.');
  }
};
