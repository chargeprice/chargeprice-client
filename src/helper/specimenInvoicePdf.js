// VISUAL MOCKUP ONLY: builds a SPECIMEN invoice as a PDF, in the browser, without any library.
// It previews the "download your invoices" feature of the account panel. The PDF is clearly
// marked as a specimen and is not a valid invoice. Seller details: Chargeprice SAS, as in Stripe.

const SELLER = {
  name: "Chargeprice SAS",
  lines: ["26 Rue des Coteaux", "50870 Tirepied-sur-Sée", "France"],
  web: "www.chargeprice.net"
};

const BLUE = [0, 122 / 255, 1];
const DARK = [0.11, 0.12, 0.14];
const GREY = [0.42, 0.45, 0.5];
const LIGHT = [0.93, 0.95, 0.97];

// PDF strings: Latin-1 (WinAnsi) bytes, with ( ) \ escaped. Other characters become "?".
function pdfText(value) {
  let out = "";
  for (const ch of String(value)) {
    const code = ch.charCodeAt(0);
    if (ch === "(" || ch === ")" || ch === "\\") out += "\\" + ch;
    else if (code === 0x20ac) out += "\\200"; // €
    else if (code < 32) out += " ";
    else if (code < 128) out += ch;
    else if (code < 256) out += "\\" + code.toString(8).padStart(3, "0");
    else out += "?";
  }
  return out;
}

// Approximate Helvetica width (points) to right-align amounts
function textWidth(value, size) {
  return String(value).length * size * 0.52;
}

class Page {
  constructor() { this.ops = []; }
  color(rgb, stroke = false) { this.ops.push(`${rgb.map(v => v.toFixed(3)).join(" ")} ${stroke ? "RG" : "rg"}`); return this; }
  rect(x, y, w, h, rgb) { this.color(rgb); this.ops.push(`${x} ${y} ${w} ${h} re f`); return this; }
  line(x1, y1, x2, y2, rgb, width = 0.6) { this.color(rgb, true); this.ops.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`); return this; }
  text(x, y, value, { size = 10, bold = false, rgb = DARK, align = "left" } = {}) {
    const dx = align === "right" ? x - textWidth(value, size) : x;
    this.color(rgb);
    this.ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${dx.toFixed(1)} ${y} Td (${pdfText(value)}) Tj ET`);
    return this;
  }
  // Big rotated watermark
  watermark(value) {
    this.ops.push("q", "0.86 0.20 0.20 rg", "/GS1 gs");
    this.ops.push(`BT /F2 96 Tf 0.819 0.574 -0.574 0.819 120 250 Tm (${pdfText(value)}) Tj ET`, "Q");
    return this;
  }
}

function buildPdf(page) {
  const content = page.ops.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /ExtGState << /GS1 7 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    "<< /Type /ExtGState /ca 0.12 >>"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(o => { pdf += `${String(o).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  // Only Latin-1 characters remain (escaped above), one byte per character
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}

// invoice: { number, date, period, amount (TTC, number), customerName, customerEmail }
export function buildSpecimenInvoice(invoice, labels) {
  const p = new Page();
  const net = Math.round(invoice.amount / 1.2 * 100) / 100;
  const vat = Math.round((invoice.amount - net) * 100) / 100;
  const eur = v => `${v.toFixed(2)} €`;

  p.watermark("SPECIMEN");

  // Header band
  p.rect(0, 762, 595, 80, BLUE);
  p.text(48, 800, "CHARGEPRICE", { size: 22, bold: true, rgb: [1, 1, 1] });
  p.text(48, 782, SELLER.web, { size: 9, rgb: [0.85, 0.92, 1] });
  p.text(547, 800, labels.invoice.toUpperCase(), { size: 18, bold: true, rgb: [1, 1, 1], align: "right" });
  p.text(547, 782, invoice.number, { size: 10, rgb: [1, 1, 1], align: "right" });

  // Specimen notice
  p.rect(48, 722, 499, 26, [1, 0.95, 0.88]);
  p.text(58, 731, labels.specimenNotice, { size: 9, bold: true, rgb: [0.71, 0.37, 0.02] });

  // Seller / customer
  p.text(48, 690, labels.from, { size: 8, bold: true, rgb: GREY });
  p.text(48, 674, SELLER.name, { size: 11, bold: true });
  SELLER.lines.forEach((l, i) => p.text(48, 660 - i * 13, l, { size: 10 }));

  p.text(320, 690, labels.billedTo, { size: 8, bold: true, rgb: GREY });
  p.text(320, 674, invoice.customerName || "-", { size: 11, bold: true });
  p.text(320, 660, invoice.customerEmail || "", { size: 10 });

  // Dates
  p.text(48, 600, labels.date, { size: 8, bold: true, rgb: GREY });
  p.text(48, 586, invoice.date, { size: 10 });
  p.text(200, 600, labels.period, { size: 8, bold: true, rgb: GREY });
  p.text(200, 586, invoice.period, { size: 10 });
  p.text(400, 600, labels.status, { size: 8, bold: true, rgb: GREY });
  p.text(400, 586, labels.paid, { size: 10, bold: true, rgb: [0.07, 0.47, 0.31] });

  // Line items
  p.rect(48, 536, 499, 22, LIGHT);
  p.text(58, 543, labels.description, { size: 9, bold: true, rgb: GREY });
  p.text(537, 543, labels.amount, { size: 9, bold: true, rgb: GREY, align: "right" });
  p.text(58, 512, labels.item, { size: 10 });
  p.text(537, 512, eur(net), { size: 10, align: "right" });
  p.line(48, 498, 547, 498, LIGHT);

  // Totals
  p.text(400, 476, labels.net, { size: 10, rgb: GREY });
  p.text(537, 476, eur(net), { size: 10, align: "right" });
  p.text(400, 458, labels.vat, { size: 10, rgb: GREY });
  p.text(537, 458, eur(vat), { size: 10, align: "right" });
  p.line(400, 446, 547, 446, GREY);
  p.text(400, 428, labels.total, { size: 12, bold: true });
  p.text(537, 428, eur(invoice.amount), { size: 12, bold: true, rgb: BLUE, align: "right" });

  // Footer
  p.line(48, 90, 547, 90, LIGHT);
  p.text(48, 72, `${SELLER.name} - ${SELLER.lines.join(", ")}`, { size: 8, rgb: GREY });
  p.text(48, 58, labels.footer, { size: 8, bold: true, rgb: [0.71, 0.37, 0.02] });

  return buildPdf(p);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
