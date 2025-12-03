# Azure Container Apps Deployment Script for Coding Interview Platform (PowerShell)
# Prerequisites: Azure CLI installed and logged in (az login)

# Configuration
$RESOURCE_GROUP = "rg-coding-interview"
$LOCATION = "eastus"
$ACR_NAME = "acrcodinginterview"  # Must be globally unique - change if needed
$CONTAINER_APP_ENV = "env-coding-interview"
$CONTAINER_APP_NAME = "coding-interview-platform"
$IMAGE_NAME = "coding-interview-platform"
$IMAGE_TAG = "latest"

Write-Host "🚀 Starting deployment to Azure Container Apps..." -ForegroundColor Green

# Step 1: Create Resource Group
Write-Host "📦 Creating resource group..." -ForegroundColor Yellow
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION

# Step 2: Create Azure Container Registry
Write-Host "🐳 Creating Azure Container Registry..." -ForegroundColor Yellow
az acr create `
  --resource-group $RESOURCE_GROUP `
  --name $ACR_NAME `
  --sku Basic `
  --admin-enabled true

# Step 3: Build and Push Docker Image to ACR
Write-Host "🔨 Building and pushing Docker image..." -ForegroundColor Yellow
az acr build `
  --registry $ACR_NAME `
  --image "${IMAGE_NAME}:${IMAGE_TAG}" `
  --file Dockerfile `
  .

# Step 4: Get ACR credentials
Write-Host "🔑 Retrieving ACR credentials..." -ForegroundColor Yellow
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer -o tsv

# Step 5: Create Container Apps Environment
Write-Host "🌍 Creating Container Apps environment..." -ForegroundColor Yellow
az containerapp env create `
  --name $CONTAINER_APP_ENV `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION

# Step 6: Deploy Container App
Write-Host "📤 Deploying container app..." -ForegroundColor Yellow
az containerapp create `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --environment $CONTAINER_APP_ENV `
  --image "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --target-port 5173 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3 `
  --cpu 0.5 `
  --memory 1.0Gi `
  --env-vars `
    NODE_ENV=production `
    PORT=3001

# Step 7: Get the app URL
Write-Host "✅ Deployment complete!" -ForegroundColor Green
$APP_URL = az containerapp show `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query properties.configuration.ingress.fqdn `
  -o tsv

Write-Host ""
Write-Host "🎉 Your application is deployed!" -ForegroundColor Green
Write-Host "🌐 URL: https://$APP_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 To view logs:" -ForegroundColor Yellow
Write-Host "   az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 To update the app:" -ForegroundColor Yellow
Write-Host "   az acr build --registry $ACR_NAME --image ${IMAGE_NAME}:${IMAGE_TAG} --file Dockerfile ." -ForegroundColor Gray
Write-Host "   az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --image ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}" -ForegroundColor Gray
Write-Host ""
Write-Host "🗑️  To delete resources:" -ForegroundColor Yellow
Write-Host "   az group delete --name $RESOURCE_GROUP --yes --no-wait" -ForegroundColor Gray
