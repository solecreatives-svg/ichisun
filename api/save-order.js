// /api/save-order.js
// Vercel serverless function — keeps NOTION_TOKEN off the frontend
// Deploy alongside index.html. Set NOTION_TOKEN in Vercel Environment Variables.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DB    = process.env.NOTION_DB || '381d8f396f2680d59dc0e1f8f4c7f65b';

  if (!NOTION_TOKEN) {
    console.error('NOTION_TOKEN environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration — Notion token missing' });
  }

  try {
    const orderData = req.body;

    const payload = {
      parent: { database_id: NOTION_DB },
      properties: {
        // Title column
        'Order No.':  { title:     [{ text: { content: orderData.orderNum || '' } }] },
        // Text columns
        'Name':       { rich_text: [{ text: { content: orderData.name    || '' } }] },
        'Phone':      { rich_text: [{ text: { content: orderData.phone   || '' } }] },
        'Address':    { rich_text: [{ text: { content: orderData.address || '' } }] },
        'Items':      { rich_text: [{ text: { content: orderData.items   || '' } }] },
        'Payment':    { rich_text: [{ text: { content: orderData.payment || '' } }] },
        // Email column
        'Email':      { email: orderData.email || '' },
        // Number columns
        'Order':      { number: orderData.total    || 0 },
        'Subtotal':   { number: orderData.subtotal || 0 },
        'Promo':      { number: orderData.promoAmt || 0 },
        'Total':      { number: orderData.total    || 0 },
        // Date column
        'Date':       { date: { start: new Date().toISOString().split('T')[0] } },
        // Status select
        'Status':     { select: { name: 'New' } },
        // Slot — combining delivery date + slot into one field
        'Slot':       { rich_text: [{ text: { content: (orderData.deliveryDate || '') + (orderData.deliverySlot ? ' · ' + orderData.deliverySlot : '') } }] },
      }
    };

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization':  'Bearer ' + NOTION_TOKEN,
        'Content-Type':   'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(payload),
    });

    const data = await notionRes.json();

    if (!notionRes.ok) {
      console.error('Notion API error:', JSON.stringify(data));
      return res.status(502).json({ error: 'Notion API error', details: data });
    }

    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error('save-order error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
