#!/usr/bin/env bash
# ── 1-Click Deployment Script for Google Cloud Run ──
set -e

PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}
REGION=${GCP_REGION:-"asia-south1"}
SERVICE_NAME="krishi-saarthi-backend"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: GCP_PROJECT_ID is not set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "================================================================="
echo " Deploying Krishi Saarthi FastAPI + ML Backend to Google Cloud Run"
echo " Project: $PROJECT_ID | Region: $REGION | Service: $SERVICE_NAME"
echo "================================================================="

# Enable necessary Google Cloud APIs
echo "[1/4] Enabling Cloud Run, Cloud Build, and Container Registry APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Build and push container using Google Cloud Build
echo "[2/4] Building image using Google Cloud Build..."
gcloud builds submit --config cloudbuild.yaml .

# Fetch the live service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "================================================================="
echo " Successfully Deployed to Google Cloud Run!"
echo " Service URL: $SERVICE_URL"
echo " Health Endpoint: $SERVICE_URL/health"
echo " Swagger API Docs: $SERVICE_URL/docs"
echo "================================================================="
