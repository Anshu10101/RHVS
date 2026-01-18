import { memberVerificationQueue } from '../lib/queue-worker';
import { generateCertificate } from '../lib/certificate';
import { generateIDCard } from '../lib/id-card-generator';
import { sendWelcomeEmail } from '../lib/email';
import { executeQuery } from '../lib/database';

const retainCertificateFiles = process.env.RETAIN_CERTIFICATE_FILES !== 'false';

// Process member verification jobs (10 at a time for parallel processing)
memberVerificationQueue.process('process-verification', 10, async (job) => {
  const {
    memberId,
    memberName,
    memberRegNumber,
    email,
    registrationDate,
    profilePhotoPath,
    address,
    language,
    state,
    district,
    adminId,
  } = job.data;

  console.log(`[Worker] Processing verification for member ${memberId} (${memberRegNumber})`);

  let certificatePath: string | null = null;
  let certificateNumber: string | null = null;
  let certificateRecordId: number | null = null;

  try {
    // Generate certificate
    console.log(`[Worker] Generating certificate for ${memberRegNumber}`);
    const certificateResult = await generateCertificate({
      memberId,
      memberName,
      memberRegNumber,
      registrationDate,
      profilePhotoPath,
      language,
    });

    certificatePath = certificateResult.certificatePath;
    certificateNumber = certificateResult.certificateNumber;

    // Save certificate record
    const certificateInsert = await executeQuery(
      `INSERT INTO member_certificates (member_id, certificate_number, certificate_path, generated_by_admin_id)
       VALUES (?, ?, ?, ?)`,
      [memberId, certificateNumber, certificatePath, adminId || null]
    ) as { insertId: number };

    certificateRecordId = certificateInsert.insertId ?? null;
    console.log(`[Worker] ✅ Certificate generated: ${certificateNumber}`);
  } catch (error) {
    console.error(`[Worker] ❌ Certificate generation failed for ${memberRegNumber}:`, error);
    // Continue without certificate
  }

  // Generate ID card
  let idCardPath: string | null = null;
  try {
    console.log(`[Worker] Generating ID card for ${memberRegNumber}`);
    const idCardResult = await generateIDCard({
      memberId,
      memberName,
      memberRegNumber,
      profilePhotoPath,
      address,
      designation: 'Member',
      cardType: 'membership',
      language,
      state,
      district,
    });

    idCardPath = idCardResult.idCardPath;
    console.log(`[Worker] ✅ ID card generated: ${idCardPath}`);
  } catch (error) {
    console.error(`[Worker] ❌ ID card generation failed for ${memberRegNumber}:`, error);
    // Continue without ID card
  }

  // Send email
  let emailSent = false;
  try {
    console.log(`[Worker] Sending email to ${email}`);
    const emailResult = await sendWelcomeEmail(
      email,
      memberName,
      memberRegNumber,
      certificatePath || undefined,
      idCardPath || undefined,
      language
    );

    if (emailResult?.success) {
      emailSent = true;
      console.log(`[Worker] ✅ Email sent to ${email}`);
      
      // Clean up certificate file if not retaining
      if (!retainCertificateFiles && certificateRecordId) {
        await executeQuery(
          'UPDATE member_certificates SET certificate_path = NULL WHERE id = ?',
          [certificateRecordId]
        );
      }
    } else {
      console.error(`[Worker] ❌ Email failed for ${email}:`, emailResult?.error);
    }
  } catch (error) {
    console.error(`[Worker] ❌ Email error for ${email}:`, error);
  }

  // Return actual status - job succeeds even if some parts fail (graceful degradation)
  // Certificate generation is optional, but email sending is critical
  const jobSuccess = emailSent || certificatePath; // Success if email sent OR certificate generated

  return {
    success: jobSuccess,
    memberId,
    memberRegNumber,
    certificateGenerated: !!certificatePath,
    idCardGenerated: !!idCardPath,
    emailSent,
  };
});

// Handle job events
memberVerificationQueue.on('completed', (job, result) => {
  console.log(`[Worker] Job ${job.id} completed:`, result);
});

memberVerificationQueue.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed:`, err);
});

memberVerificationQueue.on('error', (error) => {
  console.error('[Worker] Queue error:', error);
});

console.log('[Worker] Member verification worker started');

