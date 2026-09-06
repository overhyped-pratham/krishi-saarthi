# ── 1-Click PowerShell Deployment Script for Google Cloud Run ──
param(
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region = "asia-south1",
    [string]$ServiceName = "krishi-saarthi-backend"
)

if (-not $ProjectId) {
    $ProjectId = gcloud config get-value project 2>$null
}

if (-not $ProjectId) {
    Write-Error "Error: GCP Project ID is not specified. Run: gcloud config set project <your-project-id>"
    exit 1
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Deploying Krishi Saarthi FastAPI + ML Backend to Google Cloud Run" -ForegroundColor Cyan
Write-Host " Project: $ProjectId | Region: $Region | Service: $ServiceName" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

# Enable APIs
Write-Host "[1/3] Enabling Google Cloud Services (Run, Cloud Build, Container Registry)..." -ForegroundColor Green
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Build & Deploy via Cloud Build
Write-Host "[2/3] Submitting build to Google Cloud Build..." -ForegroundColor Green
gcloud builds submit --config cloudbuild.yaml .

# Get deployed URL
Write-Host "[3/3] Fetching live Cloud Run service endpoint..." -ForegroundColor Green
$ServiceUrl = gcloud run services describe $ServiceName --platform managed --region $Region --format "value(status.url)"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Deployed Successfully to Google Cloud Run!" -ForegroundColor Green
Write-Host " Live Service URL: $ServiceUrl" -ForegroundColor White
Write-Host " Health Check:     $ServiceUrl/health" -ForegroundColor White
Write-Host " API Docs:         $ServiceUrl/docs" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
