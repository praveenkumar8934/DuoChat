import jsPDF from 'jspdf';
import { MessageWithDetails } from '@/types/database';

export interface ExportPdfOptions {
  partnerName: string;
  partnerUsername?: string | null;
  currentUserId: string;
  currentUserName: string;
  messages: MessageWithDetails[];
  daysTogether?: number | null;
}

export function generateChatPdf({
  partnerName,
  partnerUsername,
  currentUserId,
  currentUserName,
  messages,
  daysTogether,
}: ExportPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const marginBottom = 22;

  let y = 18;

  // 1. Title Banner
  doc.setFillColor(225, 29, 72); // Rose 600
  doc.roundedRect(marginX, y, contentWidth, 22, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DuoChat', marginX + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Private Romantic Sanctuary - Conversation Export', marginX + 6, y + 16);

  y += 28;

  // 2. Metadata Information Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(marginX, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.setFont('helvetica', 'bold');
  doc.text('Conversation With:', marginX + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  const partnerLabel = partnerUsername ? `${partnerName} (@${partnerUsername})` : partnerName;
  doc.text(partnerLabel, marginX + 38, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Exported On:', marginX + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleString(), marginX + 38, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Messages:', marginX + 4, y + 18);
  doc.setFont('helvetica', 'normal');
  const stats = daysTogether !== null && daysTogether !== undefined
    ? `${messages.length} messages (Day ${daysTogether} together)`
    : `${messages.length} messages`;
  doc.text(stats, marginX + 38, y + 18);

  y += 30;

  // Check if no messages
  if (messages.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('No messages recorded in this conversation yet.', marginX, y + 10);
    return doc;
  }

  // 3. Render Messages
  messages.forEach((msg) => {
    const isMe = msg.sender_id === currentUserId;
    const senderTitle = isMe ? `${currentUserName} (You)` : partnerName;
    const dateStr = new Date(msg.created_at).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let rawBody = (msg.body || '').trim();
    if (msg.original_filename) {
      const fileNotice = `[Attachment: ${msg.original_filename}]`;
      rawBody = rawBody ? `${rawBody}\n${fileNotice}` : fileNotice;
    }
    if (!rawBody) {
      rawBody = '[Empty message]';
    }

    doc.setFontSize(9);
    const splitLines = doc.splitTextToSize(rawBody, contentWidth - 8);
    const textBlockHeight = splitLines.length * 4.5;
    const entryHeight = 6 + textBlockHeight + 3; // header line + text lines + padding

    // Page break check
    if (y + entryHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = 18;
    }

    // Message Card Background
    if (isMe) {
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.setDrawColor(226, 232, 240);
    } else {
      doc.setFillColor(255, 241, 242); // Rose 50
      doc.setDrawColor(254, 205, 211); // Rose 200
    }
    doc.roundedRect(marginX, y, contentWidth, entryHeight, 1.5, 1.5, 'FD');

    // Sender Label
    if (isMe) {
      doc.setTextColor(71, 85, 105); // Slate 600
    } else {
      doc.setTextColor(225, 29, 72); // Rose 600
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(senderTitle, marginX + 3.5, y + 4.5);

    // Timestamp
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const timeWidth = doc.getTextWidth(dateStr);
    doc.text(dateStr, marginX + contentWidth - timeWidth - 3.5, y + 4.5);

    // Message text
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFontSize(8.5);
    doc.text(splitLines, marginX + 3.5, y + 9);

    y += entryHeight + 2.5;
  });

  // 4. Add Page Numbers and Footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');

    // Left footer
    doc.text('DuoChat - Just us, in our own little world.', marginX, pageHeight - 10);

    // Right footer (page X of Y)
    const pageStr = `Page ${i} of ${totalPages}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - marginX - pageStrWidth, pageHeight - 10);
  }

  return doc;
}

export function downloadChatPdf(options: ExportPdfOptions): string {
  const doc = generateChatPdf(options);
  const cleanPartner = options.partnerName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Partner';
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `DuoChat_${cleanPartner}_${dateStr}.pdf`;
  doc.save(filename);
  return filename;
}
