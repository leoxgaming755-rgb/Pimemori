/**
 * Generates an official, high-resolution Pi Memorizer Certificate using HTML5 Canvas.
 */

export interface CertificateData {
  userName: string;
  score: number;
  totalDigits: number;
  accuracy: number;
  date: string;
  milestoneTitle: string;
}

export function generateCertificateDataUrl(data: CertificateData): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Background Luxury Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1100);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1600, 1100);

  // 2. Gold Guilloche / Luxury Borders
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 1520, 1020);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, 1490, 990);

  // Corner decorative marks
  const cornerSize = 40;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;

  // Top-left
  ctx.strokeRect(65, 65, cornerSize, cornerSize);
  // Top-right
  ctx.strokeRect(1600 - 65 - cornerSize, 65, cornerSize, cornerSize);
  // Bottom-left
  ctx.strokeRect(65, 1100 - 65 - cornerSize, cornerSize, cornerSize);
  // Bottom-right
  ctx.strokeRect(1600 - 65 - cornerSize, 1100 - 65 - cornerSize, cornerSize, cornerSize);

  // 3. Mathematical Pi Watermark in Background
  ctx.save();
  ctx.font = 'bold 360px serif';
  ctx.fillStyle = 'rgba(234, 179, 8, 0.03)';
  ctx.textAlign = 'center';
  ctx.fillText('π', 800, 680);
  ctx.restore();

  // 4. Header Badge / Crest
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(800, 150, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 44px serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('π', 800, 165);

  // 5. Certificate Title
  ctx.font = '600 24px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.letterSpacing = '6px';
  ctx.fillText('SERTIFIKAT PENCAPAIAN RESMI', 800, 240);

  ctx.font = 'bold 48px sans-serif';
  const titleGrad = ctx.createLinearGradient(400, 280, 1200, 280);
  titleGrad.addColorStop(0, '#fef08a');
  titleGrad.addColorStop(0.5, '#eab308');
  titleGrad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = titleGrad;
  ctx.fillText('MASTER HAFALAN DIGIT PI', 800, 310);

  // 6. Recipient info
  ctx.font = 'italic 20px sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Dengan bangga dianugerahkan kepada:', 800, 390);

  ctx.font = 'bold 54px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.userName || 'Juara Memori Pi', 800, 460);

  // Decorative underline under name
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(500, 485);
  ctx.lineTo(1100, 485);
  ctx.stroke();

  // 7. Achievement Statement
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(
    'Telah membuktikan kekuatan memori luar biasa dengan berhasil menghafal & menyetorkan:',
    800,
    545
  );

  // Huge Digits Counter Card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
  ctx.lineWidth = 2;
  ctx.roundRect(450, 580, 700, 150, 20);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 80px monospace';
  ctx.fillStyle = '#34d399';
  ctx.fillText(`${data.score}`, 800, 675);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#a7f3d0';
  ctx.fillText(`DARI 1.000 DIGIT DESIMAL PI TANPA KESALAHAN (${data.accuracy}% AKURASI)`, 800, 715);

  // 8. Milestone Badge Label
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`Gelar: ${data.milestoneTitle}`, 800, 790);

  // 9. Bottom Signatures & Seal
  // Left: Date
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('TANGGAL PEMECAHAN REKOR', 160, 920);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(data.date, 160, 955);

  // Center: Official Gold Seal
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(800, 930, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('PI MEMORY', 800, 925);
  ctx.fillText('VERIFIED', 800, 945);
  ctx.restore();

  // Right: Verification ID
  ctx.textAlign = 'right';
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('SISTEM VERIFIKASI', 1440, 920);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('PIMEMORY CLOUD SECURE', 1440, 955);

  return canvas.toDataURL('image/png');
}

export function downloadCertificate(dataUrl: string, filename: string = 'Sertifikat_PiMemory.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
