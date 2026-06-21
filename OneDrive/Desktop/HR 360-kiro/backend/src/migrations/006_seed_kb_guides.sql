-- Migration 006: Seed KB Guides with Sample Crisis Response Data
-- This migration populates the kb_guides table with sample crisis response procedures

BEGIN;

-- Check if we have at least one organization to use for seeding
DO $$
DECLARE
  v_org_id UUID;
  v_count INT;
BEGIN
  -- Get the first organization ID
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    -- Check if KB guides already exist for this org
    SELECT COUNT(*) INTO v_count FROM kb_guides WHERE organization_id = v_org_id;
    
    IF v_count = 0 THEN
      -- Insert sample KB guides
      INSERT INTO kb_guides (id, organization_id, title, category, content, version, created_by, created_at, updated_at) VALUES
      (gen_random_uuid(), v_org_id, 'Crisis Response Procedures', 'emergency-procedures', 'Steps to take during any crisis: 1) Assess situation, 2) Activate response team, 3) Communicate status, 4) Provide emergency assistance, 5) Document incident. Always prioritize personnel safety first.', 1, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_org_id, 'Emergency Contact Guidelines', 'emergency-contacts', 'Contact emergency services immediately: 911 for general emergencies, 117 for police, 114 for fire, 143 for medical. Provide clear location and number of people affected.', 1, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_org_id, 'Workplace Safety Protocols', 'safety-procedures', 'Maintain safety by: reporting hazards immediately, using required equipment, keeping exits clear, and documenting incidents. Know emergency exits in your building.', 1, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_org_id, 'Wellness Check Procedures', 'wellness', 'During emergencies, employees should check in via app: Safe (no impact), Affected (impacted but safe), Need Help (requiring assistance). Complete check-in within 15 minutes of alert.', 1, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_org_id, 'Natural Disaster Response', 'disaster-procedures', 'For earthquakes: drop, cover, hold on. For floods: move to high ground. For typhoons: go indoors away from windows. For heat: stay hydrated and move to cool areas. Always follow official evacuation orders.', 1, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      (gen_random_uuid(), v_org_id, 'Go-Bag Essentials', 'preparedness', 'Prepare emergency kit with: water, food, first aid, medications, ID, insurance documents, flashlight, batteries, cash, phone charger, sturdy shoes, and change of clothes. Keep accessible.', 1, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      
      RAISE NOTICE 'KB Guides seeded successfully for organization: %', v_org_id;
    ELSE
      RAISE NOTICE 'KB Guides already exist. Skipping seed.';
    END IF;
  ELSE
    RAISE NOTICE 'No organizations found. Skipping KB guides seed.';
  END IF;
END $$;

COMMIT;
