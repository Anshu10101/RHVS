-- Fix contact_info table with correct data for RHVS contact page
-- Clear existing data
DELETE FROM contact_info;
DELETE FROM offices;

-- Insert correct contact information
INSERT INTO contact_info (id, contact_type, title, value, description, `order`, isVisible, created_at, updated_at, created_by) VALUES
('phone-1', 'phone', 'Main Phone', '6290087054', 'Primary contact number', 1, 1, NOW(), NOW(), 'admin'),
('phone-2', 'phone', 'Secondary Phone', '9425119209', 'Secondary contact number', 2, 1, NOW(), NOW(), 'admin'),
('email-1', 'email', 'General Inquiry', 'help@rashtriyahinduvahinisangathan.org', 'General information and inquiries', 3, 1, NOW(), NOW(), 'admin'),
('office-hours-1', 'office', 'Office Hours', 'सोमवार - शुक्रवार: सुबह 9:00 - शाम 6:00\nशनिवार - रविवार: सुबह 10:00 - शाम 4:00', 'Working hours', 4, 1, NOW(), NOW(), 'admin');

-- Insert office locations based on original static content
INSERT INTO offices (id, name, name_hindi, address, city, state, pincode, phone, email, office_type, `order`, isVisible, created_at, updated_at, created_by) VALUES
('office-1', 'Vishisht Central Office', 'विशिष्ट केंद्रीय कार्यालय', 'राष्ट्रीय हिन्दू वाहिनी संगठन "उत्तरायण"\nगुरुकुल पब्लिक स्कूल के पास', 'दतिया', 'मध्य प्रदेश', '475661', NULL, NULL, 'head', 1, 1, NOW(), NOW(), 'admin'),
('office-2', 'Central Office', 'केंद्रीय कार्यालय', 'D–305, "कान्हा कुंज"\nइंदिरा पार्क, नजफगढ़', 'नई दिल्ली', 'दिल्ली', '110043', NULL, NULL, 'regional', 2, 1, NOW(), NOW(), 'admin'),
('office-3', 'Main Office', 'मुख्य कार्यालय', '883, श्री वैदेही वल्लभ कुंज\nबावन मंदिर', 'अयोध्या', 'उत्तर प्रदेश', '224001', NULL, NULL, 'regional', 3, 1, NOW(), NOW(), 'admin'),
('office-4', 'Head Office', 'प्रधान कार्यालय', 'श्री रामेश्वरम धाम\nगंगा सूरजपुर कॉलोनी, हरपुरकला', 'हरिद्वार', 'उत्तराखंड', '249205', NULL, NULL, 'head', 4, 1, NOW(), NOW(), 'admin');
