// /api/save-order.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DB    = process.env.NOTION_DB || '381d8f396f2680d59dc0e1f8f4c7f65b';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'NOTION_TOKEN environment variable is not set' });
  }

  try {
    const orderData = req.body;

    // First fetch the database schema to get exact property names
    const schemaRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB}`, {
      headers: {
        'Authorization': 'Bearer ' + NOTION_TOKEN,
        'Notion-Version': '2022-06-28',
      }
    });
    const schema = await schemaRes.json();
    const props = schema.properties || {};

    // Helper — only include property if it exists in the database
    function hasProp(name){ return !!props[name]; }

    // Find the title property (there's always exactly one)
    const titleKey = Object.keys(props).find(k => props[k].type === 'title') || 'Order No.';

    const properties = {};

    // Title
    properties[titleKey] = { title: [{ text: { content: orderData.orderNum || '' } }] };

    // Map our data to whatever column names exist in the database
    const textFields = {
      'Name':    orderData.name    || '',
      'Phone':   orderData.phone   || '',
      'Address': orderData.address || '',
      'Items':   orderData.items   || '',
      'Payment': orderData.payment || '',
    };
    Object.entries(textFields).forEach(([k,v]) => {
      if(hasProp(k)) properties[k] = { rich_text: [{ text: { content: v } }] };
    });

    // Email
    if(hasProp('Email')) properties['Email'] = { email: orderData.email || '' };

    // Numbers
    if(hasProp('Subtotal')) properties['Subtotal'] = { number: orderData.subtotal || 0 };
    if(hasProp('Promo'))    properties['Promo']    = { number: orderData.promoAmt || 0 };
    if(hasProp('Total'))    properties['Total']    = { number: orderData.total    || 0 };
    if(hasProp('Order'))    properties['Order']    = { number: orderData.total    || 0 };

    // Date
    if(hasProp('Date')) properties['Date'] = { date: { start: new Date().toISOString().split('T')[0] } };

    // Status
    if(hasProp('Status')) properties['Status'] = { select: { name: 'New' } };

    // Delivery info — try all possible column name variations
    const deliveryText = [orderData.deliveryDate, orderData.deliverySlot].filter(Boolean).join(' · ');
    const deliveryFields = ['Slot', 'Delivery Slot', 'Delivery Date', 'Delivery', 'Schedule', 'Time Slot'];
    for(const f of deliveryFields){
      if(hasProp(f)){ properties[f] = { rich_text: [{ text: { content: deliveryText } }] }; break; }
    }

    const payload = { parent: { database_id: NOTION_DB }, properties };

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
