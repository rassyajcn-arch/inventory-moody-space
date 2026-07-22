// Server penyimpanan Moody Space — dipanggil oleh index.html di /.netlify/functions/data
// Menyimpan data (pembelian, penjualan, resep, stok) di Netlify Blobs, dibagi ke semua
// orang yang membuka link. Zero-config: tidak perlu database terpisah.
import { getStore } from '@netlify/blobs';

// consistency: 'strong' -> hasil simpan langsung bisa dibaca lagi (penting untuk sinkron).
const store = () => getStore({ name: 'moody-space', consistency: 'strong' });

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export default async (req) => {
  try {
    const url = new URL(req.url);

    // Baca data: GET ?key=NAMA_KEY  (?key=__ping__ dipakai app untuk cek server hidup)
    if (req.method === 'GET') {
      const key = url.searchParams.get('key');
      if (!key) return json({ error: 'missing key' }, 400);
      if (key === '__ping__') return json({ ok: true });
      const value = await store().get(key); // string atau null
      return json({ key, value: value ?? null });
    }

    // Simpan data: POST { "key": "...", "value": "..." }
    if (req.method === 'POST') {
      const body = await req.json().catch(() => null);
      if (!body || typeof body.key !== 'string') return json({ error: 'missing key' }, 400);
      await store().set(body.key, String(body.value ?? ''));
      return json({ key: body.key, ok: true });
    }

    return json({ error: 'method not allowed' }, 405);
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, 500);
  }
};
