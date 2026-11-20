BEGIN;

-- Authoritative stage definitions for migration 0031.
-- Rules:
-- 1) Match by (project_type_id, business_model, template_code).
-- 2) Update exact code matches where name/sequence/defaults differ.
-- 3) Insert missing stages.
-- 4) Keep company-specific templates untouched (company_id IS NOT NULL).
-- 5) Do not deactivate anything unless explicitly listed in explicit_deactivate.
-- 6) Abort if ambiguous template-code mapping is detected.

DO $$
DECLARE
  v_missing_non_optional text[];
  v_missing_material_supply boolean;
  v_ambiguous_count bigint;
BEGIN
  WITH authoritative_raw(project_code, business_model, sequence_number, stage_name) AS (
VALUES
    ('independent_house', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('independent_house', 'contract_construction', 2, 'Architectural Design & Drawings'),
    ('independent_house', 'contract_construction', 3, 'Estimation, Quotation & Agreement'),
    ('independent_house', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('independent_house', 'contract_construction', 5, 'Foundation & Plinth Construction'),
    ('independent_house', 'contract_construction', 6, 'Structural Construction'),
    ('independent_house', 'contract_construction', 7, 'Brickwork & Masonry'),
    ('independent_house', 'contract_construction', 8, 'Plastering & Waterproofing'),
    ('independent_house', 'contract_construction', 9, 'Electrical & Plumbing Works'),
    ('independent_house', 'contract_construction', 10, 'Flooring, Doors & Windows'),
    ('independent_house', 'contract_construction', 11, 'Painting & Final Finishing'),
    ('independent_house', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('villa', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('villa', 'contract_construction', 2, 'Architectural Design & 3D Elevation'),
    ('villa', 'contract_construction', 3, 'Structural & Engineering Design'),
    ('villa', 'contract_construction', 4, 'Estimation, Quotation & Agreement'),
    ('villa', 'contract_construction', 5, 'Approvals & Site Mobilization'),
    ('villa', 'contract_construction', 6, 'Foundation & Plinth Construction'),
    ('villa', 'contract_construction', 7, 'Structural Construction'),
    ('villa', 'contract_construction', 8, 'Masonry, Plastering & Waterproofing'),
    ('villa', 'contract_construction', 9, 'Electrical, Plumbing & HVAC Works'),
    ('villa', 'contract_construction', 10, 'Flooring, Doors, Windows & Joinery'),
    ('villa', 'contract_construction', 11, 'Interior, Exterior & Landscape Finishing'),
    ('villa', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('apartment', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('apartment', 'contract_construction', 2, 'Architectural Design & Engineering'),
    ('apartment', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('apartment', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('apartment', 'contract_construction', 5, 'Foundation & Basement Construction'),
    ('apartment', 'contract_construction', 6, 'Structural Construction'),
    ('apartment', 'contract_construction', 7, 'Masonry & Internal Plastering'),
    ('apartment', 'contract_construction', 8, 'Electrical, Plumbing & Fire Systems'),
    ('apartment', 'contract_construction', 9, 'Flooring, Doors & Windows'),
    ('apartment', 'contract_construction', 10, 'Painting & Internal Finishing'),
    ('apartment', 'contract_construction', 11, 'Lifts, Common Areas & External Works'),
    ('apartment', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('commercial_building', 'contract_construction', 1, 'Client Requirements & Space Planning'),
    ('commercial_building', 'contract_construction', 2, 'Architectural & Engineering Design'),
    ('commercial_building', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('commercial_building', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('commercial_building', 'contract_construction', 5, 'Foundation & Basement Construction'),
    ('commercial_building', 'contract_construction', 6, 'Structural Construction'),
    ('commercial_building', 'contract_construction', 7, 'Masonry & Building Envelope'),
    ('commercial_building', 'contract_construction', 8, 'Electrical, Plumbing, HVAC & Fire Systems'),
    ('commercial_building', 'contract_construction', 9, 'Flooring, Ceilings & Interior Works'),
    ('commercial_building', 'contract_construction', 10, 'Elevation & External Finishing'),
    ('commercial_building', 'contract_construction', 11, 'Testing, Commissioning & Inspection'),
    ('commercial_building', 'contract_construction', 12, 'Client Handover'),
    ('renovation', 'contract_construction', 1, 'Existing Site Inspection & Assessment'),
    ('renovation', 'contract_construction', 2, 'Client Requirements & Scope Finalization'),
    ('renovation', 'contract_construction', 3, 'Design, Drawings & Estimation'),
    ('renovation', 'contract_construction', 4, 'Agreement & Site Preparation'),
    ('renovation', 'contract_construction', 5, 'Demolition & Dismantling'),
    ('renovation', 'contract_construction', 6, 'Structural Repairs & Modifications'),
    ('renovation', 'contract_construction', 7, 'Masonry & Plastering'),
    ('renovation', 'contract_construction', 8, 'Electrical & Plumbing Modifications'),
    ('renovation', 'contract_construction', 9, 'Flooring, Doors & Windows'),
    ('renovation', 'contract_construction', 10, 'Painting & Finishing'),
    ('renovation', 'contract_construction', 11, 'Final Inspection & Snag Rectification'),
    ('renovation', 'contract_construction', 12, 'Client Handover'),
    ('building_extension', 'contract_construction', 1, 'Existing Building Assessment'),
    ('building_extension', 'contract_construction', 2, 'Extension Planning & Design'),
    ('building_extension', 'contract_construction', 3, 'Structural Feasibility & Engineering'),
    ('building_extension', 'contract_construction', 4, 'Estimation, Agreement & Approvals'),
    ('building_extension', 'contract_construction', 5, 'Site Preparation & Protection'),
    ('building_extension', 'contract_construction', 6, 'Foundation & Structural Modifications'),
    ('building_extension', 'contract_construction', 7, 'New Structural Construction'),
    ('building_extension', 'contract_construction', 8, 'Masonry & Plastering'),
    ('building_extension', 'contract_construction', 9, 'Electrical & Plumbing Extensions'),
    ('building_extension', 'contract_construction', 10, 'Flooring & Finishing'),
    ('building_extension', 'contract_construction', 11, 'Integration & Quality Inspection'),
    ('building_extension', 'contract_construction', 12, 'Client Handover'),
    ('industrial_warehouse', 'contract_construction', 1, 'Client Requirements & Industrial Planning'),
    ('industrial_warehouse', 'contract_construction', 2, 'Architectural & Structural Design'),
    ('industrial_warehouse', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('industrial_warehouse', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('industrial_warehouse', 'contract_construction', 5, 'Site Development & Earthwork'),
    ('industrial_warehouse', 'contract_construction', 6, 'Foundation & Industrial Flooring'),
    ('industrial_warehouse', 'contract_construction', 7, 'Structural Steel / RCC Construction'),
    ('industrial_warehouse', 'contract_construction', 8, 'Roofing & Cladding'),
    ('industrial_warehouse', 'contract_construction', 9, 'Electrical, Plumbing & Fire Systems'),
    ('industrial_warehouse', 'contract_construction', 10, 'Flooring, Drainage & External Development'),
    ('industrial_warehouse', 'contract_construction', 11, 'Testing, Inspection & Commissioning'),
    ('industrial_warehouse', 'contract_construction', 12, 'Client Handover'),
    ('interior_fitout', 'contract_construction', 1, 'Site Survey & Client Requirements'),
    ('interior_fitout', 'contract_construction', 2, 'Space Planning & Interior Design'),
    ('interior_fitout', 'contract_construction', 3, 'Material Selection & BOQ'),
    ('interior_fitout', 'contract_construction', 4, 'Quotation, Agreement & Mobilization'),
    ('interior_fitout', 'contract_construction', 5, 'Dismantling & Site Preparation'),
    ('interior_fitout', 'contract_construction', 6, 'Civil & Partition Works'),
    ('interior_fitout', 'contract_construction', 7, 'Electrical, Plumbing & HVAC Works'),
    ('interior_fitout', 'contract_construction', 8, 'Ceiling & Flooring Works'),
    ('interior_fitout', 'contract_construction', 9, 'Carpentry & Custom Furniture'),
    ('interior_fitout', 'contract_construction', 10, 'Painting, Fixtures & Finishing'),
    ('interior_fitout', 'contract_construction', 11, 'Final Inspection & Snag Rectification'),
    ('interior_fitout', 'contract_construction', 12, 'Client Handover'),
    ('apartment', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('apartment', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('apartment', 'property_development', 3, 'Feasibility & Project Planning'),
    ('apartment', 'property_development', 4, 'Architectural & Engineering Design'),
    ('apartment', 'property_development', 5, 'Building Approvals & Statutory Clearances'),
    ('apartment', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('apartment', 'property_development', 7, 'Site Mobilization & Preparation'),
    ('apartment', 'property_development', 8, 'Foundation & Basement Construction'),
    ('apartment', 'property_development', 9, 'Structural Construction'),
    ('apartment', 'property_development', 10, 'MEP & Internal Infrastructure'),
    ('apartment', 'property_development', 11, 'Finishing & Common Area Development'),
    ('apartment', 'property_development', 12, 'Quality Inspection & Occupancy Approval'),
    ('apartment', 'property_development', 13, 'Sales, Registration & Customer Handover'),
    ('villa', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('villa', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('villa', 'property_development', 3, 'Feasibility & Villa Planning'),
    ('villa', 'property_development', 4, 'Architectural & Engineering Design'),
    ('villa', 'property_development', 5, 'Approvals & Statutory Clearances'),
    ('villa', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('villa', 'property_development', 7, 'Site Development & Infrastructure'),
    ('villa', 'property_development', 8, 'Villa Foundation & Structural Construction'),
    ('villa', 'property_development', 9, 'Masonry, Roofing & Waterproofing'),
    ('villa', 'property_development', 10, 'MEP & Interior Finishing'),
    ('villa', 'property_development', 11, 'Landscaping & Common Amenities'),
    ('villa', 'property_development', 12, 'Quality Inspection & Occupancy Approval'),
    ('villa', 'property_development', 13, 'Sales, Registration & Customer Handover'),
    ('commercial_building', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('commercial_building', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('commercial_building', 'property_development', 3, 'Market Feasibility & Project Planning'),
    ('commercial_building', 'property_development', 4, 'Architectural & Engineering Design'),
    ('commercial_building', 'property_development', 5, 'Building Approvals & Statutory Clearances'),
    ('commercial_building', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('commercial_building', 'property_development', 7, 'Site Mobilization & Preparation'),
    ('commercial_building', 'property_development', 8, 'Foundation & Basement Construction'),
    ('commercial_building', 'property_development', 9, 'Structural Construction'),
    ('commercial_building', 'property_development', 10, 'MEP, Fire Systems & Building Services'),
    ('commercial_building', 'property_development', 11, 'Interior, External & Common Area Finishing'),
    ('commercial_building', 'property_development', 12, 'Testing, Occupancy Approval & Completion'),
    ('commercial_building', 'property_development', 13, 'Leasing / Sales, Registration & Handover'),
    ('civil_infrastructure', 'civil_works_contract', 1, 'Tender & Work Order'),
    ('civil_infrastructure', 'civil_works_contract', 2, 'Site Survey & Technical Planning'),
    ('civil_infrastructure', 'civil_works_contract', 3, 'BOQ, Estimation & Project Scheduling'),
    ('civil_infrastructure', 'civil_works_contract', 4, 'Approvals & Site Mobilization'),
    ('civil_infrastructure', 'civil_works_contract', 5, 'Site Clearing & Earthwork'),
    ('civil_infrastructure', 'civil_works_contract', 6, 'Foundation & Main Civil Works'),
    ('civil_infrastructure', 'civil_works_contract', 7, 'Structural & Infrastructure Construction'),
    ('civil_infrastructure', 'civil_works_contract', 8, 'Ancillary Works & Finishing'),
    ('civil_infrastructure', 'civil_works_contract', 9, 'Quality Testing & Inspection'),
    ('civil_infrastructure', 'civil_works_contract', 10, 'Measurements & RA Billing'),
    ('civil_infrastructure', 'civil_works_contract', 11, 'Final Inspection & Defect Rectification'),
    ('civil_infrastructure', 'civil_works_contract', 12, 'Project Completion & Handover'),
    ('road_drainage', 'civil_works_contract', 1, 'Tender & Work Order'),
    ('road_drainage', 'civil_works_contract', 2, 'Survey, Alignment & Setting Out'),
    ('road_drainage', 'civil_works_contract', 3, 'BOQ & Project Planning'),
    ('road_drainage', 'civil_works_contract', 4, 'Approvals & Site Mobilization'),
    ('road_drainage', 'civil_works_contract', 5, 'Site Clearing & Earthwork'),
    ('road_drainage', 'civil_works_contract', 6, 'Subgrade Preparation & Compaction'),
    ('road_drainage', 'civil_works_contract', 7, 'Drainage, Culverts & Pipe Laying'),
    ('road_drainage', 'civil_works_contract', 8, 'Base Course & Road Construction'),
    ('road_drainage', 'civil_works_contract', 9, 'Chambers, Kerbs & Ancillary Works'),
    ('road_drainage', 'civil_works_contract', 10, 'Road Surface & Finishing'),
    ('road_drainage', 'civil_works_contract', 11, 'Quality Testing & Final Inspection'),
    ('road_drainage', 'civil_works_contract', 12, 'Measurements & Project Handover'),
    ('structural_works', 'civil_works_contract', 1, 'Tender / Client Requirements & Work Order'),
    ('structural_works', 'civil_works_contract', 2, 'Structural Survey & Assessment'),
    ('structural_works', 'civil_works_contract', 3, 'Structural Design & Engineering'),
    ('structural_works', 'civil_works_contract', 4, 'BOQ, Estimation & Planning'),
    ('structural_works', 'civil_works_contract', 5, 'Approvals & Site Mobilization'),
    ('structural_works', 'civil_works_contract', 6, 'Foundation & Substructure Works'),
    ('structural_works', 'civil_works_contract', 7, 'RCC / Steel Structural Works'),
    ('structural_works', 'civil_works_contract', 8, 'Fabrication & Erection (where applicable)'),
    ('structural_works', 'civil_works_contract', 9, 'Structural Finishing & Protection'),
    ('structural_works', 'civil_works_contract', 10, 'Load Testing / Quality Testing (where applicable)'),
    ('structural_works', 'civil_works_contract', 11, 'Structural Inspection & Rectification'),
    ('structural_works', 'civil_works_contract', 12, 'Completion & Handover'),
    ('material_supply', 'material_supply', 1, 'Customer Enquiry & Requirement'),
    ('material_supply', 'material_supply', 2, 'Quotation & Order Confirmation'),
    ('material_supply', 'material_supply', 3, 'Material Procurement / Stock Allocation'),
    ('material_supply', 'material_supply', 4, 'Quality & Quantity Verification'),
    ('material_supply', 'material_supply', 5, 'Dispatch & Transportation'),
    ('material_supply', 'material_supply', 6, 'Site Delivery & Acknowledgement')
  ), required_types AS (
    SELECT DISTINCT lower(project_code) AS project_code
    FROM authoritative_raw
  ), active_global_types AS (
    SELECT lower(code) AS code
    FROM public.project_types
    WHERE company_id IS NULL
      AND is_active = true
  ), missing_types AS (
    SELECT rt.project_code
    FROM required_types rt
    LEFT JOIN active_global_types agt
      ON agt.code = rt.project_code
    WHERE agt.code IS NULL
  )
  SELECT array_agg(project_code ORDER BY project_code)
  INTO v_missing_non_optional
  FROM missing_types
  WHERE project_code <> 'material_supply';

  IF coalesce(array_length(v_missing_non_optional, 1), 0) > 0 THEN
    RAISE EXCEPTION
      '0031 aborted: missing active global project_type code(s): %',
      array_to_string(v_missing_non_optional, ', ')
      USING HINT = 'Create/activate these project_types before running 0031.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.project_types
    WHERE company_id IS NULL
      AND is_active = true
      AND lower(code) = 'material_supply'
  ) INTO v_missing_material_supply;

  IF NOT v_missing_material_supply THEN
    RAISE NOTICE 'material_supply project_type is not active/present; optional workflow stages will be skipped.';
  END IF;

  WITH authoritative_raw(project_code, business_model, sequence_number, stage_name) AS (
VALUES
    ('independent_house', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('independent_house', 'contract_construction', 2, 'Architectural Design & Drawings'),
    ('independent_house', 'contract_construction', 3, 'Estimation, Quotation & Agreement'),
    ('independent_house', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('independent_house', 'contract_construction', 5, 'Foundation & Plinth Construction'),
    ('independent_house', 'contract_construction', 6, 'Structural Construction'),
    ('independent_house', 'contract_construction', 7, 'Brickwork & Masonry'),
    ('independent_house', 'contract_construction', 8, 'Plastering & Waterproofing'),
    ('independent_house', 'contract_construction', 9, 'Electrical & Plumbing Works'),
    ('independent_house', 'contract_construction', 10, 'Flooring, Doors & Windows'),
    ('independent_house', 'contract_construction', 11, 'Painting & Final Finishing'),
    ('independent_house', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('villa', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('villa', 'contract_construction', 2, 'Architectural Design & 3D Elevation'),
    ('villa', 'contract_construction', 3, 'Structural & Engineering Design'),
    ('villa', 'contract_construction', 4, 'Estimation, Quotation & Agreement'),
    ('villa', 'contract_construction', 5, 'Approvals & Site Mobilization'),
    ('villa', 'contract_construction', 6, 'Foundation & Plinth Construction'),
    ('villa', 'contract_construction', 7, 'Structural Construction'),
    ('villa', 'contract_construction', 8, 'Masonry, Plastering & Waterproofing'),
    ('villa', 'contract_construction', 9, 'Electrical, Plumbing & HVAC Works'),
    ('villa', 'contract_construction', 10, 'Flooring, Doors, Windows & Joinery'),
    ('villa', 'contract_construction', 11, 'Interior, Exterior & Landscape Finishing'),
    ('villa', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('apartment', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('apartment', 'contract_construction', 2, 'Architectural Design & Engineering'),
    ('apartment', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('apartment', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('apartment', 'contract_construction', 5, 'Foundation & Basement Construction'),
    ('apartment', 'contract_construction', 6, 'Structural Construction'),
    ('apartment', 'contract_construction', 7, 'Masonry & Internal Plastering'),
    ('apartment', 'contract_construction', 8, 'Electrical, Plumbing & Fire Systems'),
    ('apartment', 'contract_construction', 9, 'Flooring, Doors & Windows'),
    ('apartment', 'contract_construction', 10, 'Painting & Internal Finishing'),
    ('apartment', 'contract_construction', 11, 'Lifts, Common Areas & External Works'),
    ('apartment', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('commercial_building', 'contract_construction', 1, 'Client Requirements & Space Planning'),
    ('commercial_building', 'contract_construction', 2, 'Architectural & Engineering Design'),
    ('commercial_building', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('commercial_building', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('commercial_building', 'contract_construction', 5, 'Foundation & Basement Construction'),
    ('commercial_building', 'contract_construction', 6, 'Structural Construction'),
    ('commercial_building', 'contract_construction', 7, 'Masonry & Building Envelope'),
    ('commercial_building', 'contract_construction', 8, 'Electrical, Plumbing, HVAC & Fire Systems'),
    ('commercial_building', 'contract_construction', 9, 'Flooring, Ceilings & Interior Works'),
    ('commercial_building', 'contract_construction', 10, 'Elevation & External Finishing'),
    ('commercial_building', 'contract_construction', 11, 'Testing, Commissioning & Inspection'),
    ('commercial_building', 'contract_construction', 12, 'Client Handover'),
    ('renovation', 'contract_construction', 1, 'Existing Site Inspection & Assessment'),
    ('renovation', 'contract_construction', 2, 'Client Requirements & Scope Finalization'),
    ('renovation', 'contract_construction', 3, 'Design, Drawings & Estimation'),
    ('renovation', 'contract_construction', 4, 'Agreement & Site Preparation'),
    ('renovation', 'contract_construction', 5, 'Demolition & Dismantling'),
    ('renovation', 'contract_construction', 6, 'Structural Repairs & Modifications'),
    ('renovation', 'contract_construction', 7, 'Masonry & Plastering'),
    ('renovation', 'contract_construction', 8, 'Electrical & Plumbing Modifications'),
    ('renovation', 'contract_construction', 9, 'Flooring, Doors & Windows'),
    ('renovation', 'contract_construction', 10, 'Painting & Finishing'),
    ('renovation', 'contract_construction', 11, 'Final Inspection & Snag Rectification'),
    ('renovation', 'contract_construction', 12, 'Client Handover'),
    ('building_extension', 'contract_construction', 1, 'Existing Building Assessment'),
    ('building_extension', 'contract_construction', 2, 'Extension Planning & Design'),
    ('building_extension', 'contract_construction', 3, 'Structural Feasibility & Engineering'),
    ('building_extension', 'contract_construction', 4, 'Estimation, Agreement & Approvals'),
    ('building_extension', 'contract_construction', 5, 'Site Preparation & Protection'),
    ('building_extension', 'contract_construction', 6, 'Foundation & Structural Modifications'),
    ('building_extension', 'contract_construction', 7, 'New Structural Construction'),
    ('building_extension', 'contract_construction', 8, 'Masonry & Plastering'),
    ('building_extension', 'contract_construction', 9, 'Electrical & Plumbing Extensions'),
    ('building_extension', 'contract_construction', 10, 'Flooring & Finishing'),
    ('building_extension', 'contract_construction', 11, 'Integration & Quality Inspection'),
    ('building_extension', 'contract_construction', 12, 'Client Handover'),
    ('industrial_warehouse', 'contract_construction', 1, 'Client Requirements & Industrial Planning'),
    ('industrial_warehouse', 'contract_construction', 2, 'Architectural & Structural Design'),
    ('industrial_warehouse', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('industrial_warehouse', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('industrial_warehouse', 'contract_construction', 5, 'Site Development & Earthwork'),
    ('industrial_warehouse', 'contract_construction', 6, 'Foundation & Industrial Flooring'),
    ('industrial_warehouse', 'contract_construction', 7, 'Structural Steel / RCC Construction'),
    ('industrial_warehouse', 'contract_construction', 8, 'Roofing & Cladding'),
    ('industrial_warehouse', 'contract_construction', 9, 'Electrical, Plumbing & Fire Systems'),
    ('industrial_warehouse', 'contract_construction', 10, 'Flooring, Drainage & External Development'),
    ('industrial_warehouse', 'contract_construction', 11, 'Testing, Inspection & Commissioning'),
    ('industrial_warehouse', 'contract_construction', 12, 'Client Handover'),
    ('interior_fitout', 'contract_construction', 1, 'Site Survey & Client Requirements'),
    ('interior_fitout', 'contract_construction', 2, 'Space Planning & Interior Design'),
    ('interior_fitout', 'contract_construction', 3, 'Material Selection & BOQ'),
    ('interior_fitout', 'contract_construction', 4, 'Quotation, Agreement & Mobilization'),
    ('interior_fitout', 'contract_construction', 5, 'Dismantling & Site Preparation'),
    ('interior_fitout', 'contract_construction', 6, 'Civil & Partition Works'),
    ('interior_fitout', 'contract_construction', 7, 'Electrical, Plumbing & HVAC Works'),
    ('interior_fitout', 'contract_construction', 8, 'Ceiling & Flooring Works'),
    ('interior_fitout', 'contract_construction', 9, 'Carpentry & Custom Furniture'),
    ('interior_fitout', 'contract_construction', 10, 'Painting, Fixtures & Finishing'),
    ('interior_fitout', 'contract_construction', 11, 'Final Inspection & Snag Rectification'),
    ('interior_fitout', 'contract_construction', 12, 'Client Handover'),
    ('apartment', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('apartment', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('apartment', 'property_development', 3, 'Feasibility & Project Planning'),
    ('apartment', 'property_development', 4, 'Architectural & Engineering Design'),
    ('apartment', 'property_development', 5, 'Building Approvals & Statutory Clearances'),
    ('apartment', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('apartment', 'property_development', 7, 'Site Mobilization & Preparation'),
    ('apartment', 'property_development', 8, 'Foundation & Basement Construction'),
    ('apartment', 'property_development', 9, 'Structural Construction'),
    ('apartment', 'property_development', 10, 'MEP & Internal Infrastructure'),
    ('apartment', 'property_development', 11, 'Finishing & Common Area Development'),
    ('apartment', 'property_development', 12, 'Quality Inspection & Occupancy Approval'),
    ('apartment', 'property_development', 13, 'Sales, Registration & Customer Handover'),
    ('villa', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('villa', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('villa', 'property_development', 3, 'Feasibility & Villa Planning'),
    ('villa', 'property_development', 4, 'Architectural & Engineering Design'),
    ('villa', 'property_development', 5, 'Approvals & Statutory Clearances'),
    ('villa', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('villa', 'property_development', 7, 'Site Development & Infrastructure'),
    ('villa', 'property_development', 8, 'Villa Foundation & Structural Construction'),
    ('villa', 'property_development', 9, 'Masonry, Roofing & Waterproofing'),
    ('villa', 'property_development', 10, 'MEP & Interior Finishing'),
    ('villa', 'property_development', 11, 'Landscaping & Common Amenities'),
    ('villa', 'property_development', 12, 'Quality Inspection & Occupancy Approval'),
    ('villa', 'property_development', 13, 'Sales, Registration & Customer Handover'),
    ('commercial_building', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('commercial_building', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('commercial_building', 'property_development', 3, 'Market Feasibility & Project Planning'),
    ('commercial_building', 'property_development', 4, 'Architectural & Engineering Design'),
    ('commercial_building', 'property_development', 5, 'Building Approvals & Statutory Clearances'),
    ('commercial_building', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('commercial_building', 'property_development', 7, 'Site Mobilization & Preparation'),
    ('commercial_building', 'property_development', 8, 'Foundation & Basement Construction'),
    ('commercial_building', 'property_development', 9, 'Structural Construction'),
    ('commercial_building', 'property_development', 10, 'MEP, Fire Systems & Building Services'),
    ('commercial_building', 'property_development', 11, 'Interior, External & Common Area Finishing'),
    ('commercial_building', 'property_development', 12, 'Testing, Occupancy Approval & Completion'),
    ('commercial_building', 'property_development', 13, 'Leasing / Sales, Registration & Handover'),
    ('civil_infrastructure', 'civil_works_contract', 1, 'Tender & Work Order'),
    ('civil_infrastructure', 'civil_works_contract', 2, 'Site Survey & Technical Planning'),
    ('civil_infrastructure', 'civil_works_contract', 3, 'BOQ, Estimation & Project Scheduling'),
    ('civil_infrastructure', 'civil_works_contract', 4, 'Approvals & Site Mobilization'),
    ('civil_infrastructure', 'civil_works_contract', 5, 'Site Clearing & Earthwork'),
    ('civil_infrastructure', 'civil_works_contract', 6, 'Foundation & Main Civil Works'),
    ('civil_infrastructure', 'civil_works_contract', 7, 'Structural & Infrastructure Construction'),
    ('civil_infrastructure', 'civil_works_contract', 8, 'Ancillary Works & Finishing'),
    ('civil_infrastructure', 'civil_works_contract', 9, 'Quality Testing & Inspection'),
    ('civil_infrastructure', 'civil_works_contract', 10, 'Measurements & RA Billing'),
    ('civil_infrastructure', 'civil_works_contract', 11, 'Final Inspection & Defect Rectification'),
    ('civil_infrastructure', 'civil_works_contract', 12, 'Project Completion & Handover'),
    ('road_drainage', 'civil_works_contract', 1, 'Tender & Work Order'),
    ('road_drainage', 'civil_works_contract', 2, 'Survey, Alignment & Setting Out'),
    ('road_drainage', 'civil_works_contract', 3, 'BOQ & Project Planning'),
    ('road_drainage', 'civil_works_contract', 4, 'Approvals & Site Mobilization'),
    ('road_drainage', 'civil_works_contract', 5, 'Site Clearing & Earthwork'),
    ('road_drainage', 'civil_works_contract', 6, 'Subgrade Preparation & Compaction'),
    ('road_drainage', 'civil_works_contract', 7, 'Drainage, Culverts & Pipe Laying'),
    ('road_drainage', 'civil_works_contract', 8, 'Base Course & Road Construction'),
    ('road_drainage', 'civil_works_contract', 9, 'Chambers, Kerbs & Ancillary Works'),
    ('road_drainage', 'civil_works_contract', 10, 'Road Surface & Finishing'),
    ('road_drainage', 'civil_works_contract', 11, 'Quality Testing & Final Inspection'),
    ('road_drainage', 'civil_works_contract', 12, 'Measurements & Project Handover'),
    ('structural_works', 'civil_works_contract', 1, 'Tender / Client Requirements & Work Order'),
    ('structural_works', 'civil_works_contract', 2, 'Structural Survey & Assessment'),
    ('structural_works', 'civil_works_contract', 3, 'Structural Design & Engineering'),
    ('structural_works', 'civil_works_contract', 4, 'BOQ, Estimation & Planning'),
    ('structural_works', 'civil_works_contract', 5, 'Approvals & Site Mobilization'),
    ('structural_works', 'civil_works_contract', 6, 'Foundation & Substructure Works'),
    ('structural_works', 'civil_works_contract', 7, 'RCC / Steel Structural Works'),
    ('structural_works', 'civil_works_contract', 8, 'Fabrication & Erection (where applicable)'),
    ('structural_works', 'civil_works_contract', 9, 'Structural Finishing & Protection'),
    ('structural_works', 'civil_works_contract', 10, 'Load Testing / Quality Testing (where applicable)'),
    ('structural_works', 'civil_works_contract', 11, 'Structural Inspection & Rectification'),
    ('structural_works', 'civil_works_contract', 12, 'Completion & Handover'),
    ('material_supply', 'material_supply', 1, 'Customer Enquiry & Requirement'),
    ('material_supply', 'material_supply', 2, 'Quotation & Order Confirmation'),
    ('material_supply', 'material_supply', 3, 'Material Procurement / Stock Allocation'),
    ('material_supply', 'material_supply', 4, 'Quality & Quantity Verification'),
    ('material_supply', 'material_supply', 5, 'Dispatch & Transportation'),
    ('material_supply', 'material_supply', 6, 'Site Delivery & Acknowledgement')
  ), authoritative_defs AS (
    SELECT
      lower(project_code) AS project_code,
      business_model,
      sequence_number,
      stage_name,
      regexp_replace(
        trim(both '_' from regexp_replace(
          regexp_replace(
            regexp_replace(lower(stage_name), '&', 'and', 'g'),
            '\(.*?\)',
            ' ',
            'g'
          ),
          '[^a-z0-9]+',
          '_',
          'g'
        )),
        '_+',
        '_',
        'g'
      ) AS template_code
    FROM authoritative_raw
  ), resolved_defs AS (
    SELECT
      pt.id AS project_type_id,
      d.business_model,
      d.template_code,
      d.stage_name,
      d.sequence_number
    FROM authoritative_defs d
    JOIN public.project_types pt
      ON pt.company_id IS NULL
     AND pt.is_active = true
     AND lower(pt.code) = d.project_code
  ), existing_targeted AS (
    SELECT
      pst.id,
      pst.project_type_id,
      pst.business_model,
      pst.template_code,
      pst.sequence_number,
      pst.name
    FROM public.project_stage_templates pst
    JOIN resolved_defs d
      ON d.project_type_id = pst.project_type_id
     AND d.business_model = pst.business_model
    WHERE pst.company_id IS NULL
  ), exact_code_matches AS (
    SELECT e.id
    FROM existing_targeted e
    JOIN resolved_defs d
      ON d.project_type_id = e.project_type_id
     AND d.business_model = e.business_model
     AND lower(d.template_code) = lower(e.template_code)
  ), sequence_candidates AS (
    SELECT
      e.id,
      e.project_type_id,
      e.business_model,
      d.template_code,
      d.stage_name,
      row_number() OVER (
        PARTITION BY e.id
        ORDER BY d.sequence_number, d.template_code
      ) AS rn_for_existing,
      row_number() OVER (
        PARTITION BY d.project_type_id, d.business_model, d.sequence_number
        ORDER BY e.id
      ) AS rn_for_target
    FROM existing_targeted e
    JOIN resolved_defs d
      ON d.project_type_id = e.project_type_id
     AND d.business_model = e.business_model
     AND d.sequence_number = e.sequence_number
    LEFT JOIN exact_code_matches m
      ON m.id = e.id
    WHERE m.id IS NULL
  ), sequence_reconcile AS (
    SELECT
      sc.id,
      sc.project_type_id,
      sc.business_model,
      sc.template_code,
      sc.stage_name
    FROM sequence_candidates sc
    WHERE sc.rn_for_existing = 1
      AND sc.rn_for_target = 1
  ), sequence_reconcile_apply AS (
    UPDATE public.project_stage_templates pst
    SET
      template_code = sr.template_code,
      name = sr.stage_name,
      updated_at = now()
    FROM sequence_reconcile sr
    WHERE pst.id = sr.id
      AND (
        lower(pst.template_code) <> lower(sr.template_code)
        OR pst.name IS DISTINCT FROM sr.stage_name
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.project_stage_templates clash
        WHERE clash.company_id IS NULL
          AND clash.project_type_id = sr.project_type_id
          AND clash.business_model = sr.business_model
          AND lower(clash.template_code) = lower(sr.template_code)
          AND clash.id <> pst.id
      )
    RETURNING pst.id
  )
  SELECT count(*)
  INTO v_ambiguous_count
  FROM existing_targeted e
  LEFT JOIN resolved_defs d
    ON d.project_type_id = e.project_type_id
   AND d.business_model = e.business_model
   AND lower(d.template_code) = lower(e.template_code)
  WHERE d.template_code IS NULL;

  IF v_ambiguous_count > 0 THEN
    RAISE NOTICE
      '0031: % existing template rows still cannot be mapped by exact template_code; leaving them unchanged.',
      v_ambiguous_count
      USING HINT = 'Review out/stage-templates-0031-reconciliation-report.md to explicitly map/deactivate residual rows if needed.';
  END IF;
END $$;

WITH authoritative_raw(project_code, business_model, sequence_number, stage_name) AS (
VALUES
    ('independent_house', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('independent_house', 'contract_construction', 2, 'Architectural Design & Drawings'),
    ('independent_house', 'contract_construction', 3, 'Estimation, Quotation & Agreement'),
    ('independent_house', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('independent_house', 'contract_construction', 5, 'Foundation & Plinth Construction'),
    ('independent_house', 'contract_construction', 6, 'Structural Construction'),
    ('independent_house', 'contract_construction', 7, 'Brickwork & Masonry'),
    ('independent_house', 'contract_construction', 8, 'Plastering & Waterproofing'),
    ('independent_house', 'contract_construction', 9, 'Electrical & Plumbing Works'),
    ('independent_house', 'contract_construction', 10, 'Flooring, Doors & Windows'),
    ('independent_house', 'contract_construction', 11, 'Painting & Final Finishing'),
    ('independent_house', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('villa', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('villa', 'contract_construction', 2, 'Architectural Design & 3D Elevation'),
    ('villa', 'contract_construction', 3, 'Structural & Engineering Design'),
    ('villa', 'contract_construction', 4, 'Estimation, Quotation & Agreement'),
    ('villa', 'contract_construction', 5, 'Approvals & Site Mobilization'),
    ('villa', 'contract_construction', 6, 'Foundation & Plinth Construction'),
    ('villa', 'contract_construction', 7, 'Structural Construction'),
    ('villa', 'contract_construction', 8, 'Masonry, Plastering & Waterproofing'),
    ('villa', 'contract_construction', 9, 'Electrical, Plumbing & HVAC Works'),
    ('villa', 'contract_construction', 10, 'Flooring, Doors, Windows & Joinery'),
    ('villa', 'contract_construction', 11, 'Interior, Exterior & Landscape Finishing'),
    ('villa', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('apartment', 'contract_construction', 1, 'Client Requirements & Project Planning'),
    ('apartment', 'contract_construction', 2, 'Architectural Design & Engineering'),
    ('apartment', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('apartment', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('apartment', 'contract_construction', 5, 'Foundation & Basement Construction'),
    ('apartment', 'contract_construction', 6, 'Structural Construction'),
    ('apartment', 'contract_construction', 7, 'Masonry & Internal Plastering'),
    ('apartment', 'contract_construction', 8, 'Electrical, Plumbing & Fire Systems'),
    ('apartment', 'contract_construction', 9, 'Flooring, Doors & Windows'),
    ('apartment', 'contract_construction', 10, 'Painting & Internal Finishing'),
    ('apartment', 'contract_construction', 11, 'Lifts, Common Areas & External Works'),
    ('apartment', 'contract_construction', 12, 'Quality Inspection & Client Handover'),
    ('commercial_building', 'contract_construction', 1, 'Client Requirements & Space Planning'),
    ('commercial_building', 'contract_construction', 2, 'Architectural & Engineering Design'),
    ('commercial_building', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('commercial_building', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('commercial_building', 'contract_construction', 5, 'Foundation & Basement Construction'),
    ('commercial_building', 'contract_construction', 6, 'Structural Construction'),
    ('commercial_building', 'contract_construction', 7, 'Masonry & Building Envelope'),
    ('commercial_building', 'contract_construction', 8, 'Electrical, Plumbing, HVAC & Fire Systems'),
    ('commercial_building', 'contract_construction', 9, 'Flooring, Ceilings & Interior Works'),
    ('commercial_building', 'contract_construction', 10, 'Elevation & External Finishing'),
    ('commercial_building', 'contract_construction', 11, 'Testing, Commissioning & Inspection'),
    ('commercial_building', 'contract_construction', 12, 'Client Handover'),
    ('renovation', 'contract_construction', 1, 'Existing Site Inspection & Assessment'),
    ('renovation', 'contract_construction', 2, 'Client Requirements & Scope Finalization'),
    ('renovation', 'contract_construction', 3, 'Design, Drawings & Estimation'),
    ('renovation', 'contract_construction', 4, 'Agreement & Site Preparation'),
    ('renovation', 'contract_construction', 5, 'Demolition & Dismantling'),
    ('renovation', 'contract_construction', 6, 'Structural Repairs & Modifications'),
    ('renovation', 'contract_construction', 7, 'Masonry & Plastering'),
    ('renovation', 'contract_construction', 8, 'Electrical & Plumbing Modifications'),
    ('renovation', 'contract_construction', 9, 'Flooring, Doors & Windows'),
    ('renovation', 'contract_construction', 10, 'Painting & Finishing'),
    ('renovation', 'contract_construction', 11, 'Final Inspection & Snag Rectification'),
    ('renovation', 'contract_construction', 12, 'Client Handover'),
    ('building_extension', 'contract_construction', 1, 'Existing Building Assessment'),
    ('building_extension', 'contract_construction', 2, 'Extension Planning & Design'),
    ('building_extension', 'contract_construction', 3, 'Structural Feasibility & Engineering'),
    ('building_extension', 'contract_construction', 4, 'Estimation, Agreement & Approvals'),
    ('building_extension', 'contract_construction', 5, 'Site Preparation & Protection'),
    ('building_extension', 'contract_construction', 6, 'Foundation & Structural Modifications'),
    ('building_extension', 'contract_construction', 7, 'New Structural Construction'),
    ('building_extension', 'contract_construction', 8, 'Masonry & Plastering'),
    ('building_extension', 'contract_construction', 9, 'Electrical & Plumbing Extensions'),
    ('building_extension', 'contract_construction', 10, 'Flooring & Finishing'),
    ('building_extension', 'contract_construction', 11, 'Integration & Quality Inspection'),
    ('building_extension', 'contract_construction', 12, 'Client Handover'),
    ('industrial_warehouse', 'contract_construction', 1, 'Client Requirements & Industrial Planning'),
    ('industrial_warehouse', 'contract_construction', 2, 'Architectural & Structural Design'),
    ('industrial_warehouse', 'contract_construction', 3, 'Estimation, BOQ & Agreement'),
    ('industrial_warehouse', 'contract_construction', 4, 'Approvals & Site Mobilization'),
    ('industrial_warehouse', 'contract_construction', 5, 'Site Development & Earthwork'),
    ('industrial_warehouse', 'contract_construction', 6, 'Foundation & Industrial Flooring'),
    ('industrial_warehouse', 'contract_construction', 7, 'Structural Steel / RCC Construction'),
    ('industrial_warehouse', 'contract_construction', 8, 'Roofing & Cladding'),
    ('industrial_warehouse', 'contract_construction', 9, 'Electrical, Plumbing & Fire Systems'),
    ('industrial_warehouse', 'contract_construction', 10, 'Flooring, Drainage & External Development'),
    ('industrial_warehouse', 'contract_construction', 11, 'Testing, Inspection & Commissioning'),
    ('industrial_warehouse', 'contract_construction', 12, 'Client Handover'),
    ('interior_fitout', 'contract_construction', 1, 'Site Survey & Client Requirements'),
    ('interior_fitout', 'contract_construction', 2, 'Space Planning & Interior Design'),
    ('interior_fitout', 'contract_construction', 3, 'Material Selection & BOQ'),
    ('interior_fitout', 'contract_construction', 4, 'Quotation, Agreement & Mobilization'),
    ('interior_fitout', 'contract_construction', 5, 'Dismantling & Site Preparation'),
    ('interior_fitout', 'contract_construction', 6, 'Civil & Partition Works'),
    ('interior_fitout', 'contract_construction', 7, 'Electrical, Plumbing & HVAC Works'),
    ('interior_fitout', 'contract_construction', 8, 'Ceiling & Flooring Works'),
    ('interior_fitout', 'contract_construction', 9, 'Carpentry & Custom Furniture'),
    ('interior_fitout', 'contract_construction', 10, 'Painting, Fixtures & Finishing'),
    ('interior_fitout', 'contract_construction', 11, 'Final Inspection & Snag Rectification'),
    ('interior_fitout', 'contract_construction', 12, 'Client Handover'),
    ('apartment', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('apartment', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('apartment', 'property_development', 3, 'Feasibility & Project Planning'),
    ('apartment', 'property_development', 4, 'Architectural & Engineering Design'),
    ('apartment', 'property_development', 5, 'Building Approvals & Statutory Clearances'),
    ('apartment', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('apartment', 'property_development', 7, 'Site Mobilization & Preparation'),
    ('apartment', 'property_development', 8, 'Foundation & Basement Construction'),
    ('apartment', 'property_development', 9, 'Structural Construction'),
    ('apartment', 'property_development', 10, 'MEP & Internal Infrastructure'),
    ('apartment', 'property_development', 11, 'Finishing & Common Area Development'),
    ('apartment', 'property_development', 12, 'Quality Inspection & Occupancy Approval'),
    ('apartment', 'property_development', 13, 'Sales, Registration & Customer Handover'),
    ('villa', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('villa', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('villa', 'property_development', 3, 'Feasibility & Villa Planning'),
    ('villa', 'property_development', 4, 'Architectural & Engineering Design'),
    ('villa', 'property_development', 5, 'Approvals & Statutory Clearances'),
    ('villa', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('villa', 'property_development', 7, 'Site Development & Infrastructure'),
    ('villa', 'property_development', 8, 'Villa Foundation & Structural Construction'),
    ('villa', 'property_development', 9, 'Masonry, Roofing & Waterproofing'),
    ('villa', 'property_development', 10, 'MEP & Interior Finishing'),
    ('villa', 'property_development', 11, 'Landscaping & Common Amenities'),
    ('villa', 'property_development', 12, 'Quality Inspection & Occupancy Approval'),
    ('villa', 'property_development', 13, 'Sales, Registration & Customer Handover'),
    ('commercial_building', 'property_development', 1, 'Land Due Diligence & Title Verification'),
    ('commercial_building', 'property_development', 2, 'Land Acquisition & Development Agreement'),
    ('commercial_building', 'property_development', 3, 'Market Feasibility & Project Planning'),
    ('commercial_building', 'property_development', 4, 'Architectural & Engineering Design'),
    ('commercial_building', 'property_development', 5, 'Building Approvals & Statutory Clearances'),
    ('commercial_building', 'property_development', 6, 'RERA Registration & Project Launch (if applicable)'),
    ('commercial_building', 'property_development', 7, 'Site Mobilization & Preparation'),
    ('commercial_building', 'property_development', 8, 'Foundation & Basement Construction'),
    ('commercial_building', 'property_development', 9, 'Structural Construction'),
    ('commercial_building', 'property_development', 10, 'MEP, Fire Systems & Building Services'),
    ('commercial_building', 'property_development', 11, 'Interior, External & Common Area Finishing'),
    ('commercial_building', 'property_development', 12, 'Testing, Occupancy Approval & Completion'),
    ('commercial_building', 'property_development', 13, 'Leasing / Sales, Registration & Handover'),
    ('civil_infrastructure', 'civil_works_contract', 1, 'Tender & Work Order'),
    ('civil_infrastructure', 'civil_works_contract', 2, 'Site Survey & Technical Planning'),
    ('civil_infrastructure', 'civil_works_contract', 3, 'BOQ, Estimation & Project Scheduling'),
    ('civil_infrastructure', 'civil_works_contract', 4, 'Approvals & Site Mobilization'),
    ('civil_infrastructure', 'civil_works_contract', 5, 'Site Clearing & Earthwork'),
    ('civil_infrastructure', 'civil_works_contract', 6, 'Foundation & Main Civil Works'),
    ('civil_infrastructure', 'civil_works_contract', 7, 'Structural & Infrastructure Construction'),
    ('civil_infrastructure', 'civil_works_contract', 8, 'Ancillary Works & Finishing'),
    ('civil_infrastructure', 'civil_works_contract', 9, 'Quality Testing & Inspection'),
    ('civil_infrastructure', 'civil_works_contract', 10, 'Measurements & RA Billing'),
    ('civil_infrastructure', 'civil_works_contract', 11, 'Final Inspection & Defect Rectification'),
    ('civil_infrastructure', 'civil_works_contract', 12, 'Project Completion & Handover'),
    ('road_drainage', 'civil_works_contract', 1, 'Tender & Work Order'),
    ('road_drainage', 'civil_works_contract', 2, 'Survey, Alignment & Setting Out'),
    ('road_drainage', 'civil_works_contract', 3, 'BOQ & Project Planning'),
    ('road_drainage', 'civil_works_contract', 4, 'Approvals & Site Mobilization'),
    ('road_drainage', 'civil_works_contract', 5, 'Site Clearing & Earthwork'),
    ('road_drainage', 'civil_works_contract', 6, 'Subgrade Preparation & Compaction'),
    ('road_drainage', 'civil_works_contract', 7, 'Drainage, Culverts & Pipe Laying'),
    ('road_drainage', 'civil_works_contract', 8, 'Base Course & Road Construction'),
    ('road_drainage', 'civil_works_contract', 9, 'Chambers, Kerbs & Ancillary Works'),
    ('road_drainage', 'civil_works_contract', 10, 'Road Surface & Finishing'),
    ('road_drainage', 'civil_works_contract', 11, 'Quality Testing & Final Inspection'),
    ('road_drainage', 'civil_works_contract', 12, 'Measurements & Project Handover'),
    ('structural_works', 'civil_works_contract', 1, 'Tender / Client Requirements & Work Order'),
    ('structural_works', 'civil_works_contract', 2, 'Structural Survey & Assessment'),
    ('structural_works', 'civil_works_contract', 3, 'Structural Design & Engineering'),
    ('structural_works', 'civil_works_contract', 4, 'BOQ, Estimation & Planning'),
    ('structural_works', 'civil_works_contract', 5, 'Approvals & Site Mobilization'),
    ('structural_works', 'civil_works_contract', 6, 'Foundation & Substructure Works'),
    ('structural_works', 'civil_works_contract', 7, 'RCC / Steel Structural Works'),
    ('structural_works', 'civil_works_contract', 8, 'Fabrication & Erection (where applicable)'),
    ('structural_works', 'civil_works_contract', 9, 'Structural Finishing & Protection'),
    ('structural_works', 'civil_works_contract', 10, 'Load Testing / Quality Testing (where applicable)'),
    ('structural_works', 'civil_works_contract', 11, 'Structural Inspection & Rectification'),
    ('structural_works', 'civil_works_contract', 12, 'Completion & Handover'),
    ('material_supply', 'material_supply', 1, 'Customer Enquiry & Requirement'),
    ('material_supply', 'material_supply', 2, 'Quotation & Order Confirmation'),
    ('material_supply', 'material_supply', 3, 'Material Procurement / Stock Allocation'),
    ('material_supply', 'material_supply', 4, 'Quality & Quantity Verification'),
    ('material_supply', 'material_supply', 5, 'Dispatch & Transportation'),
    ('material_supply', 'material_supply', 6, 'Site Delivery & Acknowledgement')
), authoritative_defs AS (
  SELECT
    lower(project_code) AS project_code,
    business_model,
    sequence_number,
    stage_name,
    regexp_replace(
      trim(both '_' from regexp_replace(
        regexp_replace(
          regexp_replace(lower(stage_name), '&', 'and', 'g'),
          '\(.*?\)',
          ' ',
          'g'
        ),
        '[^a-z0-9]+',
        '_',
        'g'
      )),
      '_+',
      '_',
      'g'
    ) AS template_code
  FROM authoritative_raw
), resolved_defs AS (
  SELECT
    NULL::uuid AS company_id,
    pt.id AS project_type_id,
    d.business_model,
    d.template_code,
    d.stage_name AS name,
    d.sequence_number,
    0::numeric AS default_completion_percentage,
    true AS is_active
  FROM authoritative_defs d
  JOIN public.project_types pt
    ON pt.company_id IS NULL
   AND pt.is_active = true
   AND lower(pt.code) = d.project_code
)
INSERT INTO public.project_stage_templates (
  company_id,
  project_type_id,
  business_model,
  template_code,
  name,
  sequence_number,
  default_completion_percentage,
  is_active
)
SELECT
  r.company_id,
  r.project_type_id,
  r.business_model,
  r.template_code,
  r.name,
  r.sequence_number,
  r.default_completion_percentage,
  r.is_active
FROM resolved_defs r
ON CONFLICT ON CONSTRAINT uq_project_stage_templates
DO UPDATE SET
  name = EXCLUDED.name,
  sequence_number = EXCLUDED.sequence_number,
  default_completion_percentage = EXCLUDED.default_completion_percentage,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Explicit deactivations only (none currently authorized).
WITH explicit_deactivate(project_code, business_model, template_code) AS (
  SELECT NULL::text, NULL::text, NULL::text
  WHERE false
)
UPDATE public.project_stage_templates pst
SET
  is_active = false,
  updated_at = now()
FROM explicit_deactivate d
JOIN public.project_types pt
  ON pt.company_id IS NULL
 AND pt.is_active = true
 AND lower(pt.code) = lower(d.project_code)
WHERE pst.company_id IS NULL
  AND pst.project_type_id = pt.id
  AND pst.business_model = d.business_model
  AND lower(pst.template_code) = lower(d.template_code)
  AND pst.is_active = true;

COMMIT;
