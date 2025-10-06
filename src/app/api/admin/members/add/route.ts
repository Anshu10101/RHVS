import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAdminScope, ensurePermission } from '@/lib/admin-scope';
import { sendWelcomeEmail } from '@/lib/email';
import { generateCertificate } from '@/lib/certificate';
import { generateMemberRegistrationNumber } from '@/lib/member-registration';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication and permissions
    const scope = await getAdminScope(request);
    
    if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Check if admin has permission to add members
    if (!ensurePermission(scope, ['add_members', 'manage_members'])) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to add members' },
        { status: 403 }
      );
    }

    const {
      name,
      email,
      phone,
      address,
      stateId,
      districtId,
      aadharCardNumber,
      fatherHusbandName,
      motherWifeName,
      registrationDate,
      profilePhotoPath,
      feePaid
    } = await request.json();

    // Debug logging
    console.log('Admin member add request:', {
      name, email, phone, address, stateId, districtId,
      aadharCardNumber, fatherHusbandName, motherWifeName,
      registrationDate, profilePhotoPath, feePaid
    });

    // Validate required fields
    if (!name || !email || !phone || !address || !stateId || !districtId || 
        !aadharCardNumber || !fatherHusbandName || !motherWifeName || 
        !registrationDate) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingMemberQuery = 'SELECT id FROM members WHERE email = ?';
    const existingMembers: any = await executeQuery(existingMemberQuery, [email]);
    
    if (existingMembers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Automatically set existing member registration number based on admin type
    let verifierId = null;
    let existingMemberRegNumberFinal = 'RHVS000000'; // Default superadmin reference
    
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // For district admins, use their own registration number
      const adminQuery = `
        SELECT da.member_reg_number, m.id as member_id
        FROM district_admins da
        LEFT JOIN members m ON da.member_reg_number = m.member_reg_number
        WHERE da.id = ?
        LIMIT 1
      `;
      const adminResult: any = await executeQuery(adminQuery, [scope.adminId]);
      
      if (adminResult.length > 0 && adminResult[0].member_id) {
        existingMemberRegNumberFinal = adminResult[0].member_reg_number;
        verifierId = adminResult[0].member_id;
      } else {
        return NextResponse.json(
          { success: false, message: 'District admin member record not found' },
          { status: 400 }
        );
      }
    }
    // For superadmins, use RHVS000000 as reference (superadmin reference)

    // Get state and district names from IDs
    const stateQuery = 'SELECT state_name_english FROM states WHERE id = ?';
    const stateResult: any = await executeQuery(stateQuery, [stateId]);
    const stateName = stateResult.length > 0 ? stateResult[0].state_name_english : '';

    const districtQuery = 'SELECT district_name_english FROM districts WHERE district_code = ? LIMIT 1';
    const districtResult: any = await executeQuery(districtQuery, [districtId]);
    const districtName = districtResult.length > 0 ? districtResult[0].district_name_english : '';

    // SECURITY CHECK: District admins can only add members to their own district
    if (scope.isDistrictAdmin && !scope.isSuperAdmin) {
      // Check if the district being added matches the admin's district
      if (districtName.toLowerCase() !== scope.districtName?.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: `You can only add members to your assigned district: ${scope.districtName}` },
          { status: 403 }
        );
      }
    }

    // Generate new member registration number - maintain sequential flow
    const memberRegNumber = await generateMemberRegistrationNumber();

    // Insert new member directly into members table
    const insertMemberQuery = `
      INSERT INTO members (
        name, email, phone, address, father_husband_name, mother_wife_name,
        registration_date, existing_member_reg_number, profile_photo_path,
        member_reg_number, state, aadhar_card_number,
        verified_by_admin_id, verification_date, status, district, department,
        verified_by_member_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'verified', ?, ?, ?, NOW(), NOW())
    `;

    const memberResult: any = await executeQuery(insertMemberQuery, [
      name,
      email,
      phone,
      address,
      fatherHusbandName,
      motherWifeName,
      registrationDate,
      existingMemberRegNumberFinal, // Use automatically determined value
      profilePhotoPath,
      memberRegNumber,
      stateName, // Using state name instead of state_id
      aadharCardNumber,
      scope.adminId,
      districtName,
      'General', // Default department
      verifierId // Use automatically determined verifier ID
    ]);

    const memberId = memberResult.insertId;

    // Generate certificate
    let certificatePath = null;
    let certificateNumber = null;
    
    try {
      const certificateResult = await generateCertificate({
        memberId: memberId,
        memberName: name,
        memberRegNumber: memberRegNumber,
        registrationDate: registrationDate
      });
      
      certificatePath = certificateResult.certificatePath;
      certificateNumber = certificateResult.certificateNumber;

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
    } catch (error) {
      console.error('Error generating certificate:', error);
      // Continue without certificate - don't fail the registration
    }

    // Send welcome email with certificate
    try {
      await sendWelcomeEmail(email, name, memberRegNumber, certificatePath || undefined);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Continue without email - don't fail the registration
    }

    // Log the admin action
    try {
      const activityLogQuery = `
        INSERT INTO activity_logs (user_id, user_type, action, details, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      
      const logDetails = JSON.stringify({
        action: 'member_added_direct',
        memberId: memberId,
        memberName: name,
        memberEmail: email,
        memberRegNumber: memberRegNumber,
        verifiedBy: scope.isSuperAdmin ? 'Superadmin' : 'District Admin',
        verifiedByRegNumber: existingMemberRegNumberFinal,
        adminId: scope.adminId,
        adminType: scope.isSuperAdmin ? 'superadmin' : 'district_admin'
      });

      await executeQuery(activityLogQuery, [
        scope.adminId, 
        scope.isSuperAdmin ? 'superadmin' : 'district_admin', 
        'member_added_direct', 
        logDetails
      ]);
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Continue without logging - don't fail the registration
    }

    return NextResponse.json({
      success: true,
      message: 'Member registered successfully',
      memberId: memberId,
      memberRegNumber: memberRegNumber,
      certificatePath: certificatePath,
      certificateNumber: certificateNumber
    });

  } catch (error) {
    console.error('Error in admin member add:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
