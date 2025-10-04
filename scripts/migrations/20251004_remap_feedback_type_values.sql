-- Migration: Remap legacy feedback_type values to new canonical set
-- Old values: service, feature_request, bug_report
-- New canonical values: user_experience, performance, product_service, transactional
-- Mapping strategy:
--   service -> product_service
--   feature_request -> product_service (adjust if you later split features)
--   bug_report -> performance
BEGIN;
UPDATE feedback SET feedback_type = 'product_service' WHERE feedback_type IN ('service','feature_request');
UPDATE feedback SET feedback_type = 'performance' WHERE feedback_type = 'bug_report';
COMMIT;