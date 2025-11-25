#!/usr/bin/env python3
import os
import shutil

# Define the base directory
base_dir = "/home/dmsystems/repos/SMS/SMS-CLEAN/LANDING-PAGE"

# List of directories to remove
dirs_to_remove = [
    "sms-app",
    "SMS-Onboarding-Unified",
    "sms-landing",
    "organized",
    "Architecture",
    "Development",
    "Features",
    "Marketing",
    "Operations",
    "Revenue",
    "Strategy",
    "IP-Protection",
    "Marketing-Materials",
    "database-migrations",
    "node_modules",
    "dist",
    "IDEAS",  # This appears to be a duplicate of *IDEAS
]

# List of files to remove (non-landing page documentation)
files_to_remove = [
    "AWS_DEPLOYMENT_GUIDE.md",
    "BUSINESS_BLUEPRINT.md",
    "CLAUDE.md",
    "COMING_SOON_INSTRUCTIONS.md",
    "COMPLETE_SYSTEM_DOCUMENTATION.md",
    "COMPLETE_SYSTEM_TEST_CHECKLIST.md",
    "COMPREHENSIVE_FIX_IMPLEMENTATION_SUMMARY.md",
    "COMPREHENSIVE_FIX_LIST.md",
    "CONFIGURATION_PHASE_IMPLEMENTATION_SUMMARY.md",
    "CRITICAL_GAPS_ANALYSIS.md",
    "CUSTOMIZATION_IMPLEMENTATION_PLAN.md",
    "CUSTOMIZATION_ONBOARDING_WORKFLOW.md",
    "DAILY_PROGRESS_SUMMARY.md",
    "DATA_COLLECTION_STRATEGY.md",
    "DATA_MANAGEMENT_STRATEGY.md",
    "DEMO_CLIENT_WALKTHROUGH.md",
    "DEMO_DATA_GUIDE.md",
    "DEMO_QUICK_REFERENCE.md",
    "DEPLOYMENT_CHANGES_REVIEW.md",
    "DEPLOYMENT_GUIDE_RAILWAY.md",
    "DEPLOYMENT_READY_STATUS.md",
    "DEPLOYMENT_SUMMARY.md",
    "DEPLOYMENT_VERIFICATION.md",
    "EMAIL_AUTOMATION_README.md",
    "EMAIL_CONFIGURATION_GUIDE.md",
    "EMAIL_SETUP_GUIDE.md",
    "ENGINEER_DAILY_WORKFLOW_GUIDE.md",
    "FEATURES_IMPLEMENTATION_SUMMARY.md",
    "FILE_STORAGE_IMPLEMENTATION.md",
    "LOCAL_DEMO_PLAN.md",
    "MAINTENANCE_PORTAL_INTEGRATION_REQUIREMENTS.md",
    "MAINTENANCE_SYNC_DOCUMENTATION.md",
    "MAINTENANCE_SYSTEM_COMPLETE.md",
    "MANAGER_OPERATIONS_GUIDE.md",
    "MASTER_BUSINESS_PLAN.md",
    "MASTER_EXECUTION_PLAN.md",
    "MASTER_ONBOARDING_BUILD_PLAN_FINAL.md",
    "ONBOARDING_ARCHITECTURE_DECISIONS.md",
    "ONBOARDING_BACKEND_FIX_SUMMARY.md",
    "ONBOARDING_PORTAL_EXECUTION_PLAN.md",
    "PHASE2_ROADMAP.md",
    "PHASED_EXECUTION_PLAN.md",
    "PORTAL_INTEGRATION_GUIDE.md",
    "PORTAL_INTEGRATION_TEST_RESULTS.md",
    "POSTGRESQL_MANUAL_INSTALL.md",
    "POSTGRESQL_SETUP_GUIDE.md",
    "PRACTICAL_CONFIGURATION_WIZARD.md",
    "PROJECT_CONTEXT.md",
    "PROJECT_EXECUTION_PLAN.md",
    "PROJECT_TIMELINE.md",
    "QUICK_START_CONTEXT.md",
    "RAILWAY_ENV_VARS.md",
    "RAILWAY_URL_GUIDE.md",
    "README-MAINTENANCE-PORTAL.md",
    "README-ONBOARDING-PORTAL.md",
    "RESOURCE_ALLOCATION_SUMMARY.md",
    "RISK_ASSESSMENT_MATRIX.md",
    "RUNNING_SERVICES.md",
    "SECURITY_FEATURES_MARKETING.md",
    "SELF_SERVICE_CONFIGURATION_DESIGN.md",
    "SESSION_LOG.md",
    "SETUP_PRODUCTION_EMAIL.md",
    "SHADOW_CLONE_DEPLOYMENT.md",
    "SHADOW_CLONE_DEPLOYMENT_PLAN.md",
    "SHADOW_CLONE_MVP_PLAN.md",
    "SHADOW_CLONE_MVP_PLAN_REVISED.md",
    "SMS_CLIENT_JOURNEY_COMPLETE.md",
    "SMS_ONBOARDING_PLAN.md",
    "SYNC_SERVICE_README.md",
    "SYSTEM_UNDERSTANDING.md",
    "TEAM_COMMUNICATION_DESIGN.md",
    "TEAM_STRUCTURE.md",
    "TEAM_STRUCTURE_IMPLEMENTATION.md",
    "UI_UX_CONSISTENCY_SUMMARY.md",
    "VISION_BRIEF.md",
    "WAVE_EXECUTION_PLAN.md",
    "WORKLOAD_ESTIMATION.md",
    "agent-skill-mapping.md",
    "architecture-design.md",
    "component-ownership-guide.md",
    "feature-spec.md",
    "sms-project-plan.md",
    "*DAILY_PROGRESS_SUMMARY.md"
]

