import fs from 'fs';
import path from 'path';
import jsPDF from 'jspdf';

interface CertificateData {
  memberId: number;
  memberName: string;
  memberRegNumber: string;
  registrationDate: string;
}

interface CertificateResult {
  certificateNumber: string;
  certificatePath: string;
}

export async function generateCertificate(data: CertificateData): Promise<CertificateResult> {
  try {
    // Generate certificate number
    const certificateNumber = `CERT-${data.memberRegNumber}-${Date.now()}`;
    
    // Create certificate directory if it doesn't exist
    const certDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    // Certificate file path
    const certificatePath = `/certificates/${certificateNumber}.pdf`;
    const fullPath = path.join(process.cwd(), 'public', 'certificates', `${certificateNumber}.pdf`);

    // Generate PDF certificate
    const doc = new jsPDF('p', 'mm', 'a4');
    const org = 'राष्ट्रीय हिंदू वाहिनी संगठन';
    const orgEnglish = 'Rashtriya Hindu Vahini Sangathan (RHVS)';

    // Clean white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Add favicon/logo at the top
    const addLogo = () => {
      return new Promise((resolve) => {
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Try multiple logo paths
          const logoPaths = [
            path.join(process.cwd(), 'public', 'rhvs_logo.png'),
            path.join(process.cwd(), 'src', 'app', 'favicon.ico'),
            path.join(process.cwd(), 'public', 'favicon.ico')
          ];
          
          let logoFound = false;
          for (const logoPath of logoPaths) {
            if (fs.existsSync(logoPath)) {
              try {
                // Read the logo file
                const logoBuffer = fs.readFileSync(logoPath);
                const base64 = logoBuffer.toString('base64');
                
                // Determine file type
                let dataUrl;
                if (logoPath.endsWith('.png')) {
                  dataUrl = `data:image/png;base64,${base64}`;
                } else if (logoPath.endsWith('.ico')) {
                  // For ICO files, we'll skip for now as jsPDF doesn't support them well
                  console.log('⚠️ ICO files not supported, skipping logo');
                  resolve(false);
                  return;
                } else {
                  dataUrl = `data:image/png;base64,${base64}`;
                }
                
                // Add image to PDF
                const logoWidth = 30;
                const logoHeight = 30;
                const logoX = (210 - logoWidth) / 2;
                const logoY = 20;
                
                doc.addImage(dataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
                console.log('✅ Logo added to certificate from:', logoPath);
                logoFound = true;
                break;
              } catch (e) {
                console.log('⚠️ Failed to process logo from:', logoPath, e instanceof Error ? e.message : String(e));
                continue;
              }
            }
          }
          
          if (!logoFound) {
            console.log('⚠️ No suitable logo found in any of the paths');
            resolve(false);
          } else {
            resolve(true);
          }
        } catch (e) {
          console.log('❌ Failed to add logo:', e);
          resolve(false);
        }
      });
    };

    // Organization name in English
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(orgEnglish, 105, 85, { align: 'center' });

    // Welcome message
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text('Welcome to our organization!', 105, 100, { align: 'center' });

    // Certificate title
    doc.setTextColor(34, 34, 34);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MEMBERSHIP CERTIFICATE', 105, 120, { align: 'center' });

    // Simple decorative line
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(1);
    doc.line(60, 130, 150, 130);

    // Certificate body - clean and minimal
    const bodyY = 160;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('This certifies that', 105, bodyY, { align: 'center' });

    // Member name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(data.memberName || 'N/A', 105, bodyY + 15, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('is a registered member of', 105, bodyY + 30, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(orgEnglish, 105, bodyY + 45, { align: 'center' });

    // Member details - clean table format
    const startY = bodyY + 70;
    const details = [
      ['Membership Number', data.memberRegNumber || 'N/A'],
      ['Registration Date', new Date(data.registrationDate).toLocaleDateString()],
      ['Certificate Number', certificateNumber],
    ];

    let y = startY;
    details.forEach(([label, value]) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(`${label}:`, 30, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const text = String(value);
      if (text.length > 40) {
        const lines = doc.splitTextToSize(text, 100);
        doc.text(lines, 80, y);
        y += (lines.length - 1) * 5;
      } else {
        doc.text(text, 80, y);
      }
      y += 8;
    });

    // Signature section - clean and minimal
    const sigY = y + 20;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(40, sigY, 100, sigY);
    doc.line(110, sigY, 170, sigY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Secretary', 70, sigY + 8, { align: 'center' });
    doc.text('President', 140, sigY + 8, { align: 'center' });

    // Footer - minimal
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Certificate #${certificateNumber}`, 20, 280);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 285);
    doc.text('Official Membership Certificate', 105, 285, { align: 'center' });

    // Add logo
    await addLogo();

    // Save PDF to file
    const pdfOutput = doc.output('arraybuffer');
    fs.writeFileSync(fullPath, Buffer.from(pdfOutput));

    return {
      certificateNumber,
      certificatePath
    };
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error('Failed to generate certificate');
  }
}

export async function downloadCertificate(certificatePath: string): Promise<Buffer> {
  try {
    const fullPath = path.join(process.cwd(), 'public', certificatePath);
    return fs.readFileSync(fullPath);
  } catch (error) {
    console.error('Error reading certificate:', error);
    throw new Error('Certificate not found');
  }
}
