#!/bin/bash

# Azure Container Apps Deployment Script for Coding Interview Platform
# Prerequisites: Azure CLI installed and logged in (az login)

# Configuration
RESOURCE_GROUP="rg-coding-interview"
LOCATION="eastus"
ACR_NAME="acrcodinginterview"  # Must be globally unique
CONTAINER_APP_ENV="env-coding-interview"
CONTAINER_APP_NAME="coding-interview-platform"
IMAGE_NAME="coding-interview-platform"
IMAGE_TAG="latest"

echo "🚀 Starting deployment to Azure Container Apps..."

# Step 1: Create Resource Group
echo "📦 Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Step 2: Create Azure Container Registry
echo "🐳 Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Step 3: Build and Push Docker Image to ACR
echo "🔨 Building and pushing Docker image..."
az acr build \
  --registry $ACR_NAME \
  --image $IMAGE_NAME:$IMAGE_TAG \
  --file Dockerfile \
  .

# Step 4: Get ACR credentials
echo "🔑 Retrieving ACR credentials..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Step 5: Create Container Apps Environment
echo "🌍 Creating Container Apps environment..."
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Step 6: Deploy Container App
echo "📤 Deploying container app..."
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image "$ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG" \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 5173 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    NODE_ENV=production \
    PORT=3001

# Step 7: Get the app URL
echo "✅ Deployment complete!"
APP_URL=$(az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

echo ""
echo "🎉 Your application is deployed!"
echo "🌐 URL: https://$APP_URL"
echo ""
echo "📊 To view logs:"
echo "   az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo ""
echo "🔄 To update the app:"
echo "   az acr build --registry $ACR_NAME --image $IMAGE_NAME:$IMAGE_TAG --file Dockerfile ."
echo "   az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --image $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG"
echo ""
echo "🗑️  To delete resources:"
echo "   az group delete --name $RESOURCE_GROUP --yes --no-wait"
