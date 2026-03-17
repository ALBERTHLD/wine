import { getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';

const STORE_NAME = 'wine-cellar-data';

export default async (req) => {
  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = user.id;
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const key = `user-${userId}`;

  if (req.method === 'GET') {
    const data = await store.get(key, { type: 'json' });
    return new Response(JSON.stringify(data || null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'PUT') {
    const body = await req.json();
    await store.setJSON(key, body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
};