# List of script files to remove (not related to landing page)
scripts_to_remove = [
    "backup-databases.sh",
    "check-deployment.sh",
    "cleanup-unwanted.sh",
    "clear-auth.html",
    "deploy-railway.sh",
    "integrate-demo.sh",
    "landing-page.log",
    "landing.log",
    "nixpacks.toml",
    "open-all-portals.sh",
    "organize-project.sh",
    "preview-email-templates.js",
    "push-to-github.sh",
    "railway.toml",
    "setup-demo-data.js",
    "setup-gmail.sh",
    "setup-postgresql.sh",
    "start-all.sh",
    "start-maintenance-portal.sh",
    "stop-all.sh",
    "test-auth-bridge.js",
    "test-database-connections.js",
    "test-demo-integration.js",
    "test-file-upload.js",
    "test-integration-flow.js",
    "test-integration-manual.sh",
    "test-login.sh",
    "test-maintenance-sync.js",
    "test-portal-integration.js",
    "test-sync-flow.js",
    "test-sync-integration.js",
    "update-floating-to-temporary.sh"
]

# Additional image files to remove (duplicates)
images_to_remove = [
    "smart-maintenance-logo1.png",
    "smart-maintenance-logo2.png"
]

# Remove directories
print("Removing duplicate directories...")
for dir_name in dirs_to_remove:
    dir_path = os.path.join(base_dir, dir_name)
    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        shutil.rmtree(dir_path)
        print(f"Removed directory: {dir_name}")

# Remove files
print("\nRemoving non-landing page documentation...")
for file_name in files_to_remove + scripts_to_remove + images_to_remove:
    file_path = os.path.join(base_dir, file_name)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        os.remove(file_path)
        print(f"Removed file: {file_name}")

# Remove shared directory (appears to only have authService.ts which isn't needed for landing page)
shared_dir = os.path.join(base_dir, "shared")
if os.path.exists(shared_dir):
    shutil.rmtree(shared_dir)
    print("Removed shared directory")

# Clean up public directory
print("\nCleaning up public directory...")
public_demo = os.path.join(base_dir, "public/demo")
if os.path.exists(public_demo):
    # Keep only the demo directory with its assets
    pass

# Remove test.html and clear-auth.html from public
for file_name in ["test.html", "clear-auth.html"]:
    file_path = os.path.join(base_dir, "public", file_name)
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"Removed {file_name} from public")

print("\nCleanup completed!")
print("\nRemaining structure should contain:")
print("- src/ (landing page source code)")
print("- public/ (with only landing page assets)")
print("- Essential config files (package.json, vite.config.ts, etc.)")
print("- README.md and index.html")