import { NextRequest } from 'next/server';

export interface GeoLocationResult {
  ip: string;
  country: string;
  city: string;
  isProxy: boolean;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(s => s.trim());
    return ips[0] || '127.0.0.1';
  }
  const realIp = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function lookupGeoLocation(ip: string): Promise<GeoLocationResult> {
  // Default fallback for localhost or unresolvable IP
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      ip,
      country: 'DZ',
      city: 'Algiers',
      isProxy: false,
    };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,city,proxy,hosting`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Geo API failed');
    const data = await res.json();
    if (data.status !== 'success') throw new Error('Geo lookup invalid');

    return {
      ip,
      country: data.countryCode || 'DZ',
      city: data.city || 'Algiers',
      isProxy: !!(data.proxy || data.hosting),
    };
  } catch (err) {
    console.warn('[GeoIP] Lookup failed for IP:', ip, err);
    return {
      ip,
      country: 'DZ',
      city: 'Unknown',
      isProxy: false,
    };
  }
}
