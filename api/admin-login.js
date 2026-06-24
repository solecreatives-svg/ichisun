// /api/admin-login.js
// Vercel serverless function — validates admin credentials server-side
// Set ADMIN_USER and ADMIN_PASS in Vercel Environment Variables

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!ADMIN_PASS) {
    console.error('ADMIN_PASS environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const { user, pass } = req.body;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    // Generate a simple session token
    const token = Buffer.from(`${Date.now()}:${ADMIN_USER}:ichisun`).toString('base64');
    return res.status(200).json({ success: true, token });
  }

  // Add a small delay to prevent brute force
  await new Promise(r => setTimeout(r, 800));
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
}
