import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { z } from 'zod';
import { generateAppointmentCertificate } from '@/lib/certificate-generator';
import { sendCertificateEmail } from '@/lib/email-service';

const generateCertificateSchema = z.object({
  member_id: z.number().int().positive(),
  department_id: z.number().int().positive(),
  post_id: z.number().int().positive(),
  level: z.enum(['national', 'state', 'district']),
  state: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  appointment_date: z.string().optional(), // ISO date string
});

export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Superadmin access required' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = generateCertificateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.format()
      }, { status: 400 });
    }

    const { member_id, department_id, post_id, level, state, district, appointment_date } = validationResult.data;

    // Validate member exists
    const member = await executeQuery(
      'SELECT * FROM members WHERE id = ? AND status = "verified"',
      [member_id]
    ) as any[];

    if (member.length === 0) {
      return NextResponse.json({ error: 'Member not found or not verified' }, { status: 404 });
    }

    // Validate department and post exist
    const departmentPost = await executeQuery(`
      SELECT d.name_en as dept_name_en, d.name_hi as dept_name_hi,
             dp.name_en as post_name_en, dp.name_hi as post_name_hi
      FROM departments d
      JOIN department_posts dp ON d.id = dp.department_id
      WHERE d.id = ? AND dp.id = ?
    `, [department_id, post_id]) as any[];

    if (departmentPost.length === 0) {
      return NextResponse.json({ error: 'Department or post not found' }, { status: 404 });
    }

    // Check if certificate already exists for this exact assignment
    const existingCertificate = await executeQuery(`
      SELECT * FROM certificates 
      WHERE member_id = ? 
      AND department_id = ? 
      AND post_id = ? 
      AND level = ?
      AND (
        (level = 'national')
        OR (level = 'state' AND state = ?)
        OR (level = 'district' AND state = ? AND district = ?)
      )
    `, [
      member_id, department_id, post_id, level,
      state || null,
      state || null,
      district || null
    ]) as any[];

    if (existingCertificate.length > 0) {
      // If certificate exists but is old (more than a day), allow regeneration
      const certDate = new Date(existingCertificate[0].generated_at);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      if (certDate > oneDayAgo) {
        return NextResponse.json({ 
          error: 'Certificate was recently generated for this assignment',
          certificate_id: existingCertificate[0].id,
          certificate_path: existingCertificate[0].certificate_path
        }, { status: 409 });
      } else {
        // Delete old certificate and continue with new generation
        await executeQuery('DELETE FROM certificates WHERE id = ?', [existingCertificate[0].id]);
      }
    }

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Generate certificate
    const certificateData = {
      member: member[0],
      department: departmentPost[0],
      level,
      state,
      district,
      appointment_date: appointment_date || new Date().toISOString().split('T')[0],
      certificate_number: certificateNumber
    };

    const certificatePath = await generateAppointmentCertificate(certificateData);

    // Save certificate record
    const result = await executeQuery(`
      INSERT INTO certificates 
      (member_id, department_id, post_id, level, state, district, certificate_number, appointment_date, generated_by, certificate_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      member_id, department_id, post_id, level, state, district, 
      certificateNumber, appointment_date || new Date().toISOString().split('T')[0],
      scope.adminId, certificatePath
    ]) as any;

    // Try to log certificate generation (but don't fail if table doesn't exist)
    try {
      await executeQuery(`
        INSERT INTO certificate_generation_logs (certificate_id, action, performed_by, notes)
        VALUES (?, 'generated', ?, 'Certificate generated via API')
      `, [result.insertId, scope.adminId]);
    } catch (logError) {
      // Ignore logging errors - the certificate was still generated successfully
      console.log('Certificate generated but logging failed:', logError);
    }

    // Send email to member
    try {
      const emailData = {
        to: member[0].email,
        memberName: member[0].name,
        memberRegNumber: member[0].member_reg_number,
        departmentName: departmentPost[0].dept_name_en,
        postName: departmentPost[0].post_name_en,
        level,
        state,
        district,
        certificatePath,
        appointmentDate: appointment_date || new Date().toISOString().split('T')[0],
        certificateNumber
      };

      const emailResult = await sendCertificateEmail(emailData);
      
      if (emailResult.success) {
        console.log('Certificate email sent successfully:', emailResult.messageId);
        
        // Update certificate status
        await executeQuery(`
          UPDATE certificates 
          SET email_status = 'sent', email_sent_at = NOW(), status = 'emailed'
          WHERE id = ?
        `, [result.insertId]);
        
        // Try to log email sending
        try {
          await executeQuery(`
            INSERT INTO certificate_generation_logs (certificate_id, action, performed_by, notes)
            VALUES (?, 'email_sent', ?, ?)
          `, [result.insertId, scope.adminId, `Email sent to ${member[0].email}. Message ID: ${emailResult.messageId}`]);
        } catch (logError) {
          console.log('Email sent but logging failed:', logError);
        }
      } else {
        console.error('Failed to send certificate email:', emailResult.error);
        
        // Update certificate email status
        await executeQuery(`
          UPDATE certificates 
          SET email_status = 'failed'
          WHERE id = ?
        `, [result.insertId]);
        
        // Try to log email failure
        try {
          await executeQuery(`
            INSERT INTO certificate_generation_logs (certificate_id, action, performed_by, notes)
            VALUES (?, 'email_failed', ?, ?)
          `, [result.insertId, scope.adminId, `Email failed: ${emailResult.error}`]);
        } catch (logError) {
          console.log('Email failed and logging failed:', logError);
        }
      }
    } catch (emailError) {
      console.error('Error sending certificate email:', emailError);
      
      // Try to log email error
      try {
        await executeQuery(`
          INSERT INTO certificate_generation_logs (certificate_id, action, performed_by, notes)
          VALUES (?, 'email_error', ?, ?)
        `, [result.insertId, scope.adminId, `Email error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`]);
      } catch (logError) {
        console.log('Email error and logging failed:', logError);
      }
    }

    return NextResponse.json({
      success: true,
      certificate_id: result.insertId,
      certificate_number: certificateNumber,
      certificate_path: certificatePath,
      message: 'Certificate generated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({
      error: 'Failed to generate certificate',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
