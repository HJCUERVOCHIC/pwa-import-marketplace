export default async function handler(req, res) {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL requerida' });
  }

  const prerenderToken = process.env.PRERENDER_TOKEN;
  
  if (!prerenderToken) {
    console.error('PRERENDER_TOKEN no configurado');
    return res.redirect(302, targetUrl);
  }

  try {
    const prerenderUrl = `https://service.prerender.io/${targetUrl}`;
    
    const response = await fetch(prerenderUrl, {
      headers: {
        'X-Prerender-Token': prerenderToken,
      },
    });

    if (response.ok) {
      const html = await response.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Prerender', 'true');
      return res.status(200).send(html);
    } else {
      console.error('Prerender response:', response.status);
    }
  } catch (error) {
    console.error('Prerender error:', error);
  }

  return res.redirect(302, targetUrl);
}
