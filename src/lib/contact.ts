/** A tel: link keeps the leading + and the digits, nothing else. */
export const telHref = (number: string) => `tel:${number.replace(/[^0-9+]/g, "")}`;

/** A WhatsApp chat, opened with the greeting the studio uses on its own link page. */
export function whatsappHref(number: string, studio: string) {
  const text = `Hello ${studio}, I am interested in your architectural and interior design services. I would like to know more about your work. Thank you.`;
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
}

/** The listing id inside a Google Maps place link, as the decimal an embed takes. */
function listingIn(text: string) {
  try {
    const hex = decodeURIComponent(text).match(/0x[0-9a-f]+:0x([0-9a-f]+)/i)?.[1];
    return hex ? BigInt(`0x${hex}`).toString() : null;
  } catch {
    return null;
  }
}

/**
 * The Google listing a Maps link points at, so the map pins the studio itself
 * rather than a guess from the address. A share link is followed once a day.
 */
export async function mapPlaceId(url: string) {
  if (!url) return null;
  const direct = listingIn(url);
  if (direct) return direct;
  try {
    if (!new URL(url).hostname.endsWith("goo.gl")) return null;
    const response = await fetch(url, { redirect: "manual", next: { revalidate: 86400 } });
    return listingIn(response.headers.get("location") ?? "");
  } catch {
    return null;
  }
}

/** A map for an iframe: the listing when there is one, otherwise the address. It needs no key. */
export function mapEmbedSrc(place: string | null, address: string[]) {
  const where = place ? `cid=${place}` : `q=${encodeURIComponent(address.join(", "))}`;
  return `https://maps.google.com/maps?${where}&z=16&output=embed`;
}
