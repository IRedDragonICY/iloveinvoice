import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import type { Invoice, Company } from '@/lib/types';

export async function exportInvoiceToPDF(
  sourceNode: HTMLElement,
  invoice: Invoice,
  company: Company,
  action: "save" | "print" = "save"
) {
  const scale = Math.min(2, window.devicePixelRatio || 1);
  const canvas = await html2canvas(sourceNode, {
    backgroundColor: "#ffffff",
    scale,
    useCORS: true,
    logging: false,
    removeContainer: true,
    scrollY: 0,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  pdf.setProperties({
    title: `Invoice ${invoice.number}`,
    subject: "ILoveInvoice PDF",
    author: company.name || "ILoveInvoice",
    creator: "ILoveInvoice",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
    heightLeft -= pageHeight;
  }

  if (action === "save") {
    pdf.save(`${invoice.number}.pdf`);
  } else {
    // Enable auto-print if available (jsPDF extension)
    if ('autoPrint' in pdf && typeof pdf.autoPrint === 'function') {
      pdf.autoPrint();
    }
    const blobUrl = pdf.output("bloburl");
    window.open(blobUrl, "_blank");
  }
}
