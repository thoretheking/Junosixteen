import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export async function generateCertificatePDF({ userId, fullName, courseId, tier, verifyUrl }) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([700, 500]);

  // Branding
  page.drawText("JunoSixteen Certificate", { x: 40, y: 440, size: 28, color: rgb(0.1, 0.45, 0.7) });
  page.drawText(`${tier.toUpperCase()} Award`, { x: 40, y: 405, size: 18, color: rgb(0.1, 0.45, 0.7) });

  // Inhalt
  page.drawText(`Issued to: ${fullName} (${userId})`, { x: 40, y: 360, size: 14 });
  page.drawText(`Course: ${courseId}`, { x: 40, y: 340, size: 14 });
  page.drawText(`Date: ${new Date().toISOString()}`, { x: 40, y: 320, size: 12 });

  // QR-Code (Verify)
  const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 0, width: 150 });
  const qrImg = await pdf.embedPng(qrPng);
  page.drawImage(qrImg, { x: 520, y: 300, width: 150, height: 150 });

  // Fußzeile
  page.drawText("Scan to verify", { x: 552, y: 280, size: 10, color: rgb(0.2,0.2,0.2) });

  const bytes = await pdf.save();
  return bytes;
}

export function makeCertId({ userId, courseId, tier }) {
  const raw = `${userId}:${courseId}:${tier}:${Date.now()}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 20);
} 