import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : process.cwd());
const __dirname = path.dirname(__filename);

interface ClonedProject {
  id: string;
  title: string;
  originalUrl?: string;
  html: string;
  customCss: string;
  customJs: string;
  pixels: {
    facebookPixelId?: string;
    googleAnalyticsId?: string;
    tiktokPixelId?: string;
    kwaiPixelId?: string;
    headScripts?: string;
    bodyScripts?: string;
  };
  globalCheckoutLink?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for cloned projects (can also persist to local storage on client)
const projectsStore: Record<string, ClonedProject> = {};

// Helper sample templates if user wants to test without external URL
const SAMPLE_TEMPLATES: Record<string, { title: string; html: string; description: string }> = {
  vsl: {
    title: "Página VSL Alta Conversão (Vídeo de Vendas)",
    description: "Template clássico de página de vendas com VSL no topo, cronômetro e botão CTA dinâmico.",
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Método Secreto de Alta Conversão</title>
  <style>
    :root { --primary: #2563eb; --accent: #dc2626; --bg: #0f172a; --text: #f8fafc; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; margin: 0; padding: 0; line-height: 1.6; }
    .top-banner { background: #dc2626; color: white; text-align: center; padding: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; text-align: center; }
    .headline { font-size: 32px; font-weight: 800; color: #ffffff; margin-top: 15px; margin-bottom: 10px; line-height: 1.3; }
    .headline span { color: #f59e0b; }
    .subheadline { font-size: 18px; color: #94a3b8; margin-bottom: 25px; }
    .video-box { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #1e293b; border-radius: 12px; border: 2px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
    .video-box iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
    .cta-container { margin-top: 35px; background: #1e293b; border: 1px solid #334155; padding: 30px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .timer { font-size: 24px; font-weight: bold; color: #ef4444; margin-bottom: 15px; background: rgba(239, 68, 68, 0.1); display: inline-block; padding: 8px 20px; border-radius: 30px; border: 1px solid rgba(239, 68, 68, 0.3); }
    .btn-cta { display: inline-block; width: 100%; max-width: 500px; padding: 20px 30px; font-size: 22px; font-weight: 900; text-transform: uppercase; color: #ffffff; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; text-decoration: none; box-shadow: 0 10px 20px rgba(34, 197, 94, 0.4); transition: transform 0.2s; border: none; cursor: pointer; }
    .btn-cta:hover { transform: scale(1.03); }
    .guarantee-box { display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 25px; color: #cbd5e1; font-size: 14px; }
    .guarantee-icon { font-size: 36px; }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 40px; text-align: left; }
    .feature-card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
    .feature-card h3 { color: #38bdf8; margin-top: 0; }
    footer { margin-top: 50px; padding: 20px; text-align: center; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="top-banner">⚠️ ATENÇÃO: Esta apresentação sairá do ar hoje à meia-noite</div>
  <div class="container">
    <h1 class="headline">Descubra o <span>Segredo Prático</span> para Triplicar Suas Vendas Sem Gastar Fortunas</h1>
    <p class="subheadline">Assista ao vídeo rápido abaixo antes que este conteúdo exclusivo seja removido da internet.</p>
    
    <div class="video-box">
      <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0" title="VSL Video" allowfullscreen></iframe>
    </div>

    <div class="cta-container">
      <div class="timer">⏰ Oferta por Tempo Limitado: <span id="countdown">14:59</span></div>
      <p style="font-size: 18px; color: #e2e8f0; margin-bottom: 20px;">De <s style="color:#ef4444;">R$ 297,00</s> por apenas <strong>R$ 47,00</strong> em até 12x no cartão!</p>
      <a href="https://pay.hotmart.com/checkout-exemplo" class="btn-cta" id="main-checkout-btn">
        🚀 QUERO GARANTIR MINHA VAGA AGORA
      </a>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">🔒 Pagamento 100% Seguro • Acesso Imediato no E-mail</p>
      
      <div class="guarantee-box">
        <div class="guarantee-icon">🛡️</div>
        <div style="text-align: left;">
          <strong>Garantia Incondicional de 7 Dias</strong><br/>
          Se você não gostar do conteúdo, devolvemos 100% do seu dinheiro sem perguntas.
        </div>
      </div>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <h3>⚡ Acesso Instantâneo</h3>
        <p>Receba seus dados de acesso imediatamente no e-mail após a confirmação do pagamento.</p>
      </div>
      <div class="feature-card">
        <h3>📱 100% Online</h3>
        <p>Assista de qualquer lugar, no celular, tablet ou computador na hora que quiser.</p>
      </div>
      <div class="feature-card">
        <h3>🎁 Bônus Exclusivos</h3>
        <p>Garantindo hoje você leva mais 3 guias em PDF de estratégias aceleradas.</p>
      </div>
    </div>

    <footer>
      <p>© 2026 Todos os Direitos Reservados. Este site não é afiliado ao Facebook nem ao Google.</p>
      <p><a href="#" style="color: #64748b;">Termos de Uso</a> | <a href="#" style="color: #64748b;">Políticas de Privacidade</a></p>
    </footer>
  </div>
</body>
</html>`
  },
  ebook: {
    title: "Página de Produto Digital / E-book",
    description: "Template para infoprodutos, e-books e treinamentos com mocap de capa e lista de benefícios.",
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>O Guia Definitivo do Tráfego Pago</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .header { background: #0f172a; color: white; padding: 60px 20px; text-align: center; }
    .header h1 { font-size: 38px; margin: 0 0 15px 0; color: #38bdf8; }
    .header p { font-size: 20px; max-width: 700px; margin: 0 auto; color: #cbd5e1; }
    .main-section { max-width: 1000px; margin: -40px auto 40px auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); display: flex; flex-wrap: wrap; gap: 40px; align-items: center; }
    .book-cover { flex: 1; min-width: 280px; text-align: center; }
    .book-cover img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
    .book-info { flex: 1.3; min-width: 300px; }
    .price-tag { font-size: 32px; font-weight: bold; color: #16a34a; margin: 20px 0; }
    .price-tag span { font-size: 16px; color: #64748b; text-decoration: line-through; }
    .btn-buy { display: block; text-align: center; background: #2563eb; color: white; padding: 18px 30px; border-radius: 10px; font-size: 20px; font-weight: bold; text-decoration: none; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3); }
    .btn-buy:hover { background: #1d4ed8; }
    .bullets { margin: 25px 0; padding-left: 20px; }
    .bullets li { margin-bottom: 10px; font-size: 16px; }
    .footer { text-align: center; padding: 30px; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Transforme Seus Anúncios em uma Máquina de Lucro</h1>
    <p>Aprenda o passo a passo validado por especialistas para escalar campanhas de anúncios com ROI garantido.</p>
  </div>
  <div class="main-section">
    <div class="book-cover">
      <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80" alt="Capa do E-book" />
    </div>
    <div class="book-info">
      <h2 style="font-size: 26px; margin-top: 0;">O Que Você Vai Aprender Nesse E-book:</h2>
      <ul class="bullets">
        <li>✅ Como criar criativos altamente persuasivos que chamam atenção</li>
        <li>✅ Estrutura de campanhas para testar públicos pagando pouco</li>
        <li>✅ Estratégias de retargeting para recuperar quem não comprou</li>
        <li>✅ Planilha bônus de cálculo de ROI e custo por aquisição</li>
      </ul>
      <div class="price-tag">
        <span>De R$ 197,00</span> Por Apenas R$ 29,90
      </div>
      <a href="https://pay.kiwify.com.br/exemplo" class="btn-buy">
        👉 QUERO BAIXAR MEU E-BOOK AGORA
      </a>
    </div>
  </div>
  <div class="footer">
    <p>© 2026 Direitos Reservados • Termos e Condições</p>
  </div>
</body>
</html>`
  }
};

// Helper function to compile final standalone HTML with all assets, pixels, and scripts
export function compileFinalHtml(project: ClonedProject): string {
  let finalHtml = project.html || '';
  if (!finalHtml) return '';

  const $ = cheerio.load(finalHtml);

  // Apply global checkout link if defined
  if (project.globalCheckoutLink) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (
        href.includes('hotmart') || 
        href.includes('kiwify') || 
        href.includes('eduzz') || 
        href.includes('monetizze') || 
        href.includes('braip') || 
        href.includes('checkout') || 
        href.includes('pay') || 
        $(el).attr('id')?.includes('checkout') ||
        $(el).attr('class')?.includes('cta') ||
        $(el).attr('class')?.includes('buy')
      ) {
        $(el).attr('href', project.globalCheckoutLink);
      }
    });
  }

  // Inject custom CSS
  if (project.customCss) {
    $('head').append(`<style>${project.customCss}</style>`);
  }

  // Inject Facebook Pixel
  if (project.pixels?.facebookPixelId) {
    const fbPixelScript = `
      <!-- Meta Facebook Pixel -->
      <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${project.pixels.facebookPixelId}');
      fbq('track', 'PageView');
      </script>
      <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${project.pixels.facebookPixelId}&ev=PageView&noscript=1"/></noscript>
      <!-- End Meta Facebook Pixel -->
    `;
    $('head').append(fbPixelScript);
  }

  // Inject Google Analytics
  if (project.pixels?.googleAnalyticsId) {
    const gaScript = `
      <!-- Google tag (gtag.js) -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=${project.pixels.googleAnalyticsId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${project.pixels.googleAnalyticsId}');
      </script>
    `;
    $('head').append(gaScript);
  }

  // Inject TikTok Pixel
  if (project.pixels?.tiktokPixelId) {
    const ttScript = `
      <!-- TikTok Pixel Code -->
      <script>
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","addConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var e=0;e<ttq.methods.length;e++)ttq.setAndDefer(ttq,ttq.methods[e]);ttq.instance=function(t){for(var e=ttq.methods[e],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${project.pixels.tiktokPixelId}');
        ttq.page();
      }(window, document, 'ttq');
      </script>
    `;
    $('head').append(ttScript);
  }

  // Inject Kwai Pixel
  if (project.pixels?.kwaiPixelId) {
    const kwaiScript = `
      <!-- Kwai Pixel Code -->
      <script>
      !function(e,t){var n=e.kwaiq=e.kwaiq||[];n.methods=["page","track","identify"];n.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);n.push(e);return n}};for(var i=0;i<n.methods.length;i++){var o=n.methods[i];n[o]=n.factory(o)}n.load=function(e){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://s1.kwai.com/e-business/pixel/kwaiq.js";var i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(t,i)};
      n.load('${project.pixels.kwaiPixelId}');
      n.page();
      }(window,document);
      </script>
    `;
    $('head').append(kwaiScript);
  }

  if (project.pixels?.headScripts) {
    $('head').append(project.pixels.headScripts);
  }

  if (project.pixels?.bodyScripts) {
    $('body').append(project.pixels.bodyScripts);
  }

  if (project.customJs) {
    $('body').append(`<script>${project.customJs}</script>`);
  }

  return $.html();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes

  // 1. Get sample templates
  app.get('/api/templates', (req: Request, res: Response) => {
    res.json({ success: true, templates: SAMPLE_TEMPLATES });
  });

  // 2. Clone page from URL
  app.post('/api/clone-url', async (req: Request, res: Response) => {
    try {
      const { targetUrl } = req.body;
      if (!targetUrl) {
        return res.status(400).json({ error: 'URL do site é obrigatória.' });
      }

      let parsedUrl: URL;
      try {
        let formatted = targetUrl.trim();
        if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
          formatted = 'https://' + formatted;
        }
        parsedUrl = new URL(formatted);
      } catch {
        return res.status(400).json({ error: 'URL inválida. Verifique o endereço fornecido.' });
      }

      console.log(`Cloning URL: ${parsedUrl.toString()}`);

      // Fetch the page with browser spoof headers
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Não foi possível carregar a página (${response.status} ${response.statusText}). Tente fornecer o HTML diretamente ou escolha um modelo.`
        });
      }

      const rawHtml = await response.text();
      const $ = cheerio.load(rawHtml);

      const baseUrl = parsedUrl.href;

      if ($('base').length === 0) {
        $('head').prepend(`<base href="${baseUrl}">`);
      }

      // Extract page metadata
      const pageTitle = $('title').text().trim() || parsedUrl.hostname;
      const linksCount = $('a').length;
      const imagesCount = $('img').length;
      const formsCount = $('form').length;

      // Make relative links, images, styles, and scripts absolute
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('javascript:') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          try {
            $(el).attr('href', new URL(href, baseUrl).toString());
            $(el).attr('data-original-href', href);
          } catch (e) {
            // ignore
          }
        }
      });

      $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
          try {
            $(el).attr('src', new URL(src, baseUrl).toString());
          } catch (e) {
            // ignore
          }
        }
        const srcset = $(el).attr('srcset');
        if (srcset) {
          try {
            const newSrcset = srcset.split(',').map(part => {
              const trimmed = part.trim();
              const [urlStr, size] = trimmed.split(/\s+/);
              if (urlStr && !urlStr.startsWith('http://') && !urlStr.startsWith('https://') && !urlStr.startsWith('data:')) {
                const absUrl = new URL(urlStr, baseUrl).toString();
                return size ? `${absUrl} ${size}` : absUrl;
              }
              return trimmed;
            }).join(', ');
            $(el).attr('srcset', newSrcset);
          } catch (e) {
            // ignore
          }
        }
      });

      $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('data:')) {
          try {
            $(el).attr('href', new URL(href, baseUrl).toString());
          } catch (e) {
            // ignore
          }
        }
      });

      $('script').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
          try {
            $(el).attr('src', new URL(src, baseUrl).toString());
          } catch (e) {
            // ignore
          }
        }

        const content = $(el).html() || '';
        if (content.includes('top.location') || content.includes('parent.location') || content.includes('window.location.replace')) {
          $(el).text('/* Anti-framebuster disabled by ClonadorPro */');
        }
      });

      const processedHtml = $.html();

      const projectId = 'proj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newProject: ClonedProject = {
        id: projectId,
        title: pageTitle,
        originalUrl: parsedUrl.toString(),
        html: processedHtml,
        customCss: '',
        customJs: '',
        pixels: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      projectsStore[projectId] = newProject;

      return res.json({
        success: true,
        projectId,
        project: newProject,
        stats: {
          title: pageTitle,
          linksCount,
          imagesCount,
          formsCount,
        }
      });

    } catch (err: any) {
      console.error('Error in /api/clone-url:', err);
      return res.status(500).json({ error: 'Erro ao clonar a página: ' + (err.message || 'Erro de conexão') });
    }
  });

  // 3. Save / Update Project
  app.post('/api/projects/save', (req: Request, res: Response) => {
    try {
      const { id, title, html, customCss, customJs, pixels, globalCheckoutLink, originalUrl } = req.body;
      const projectId = id || 'proj_' + Date.now().toString(36);

      const existing: Partial<ClonedProject> = projectsStore[projectId] || {};
      const updatedProject: ClonedProject = {
        id: projectId,
        title: title || existing.title || 'Página Clonada',
        originalUrl: originalUrl || existing.originalUrl,
        html: html || existing.html || '',
        customCss: customCss !== undefined ? customCss : existing.customCss || '',
        customJs: customJs !== undefined ? customJs : existing.customJs || '',
        pixels: pixels || existing.pixels || {},
        globalCheckoutLink: globalCheckoutLink !== undefined ? globalCheckoutLink : existing.globalCheckoutLink,
        createdAt: existing.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      projectsStore[projectId] = updatedProject;
      const compiledHtml = compileFinalHtml(updatedProject);

      res.json({ success: true, projectId, project: updatedProject, compiledHtml });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao salvar projeto: ' + err.message });
    }
  });

  // 4. Get Project
  app.get('/api/projects/:id', (req: Request, res: Response) => {
    const project = projectsStore[req.params.id];
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }
    const compiledHtml = compileFinalHtml(project);
    res.json({ success: true, project, compiledHtml });
  });

  // 5. Render Public Hosted Preview
  app.get('/api/preview/:id', (req: Request, res: Response) => {
    const project = projectsStore[req.params.id];
    if (!project) {
      return res.status(404).send('<h1>404 - Página não encontrada</h1>');
    }

    const compiled = compileFinalHtml(project);
    res.setHeader('Content-Type', 'text/html');
    res.send(compiled);
  });

  // 5b. Download Standalone HTML File endpoint
  app.get('/api/projects/:id/download', (req: Request, res: Response) => {
    const project = projectsStore[req.params.id];
    if (!project) {
      return res.status(404).send('Projeto não encontrado');
    }

    const compiled = compileFinalHtml(project);
    const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'pagina-clonada'}.html`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(compiled);
  });

  // 6. Gemini AI Assistant for Copywriting
  app.post('/api/ai/optimize-copy', async (req: Request, res: Response) => {
    try {
      const { text, type, niche } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({
          error: 'Chave GEMINI_API_KEY não configurada. Defina no arquivo .env.example ou no painel de Segredos.'
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      let prompt = '';
      if (type === 'headline') {
        prompt = `Você é um especialista em copywriting de alta conversão para o mercado brasileiro (marketing digital, infoprodutos, e-commerce).
Reescreva e melhore a seguinte headline para uma página de vendas, tornando-a extremamente persuasiva, chamativa e focada em curiosidade ou dor/desejo do cliente:
Texto Original: "${text}"
Nicho: ${niche || 'Geral'}

Forneça 3 variações curtas e impactantes em formato JSON: ["var1", "var2", "var3"]. Responda APENAS com o JSON válido.`;
      } else if (type === 'cta') {
        prompt = `Você é um copywriter de tráfego pago. Crie 3 opções de textos altamente persuasivos para BOTÃO DE CHECKOUT (CTA) que aumentem o clique.
Texto atual: "${text}"
Nicho: ${niche || 'Geral'}

Forneça 3 variações em formato JSON: ["var1", "var2", "var3"]. Responda APENAS com o JSON válido.`;
      } else {
        prompt = `Reescreva e otimize o seguinte texto de venda para torná-lo mais persuasivo e direto:
"${text}"
Forneça 3 variações em formato JSON: ["var1", "var2", "var3"]. Responda APENAS com o JSON válido.`;
      }

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = aiResponse.text || '';
      // Parse JSON from output
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      try {
        const suggestions = JSON.parse(cleanJson);
        return res.json({ success: true, suggestions });
      } catch (e) {
        return res.json({
          success: true,
          suggestions: [
            `🚀 ${text} - Oferta Especial Hoje!`,
            `🔥 Descubra o Método para ${text}`,
            `⚡ [ÚLTIMAS VAGAS] ${text}`
          ]
        });
      }
    } catch (err: any) {
      console.error('Error in /api/ai/optimize-copy:', err);
      res.status(500).json({ error: 'Erro ao gerar copy com IA: ' + err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom', // Use 'custom' to disable Vite's built-in SPA HTML fallback
    });

    // Only forward non-API requests to Vite middleware
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        // Skip vite for API routes — let Express 404 handler run naturally
        return next();
      }
      vite.middlewares(req, res, next);
    });

    // SPA fallback: serve index.html for all non-API routes (React router support)
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      try {
        const { readFileSync } = await import('fs');
        const { resolve } = await import('path');
        let html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).setHeader('Content-Type', 'text/html').end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }


  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
