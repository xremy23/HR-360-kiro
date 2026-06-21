-- Migration 007: Seed Default Emergency Contacts
-- Adds default emergency services for all organizations
-- Note: Creates a system user for org-level emergency contacts if needed

BEGIN;

DO $$
DECLARE
  v_org_id UUID;
  v_system_user_id UUID;
  v_count INT;
BEGIN
  -- Get the first organization ID
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    -- Get or create a system user for org-level contacts
    SELECT id INTO v_system_user_id FROM users 
    WHERE organization_id = v_org_id AND email = 'system@emergency' LIMIT 1;
    
    IF v_system_user_id IS NULL THEN
      INSERT INTO users (
        id, email, first_name, last_name, role, organization_id, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), 'system@emergency', 'System', 'Emergency', 'admin', v_org_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id INTO v_system_user_id;
    END IF;
    
    -- Check if default contacts already exist (emergency contacts for this org)
    SELECT COUNT(*) INTO v_count FROM contacts 
    WHERE organization_id = v_org_id AND is_emergency_contact = true;
    
    IF v_count = 0 THEN
      -- Insert default emergency services
      INSERT INTO contacts (
        id, user_id, organization_id, name, phone, email, relationship, is_emergency_contact, created_at, updated_at
      ) VALUES 
      (gen_random_uuid(), v_system_user_id, v_org_id, 'National Emergency Hotline', '911', NULL, 'Emergency Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'Philippine National Police (PNP)', '117', NULL, 'Emergency Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'Bureau of Fire Protection (BFP)', '114', NULL, 'Emergency Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'Philippine National Red Cross', '143', NULL, 'Emergency Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'NDRRMC Disaster Hotline', '+63 2 911-5061', NULL, 'Emergency Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'PAGASA Weather Bureau', '+63 2 426-1468', NULL, 'Government Agency', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'Philippine Institute of Volcanology and Seismology', '+63 2 426-1468', NULL, 'Government Agency', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'Philippine General Hospital', '+63 2 526-6000', NULL, 'Hospital', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'Ospital ng Makati', '+63 2 888-8888', NULL, 'Hospital', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'Maynilad Water Emergency', '1-800-42-WATER', NULL, 'Utility', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'Meralco (Electricity)', '16001', NULL, 'Utility', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'PLDT Telecommunications', '1700', NULL, 'Utility', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_system_user_id, v_org_id, 'National Suicide Prevention Hotline', '1553', NULL, 'Emergency Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      
      RAISE NOTICE 'Default emergency contacts seeded successfully for organization: %', v_org_id;
    ELSE
      RAISE NOTICE 'Default contacts already exist for organization: %. Skipping.', v_org_id;
    END IF;
  ELSE
    RAISE NOTICE 'No organizations found. Skipping emergency contacts seed.';
  END IF;
END $$;

COMMIT;
