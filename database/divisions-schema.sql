-- Divisions Table Schema
-- Creates divisions table and inserts all divisions with English and Hindi names

CREATE TABLE IF NOT EXISTS divisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  division_code VARCHAR(50) UNIQUE NOT NULL,
  division_name_english VARCHAR(255) NOT NULL,
  division_name_hindi VARCHAR(255) NOT NULL,
  state_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_state_code (state_code),
  INDEX idx_division_name_english (division_name_english),
  INDEX idx_division_name_hindi (division_name_hindi)
  -- Note: Foreign key constraint removed due to potential type mismatch
  -- states.state_code might be INTEGER while divisions.state_code is VARCHAR
  -- The API uses pattern matching by state name, so FK is not required
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Divisions for all States/UTs
-- Using INSERT IGNORE to skip duplicates if data already exists

-- Arunachal Pradesh (AR)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('AR-EAST', 'East Arunachal', 'पूर्व अरुणाचल', 'AR'),
('AR-WEST', 'West Arunachal', 'पश्चिम अरुणाचल', 'AR');

-- Assam (AS)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('AS-UPPER', 'Upper Assam Division', 'ऊपरी असम प्रभाग', 'AS'),
('AS-NORTH', 'North Assam Division', 'उत्तरी असम प्रभाग', 'AS'),
('AS-LOWER', 'Lower Assam Division', 'निचला असम प्रभाग', 'AS'),
('AS-CENTRAL', 'Central Assam Division', 'मध्य असम प्रभाग', 'AS'),
('AS-BARAK', 'Barak Valley Division', 'बराक घाटी प्रभाग', 'AS');

-- Bihar (BR)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('BR-PATNA', 'Patna', 'पटना', 'BR'),
('BR-TIRHUT', 'Tirhut', 'तिरहुत', 'BR'),
('BR-DARBHANGA', 'Darbhanga', 'दरभंगा', 'BR'),
('BR-KOSI', 'Kosi', 'कोसी', 'BR'),
('BR-PURNIA', 'Purnia', 'पूर्णिया', 'BR'),
('BR-BHAGALPUR', 'Bhagalpur', 'भागलपुर', 'BR'),
('BR-MUNGER', 'Munger', 'मुंगेर', 'BR'),
('BR-MAGADH', 'Magadh', 'मगध', 'BR'),
('BR-SARAN', 'Saran', 'सारण', 'BR');

-- Chhattisgarh (CT)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('CT-BASTAR', 'Bastar', 'बस्तर', 'CT'),
('CT-BILASPUR', 'Bilaspur', 'बिलासपुर', 'CT'),
('CT-DURG', 'Durg', 'दुर्ग', 'CT'),
('CT-RAIPUR', 'Raipur', 'रायपुर', 'CT'),
('CT-SARGUJA', 'Sarguja', 'सरगुजा', 'CT');

-- Haryana (HR)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('HR-AMBALA', 'Ambala', 'अंबाला', 'HR'),
('HR-HISAR', 'Hisar', 'हिसार', 'HR'),
('HR-ROHTAK', 'Rohtak', 'रोहतक', 'HR'),
('HR-GURUGRAM', 'Gurugram', 'गुरुग्राम', 'HR'),
('HR-KARNAL', 'Karnal', 'करनाल', 'HR'),
('HR-FARIDABAD', 'Faridabad', 'फरीदाबाद', 'HR');

-- Himachal Pradesh (HP)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('HP-KANGRA', 'Kangra', 'कांगड़ा', 'HP'),
('HP-MANDI', 'Mandi', 'मंडी', 'HP'),
('HP-SHIMLA', 'Shimla', 'शिमला', 'HP');

-- Jharkhand (JH)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('JH-PALAMU', 'Palamu', 'पलामू', 'JH'),
('JH-NORTH-CHOTANAGPUR', 'North Chotanagpur', 'उत्तरी छोटानागपुर', 'JH'),
('JH-SOUTH-CHOTANAGPUR', 'South Chotanagpur', 'दक्षिण छोटानागपुर', 'JH'),
('JH-KOLHAN', 'Kolhan', 'कोल्हान', 'JH'),
('JH-SANTHAL-PARGANA', 'Santhal Pargana', 'संथाल परगना', 'JH');

-- Karnataka (KA)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('KA-BENGALURU', 'Bengaluru', 'बेंगलुरु', 'KA'),
('KA-MYSURU', 'Mysuru', 'मैसूरु', 'KA'),
('KA-BELAGAVI', 'Belagavi', 'बेलगावी', 'KA'),
('KA-KALABURAGI', 'Kalaburagi (Gulbarga)', 'कलबुर्गी (गुलबर्गा)', 'KA');

-- Madhya Pradesh (MP)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('MP-BHOPAL', 'Bhopal', 'भोपाल', 'MP'),
('MP-CHAMBAL', 'Chambal', 'चंबल', 'MP'),
('MP-GWALIOR', 'Gwalior', 'ग्वालियर', 'MP'),
('MP-INDORE', 'Indore', 'इंदौर', 'MP'),
('MP-JABALPUR', 'Jabalpur', 'जबलपुर', 'MP'),
('MP-NARMADAPURAM', 'Narmadapuram', 'नर्मदापुरम', 'MP'),
('MP-REWA', 'Rewa', 'रीवा', 'MP'),
('MP-SAGAR', 'Sagar', 'सागर', 'MP'),
('MP-SHAHDOL', 'Shahdol', 'शहडोल', 'MP'),
('MP-UJJAIN', 'Ujjain', 'उज्जैन', 'MP');

