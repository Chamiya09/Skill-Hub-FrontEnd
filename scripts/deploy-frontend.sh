#!/usr/bin/env bash

# ==============================================================================
# Script Name: deploy-frontend.sh
# Description: Production-ready local Azure CLI fallback deployment script for
#              the React (Vite) frontend targeting Azure App Service (Web App).
# Prerequisites: Node.js (20+), npm, Azure CLI ('az'), and 'zip'.
# ==============================================================================

set -euo pipefail

# ==========================================
# CONFIGURATION & ENVIRONMENT VARIABLES
# ==========================================
RESOURCE_GROUP="${RESOURCE_GROUP:-TalentMatch-RG}"
APP_NAME="${APP_NAME:-app-skillhub-frontend}"

# Resolve project directories dynamically regardless of invocation path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "${SCRIPT_DIR}/../package.json" ]; then
    FRONTEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
elif [ -d "${SCRIPT_DIR}/../Skill-Hub-FrontEnd" ]; then
    FRONTEND_DIR="$(cd "${SCRIPT_DIR}/../Skill-Hub-FrontEnd" && pwd)"
elif [ -f "${SCRIPT_DIR}/package.json" ]; then
    FRONTEND_DIR="${SCRIPT_DIR}"
elif [ -d "${PWD}/Skill-Hub-FrontEnd" ]; then
    FRONTEND_DIR="${PWD}/Skill-Hub-FrontEnd"
else
    FRONTEND_DIR="${PWD}"
fi

DIST_DIR="${FRONTEND_DIR}/dist"
ZIP_FILE="${FRONTEND_DIR}/deploy-frontend-package.zip"

# ==========================================
# TRAP & AUTO-CLEANUP
# ==========================================
cleanup() {
    local exit_code=$?
    if [ -f "${ZIP_FILE}" ]; then
        echo "🧹 Cleaning up temporary deployment zip: ${ZIP_FILE}..."
        rm -f "${ZIP_FILE}"
    fi
    exit "${exit_code}"
}
trap cleanup EXIT INT TERM

# ==========================================
# 1. PREREQUISITES & AUTHENTICATION CHECK
# ==========================================
echo "---------------------------------------------------------"
echo "🚀 Skill Hub Frontend: Azure Web App Deployment"
echo "---------------------------------------------------------"
echo "📂 Frontend Directory: ${FRONTEND_DIR}"
echo "🎯 Target App Service:  ${APP_NAME} (${RESOURCE_GROUP})"
echo "---------------------------------------------------------"

# Check required CLI tools
for tool in az node npm; do
    if ! command -v "${tool}" &> /dev/null; then
        echo "❌ Error: Required tool '${tool}' is not installed or not in PATH."
        exit 1
    fi
done

echo "🔍 Checking Azure authentication status..."
if ! az account show &> /dev/null; then
    echo "⚠️ Not logged in to Azure. Initiating interactive device login..."
    az login --use-device-code
fi

CURRENT_SUB=$(az account show --query "name" -o tsv)
CURRENT_SUB_ID=$(az account show --query "id" -o tsv)
echo "✅ Authenticated to subscription: ${CURRENT_SUB} (${CURRENT_SUB_ID})"

# ==========================================
# 2. BUILD REACT PRODUCTION BUNDLE
# ==========================================
echo "📦 Installing dependencies and compiling React production bundle..."
cd "${FRONTEND_DIR}"

if [ ! -d "node_modules" ] || [ ! -d "node_modules/.bin" ]; then
    echo "📦 node_modules or CLI binaries not found. Installing dependencies..."
    npm install
else
    echo "📦 Existing node_modules with binaries detected. Proceeding with current dependencies..."
fi

echo "⚙️ Building Vite bundle (npm run build)..."
npm run build

if [ ! -d "${DIST_DIR}" ]; then
    echo "❌ Error: Build output directory '${DIST_DIR}' was not generated."
    exit 1
fi

echo "✅ React app successfully built in ${DIST_DIR}."

# ==========================================
# 3. CREATE DEPLOYMENT ZIP PACKAGE
# ==========================================
echo "🗜️ Creating temporary deployment zip archive..."
cd "${DIST_DIR}"

if command -v python &> /dev/null; then
    python -c "import zipfile, os; z = zipfile.ZipFile('${ZIP_FILE}', 'w', zipfile.ZIP_DEFLATED); [z.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), '.').replace(os.sep, '/')) for r, d, files in os.walk('.') for f in files]; z.close()"
elif command -v python3 &> /dev/null; then
    python3 -c "import zipfile, os; z = zipfile.ZipFile('${ZIP_FILE}', 'w', zipfile.ZIP_DEFLATED); [z.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), '.').replace(os.sep, '/')) for r, d, files in os.walk('.') for f in files]; z.close()"
elif command -v zip &> /dev/null; then
    zip -r -q "${ZIP_FILE}" .
elif command -v powershell.exe &> /dev/null; then
    WIN_DIST=$(cygpath -w "${DIST_DIR}" 2>/dev/null || echo "${DIST_DIR}")
    WIN_ZIP=$(cygpath -w "${ZIP_FILE}" 2>/dev/null || echo "${ZIP_FILE}")
    powershell.exe -NoProfile -Command "Compress-Archive -Path '${WIN_DIST}\\*' -DestinationPath '${WIN_ZIP}' -Force"
elif command -v tar &> /dev/null; then
    tar -a -c -f "${ZIP_FILE}" *
else
    echo "❌ Error: No zip utility available. Please install 'zip' or run with powershell."
    exit 1
fi

ZIP_SIZE=$(du -h "${ZIP_FILE}" | cut -f1)
echo "✅ Packaged ${ZIP_SIZE} into ${ZIP_FILE}."

# ==========================================
# 4. DEPLOY VIA AZURE CLI (az webapp deploy)
# ==========================================
echo "🚀 Deploying zip package to Azure App Service: ${APP_NAME}..."
az webapp deploy \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${APP_NAME}" \
    --src-path "${ZIP_FILE}" \
    --type zip \
    --async false \
    --clean true

# ==========================================
# 5. VERIFICATION & HEALTH CHECK
# ==========================================
echo "🔍 Fetching Web App URL and deployment state..."
DEFAULT_HOST=$(az webapp show \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${APP_NAME}" \
    --query "defaultHostName" -o tsv 2>/dev/null || true)

echo "---------------------------------------------------------"
echo "🎉 Frontend Deployment Complete!"
if [ -n "${DEFAULT_HOST}" ]; then
    echo "🌐 Live Application URL: https://${DEFAULT_HOST}"
else
    echo "🌐 Live Application: https://${APP_NAME}.azurewebsites.net"
fi
echo "---------------------------------------------------------"
