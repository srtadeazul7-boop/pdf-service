import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/", (req, res) => {
  res.send("PDF Service OK");
});

app.post("/render", async (req, res) => {
  const { html, options } = req.body || {};

  if (typeof html !== "string" || !html.trim()) {
    return res.status(400).json({ error: "Missing 'html' (string) in body" });
  }

  const pdfOptions = {
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    ...(options || {}),
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf(pdfOptions);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="documento.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: "PDF render failed", detail: String(err?.message || err) });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`pdf-service listening on port ${port}`));