-- Maharashtra (MH)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('MH-KONKAN', 'Konkan', 'कोंकण', 'MH'),
('MH-PUNE', 'Pune', 'पुणे', 'MH'),
('MH-NASHIK', 'Nashik', 'नासिक', 'MH'),
('MH-AURANGABAD', 'Aurangabad', 'औरंगाबाद', 'MH'),
('MH-AMRAVATI', 'Amravati', 'अमरावती', 'MH'),
('MH-NAGPUR', 'Nagpur', 'नागपुर', 'MH');

-- Meghalaya (ML)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('ML-EAST', 'East Meghalaya', 'पूर्व मेघालय', 'ML'),
('ML-WEST', 'West Meghalaya', 'पश्चिम मेघालय', 'ML'),
('ML-SOUTH', 'South Meghalaya', 'दक्षिण मेघालय', 'ML');

-- Nagaland (NL)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('NL-DIVISION', 'Nagaland Division', 'नागालैंड प्रभाग', 'NL');

-- Odisha (OD)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('OD-CENTRAL', 'Central Division', 'केंद्रीय प्रभाग', 'OD'),
('OD-NORTHERN', 'Northern Division', 'उत्तरी प्रभाग', 'OD'),
('OD-SOUTHERN', 'Southern Division', 'दक्षिणी प्रभाग', 'OD');

-- Punjab (PB)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('PB-FARIDKOT', 'Faridkot', 'फरीदकोट', 'PB'),
('PB-FEROZEPUR', 'Ferozepur', 'फिरोजपुर', 'PB'),
('PB-JALANDHAR', 'Jalandhar', 'जालंधर', 'PB'),
('PB-PATIALA', 'Patiala', 'पटियाला', 'PB'),
('PB-RUPNAGAR', 'Rupnagar', 'रूपनगर', 'PB');

-- Rajasthan (RJ)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('RJ-AJMER', 'Ajmer', 'अजमेर', 'RJ'),
('RJ-BHARATPUR', 'Bharatpur', 'भरतपुर', 'RJ'),
('RJ-BIKANER', 'Bikaner', 'बीकानेर', 'RJ'),
('RJ-JAIPUR', 'Jaipur', 'जयपुर', 'RJ'),
('RJ-JODHPUR', 'Jodhpur', 'जोधपुर', 'RJ'),
('RJ-KOTA', 'Kota', 'कोटा', 'RJ'),
('RJ-UDAIPUR', 'Udaipur', 'उदयपुर', 'RJ'),
('RJ-PALI', 'Pali', 'पाली', 'RJ'),
('RJ-SIKAR', 'Sikar', 'सीकर', 'RJ'),
('RJ-JALORE', 'Jalore', 'जालोर', 'RJ');

-- Uttar Pradesh (UP)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('UP-AGRA', 'Agra', 'आगरा', 'UP'),
('UP-ALIGARH', 'Aligarh', 'अलीगढ़', 'UP'),
('UP-AZAMGARH', 'Azamgarh', 'आजमगढ़', 'UP'),
('UP-AYODHYA', 'Ayodhya', 'अयोध्या', 'UP'),
('UP-BAREILLY', 'Bareilly', 'बरेली', 'UP'),
('UP-BASTI', 'Basti', 'बस्ती', 'UP'),
('UP-CHITRAKOOT', 'Chitrakoot', 'चित्रकूट', 'UP'),
('UP-DEVIPATAN', 'Devipatan', 'देवीपाटन', 'UP'),
('UP-GORAKHPUR', 'Gorakhpur', 'गोरखपुर', 'UP'),
('UP-JHANSI', 'Jhansi', 'झांसी', 'UP'),
('UP-KANPUR', 'Kanpur', 'कानपुर', 'UP'),
('UP-LUCKNOW', 'Lucknow', 'लखनऊ', 'UP'),
('UP-MEERUT', 'Meerut', 'मेरठ', 'UP'),
('UP-MIRZAPUR', 'Mirzapur', 'मिर्जापुर', 'UP'),
('UP-MORADABAD', 'Moradabad', 'मुरादाबाद', 'UP'),
('UP-PRAYAGRAJ', 'Prayagraj', 'प्रयागराज', 'UP'),
('UP-SAHARANPUR', 'Saharanpur', 'सहारनपुर', 'UP'),
('UP-VARANASI', 'Varanasi', 'वाराणसी', 'UP');

-- Uttarakhand (UT)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('UT-GARHWAL', 'Garhwal', 'गढ़वाल', 'UT'),
('UT-KUMAON', 'Kumaon', 'कुमाऊं', 'UT');

-- West Bengal (WB)
INSERT IGNORE INTO divisions (division_code, division_name_english, division_name_hindi, state_code) VALUES
('WB-PRESIDENCY', 'Presidency', 'प्रेसीडेंसी', 'WB'),
('WB-MEDINIPUR', 'Medinipur', 'मेदिनीपुर', 'WB'),
('WB-BURDWAN', 'Burdwan', 'बर्दवान', 'WB'),
('WB-MALDA', 'Malda', 'मालदा', 'WB'),
('WB-JALPAIGURI', 'Jalpaiguri', 'जलपाईगुड़ी', 'WB');

