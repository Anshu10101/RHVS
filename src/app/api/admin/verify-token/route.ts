import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { generateMemberRegistrationNumber } from '@/lib/member-registration';
import { generateCertificate } from '@/lib/certificate';
import { generateIDCard } from '@/lib/id-card-generator';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { token, action } = await request.json();

    if (!token || !action) {
      return NextResponse.json(
        { success: false, message: 'Token and action are required' },
        { status: 400 }
      );
    }

    // Get token details
    const tokenQuery = `
      SELECT * FROM registration_tokens 
      WHERE token = ? AND status = 'pending' AND expires_at > NOW()
      LIMIT 1
    `;
    
    const tokens = await executeQuery(tokenQuery, [token]) as Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      state: string;
      district: string;
      aadhar_card_number: string;
      father_husband_name: string;
      mother_wife_name: string;
      registration_date: string;
      existing_member_reg_number: string;
      profile_photo_path: string;
      signature_path: string;
      department: string;
    }>;

    if (tokens.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    const tokenData = tokens[0];

    if (action === 'reject') {
      // Reject the token
      await executeQuery(
        'UPDATE registration_tokens SET status = ?, verified_by_admin_id = ?, verified_at = NOW() WHERE id = ?',
        ['rejected', scope.adminId, tokenData.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Registration token rejected successfully'
      });
    }

    if (action === 'verify') {
      // Check if email already exists in members table
      const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
      const existingMembers = await executeQuery(existingMemberQuery, [tokenData.email]) as Array<{ id: number }>;
      
      if (existingMembers.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Email already registered as a member' },
          { status: 400 }
        );
      }

      // Generate new member registration number
      const memberRegNumber = await generateMemberRegistrationNumber();

      // Get verifier's ID for tracking
      let verifierId = null;
      if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
        // For district admins, use their member ID
        const adminQuery = `
          SELECT m.id as member_id
          FROM district_admins da
          JOIN members m ON da.member_id = m.id
          WHERE da.id = ?
          LIMIT 1
        `;
        const adminResult = await executeQuery(adminQuery, [scope.adminId]) as Array<{ member_id: number }>;
        verifierId = adminResult.length > 0 ? adminResult[0].member_id : null;
      }

      // Insert new member
      const insertMemberQuery = `
        INSERT INTO members (
          member_reg_number, name, email, phone, address, state, district, aadhar_card_number,
          father_husband_name, mother_wife_name, registration_date, existing_member_reg_number,
          profile_photo_path, signature_path, department, verified_by_admin_id, verification_date,
          status, verified_by_member_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'verified', ?, NOW(), NOW())
      `;

      const memberResult = await executeQuery(insertMemberQuery, [
        memberRegNumber,
        tokenData.name,
        tokenData.email,
        tokenData.phone,
        tokenData.address,
        tokenData.state,
        tokenData.district,
        tokenData.aadhar_card_number,
        tokenData.father_husband_name,
        tokenData.mother_wife_name,
        tokenData.registration_date,
        tokenData.existing_member_reg_number,
        tokenData.profile_photo_path,
        tokenData.signature_path,
        tokenData.department,
        scope.adminId,
        verifierId
      ]) as { insertId: number };

      const memberId = memberResult.insertId;

      // Update token status
      await executeQuery(
        'UPDATE registration_tokens SET status = ?, verified_by_admin_id = ?, verified_at = NOW() WHERE id = ?',
        ['verified', scope.adminId, tokenData.id]
      );

      // Generate membership certificate
      let certificatePath = null;
      let certificateNumber = null;
      
      try {
        console.log('Generating membership certificate for:', memberRegNumber);
        const certificateResult = await generateCertificate({
          memberId: memberId,
          memberName: tokenData.name,
          memberRegNumber: memberRegNumber,
          registrationDate: tokenData.registration_date,
          profilePhotoPath: tokenData.profile_photo_path
        });
        
        certificatePath = certificateResult.certificatePath;
        certificateNumber = certificateResult.certificateNumber;
        
        console.log('✅ Certificate generated:', certificateNumber, certificatePath);
        
        // Store certificate info in database
        const certificateQuery = `
          INSERT INTO member_certificates (member_id, certificate_number, certificate_path, generated_by_admin_id)
          VALUES (?, ?, ?, ?)
        `;
        
        await executeQuery(certificateQuery, [
          memberId,
          certificateNumber,
          certificatePath,
          scope.adminId
        ]);
        
        console.log('✅ Certificate record saved to database');
      } catch (error) {
        console.error('❌ Error generating certificate:', error);
        // Continue without certificate - don't fail the registration
      }

      // Generate ID card
      let idCardPath = null;
      
      try {
        console.log('Generating ID card for:', memberRegNumber);
        const idCardResult = await generateIDCard({
          memberId: memberId,
          memberName: tokenData.name,
          memberRegNumber: memberRegNumber,
          profilePhotoPath: tokenData.profile_photo_path,
          address: tokenData.address,
          designation: 'Member'
        });
        
        idCardPath = idCardResult.idCardPath;
        
        console.log('✅ ID card generated:', idCardPath);
      } catch (error) {
        console.error('❌ Error generating ID card:', error);
        // Continue without ID card - don't fail the registration
      }

      // Send welcome email with certificate and ID card
      try {
        console.log('Sending welcome email to:', tokenData.email, 'with certificate:', certificatePath, 'and ID card:', idCardPath);
        await sendWelcomeEmail(tokenData.email, tokenData.name, memberRegNumber, certificatePath || undefined, idCardPath || undefined);
        console.log('✅ Welcome email sent successfully');
      } catch (error) {
        console.error('❌ Error sending welcome email:', error);
      }

      // Log the admin action
      try {
        const activityLogQuery = `
          INSERT INTO activity_logs (user_id, user_type, action, details, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `;
        
        const logDetails = JSON.stringify({
          action: 'token_verified',
          memberId: memberId,
          memberName: tokenData.name,
          memberEmail: tokenData.email,
          memberRegNumber: memberRegNumber,
          verifiedBy: scope.isSuperAdmin ? 'Superadmin' : 'District Admin',
          adminId: scope.adminId,
          adminType: scope.isSuperAdmin ? 'superadmin' : 'district_admin',
          tokenId: tokenData.id
        });

        await executeQuery(activityLogQuery, [
          scope.adminId, 
          scope.isSuperAdmin ? 'superadmin' : 'district_admin', 
          'token_verified', 
          logDetails
        ]);
      } catch (error) {
        console.error('Error logging admin action:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Member registered successfully',
        memberId: memberId,
        memberRegNumber: memberRegNumber,
        certificatePath: certificatePath,
        certificateNumber: certificateNumber,
        idCardPath: idCardPath
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in token verification:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
