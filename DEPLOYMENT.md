# Deployment Guide - Azure Container Apps

This guide walks you through deploying the Online Coding Interview Platform to **Azure Container Apps**.

## Why Azure Container Apps?

- ✅ **Serverless & Auto-scaling** - Pay only for what you use
- ✅ **WebSocket Support** - Perfect for Socket.IO real-time features
- ✅ **Container-based** - Deploy directly from Docker
- ✅ **HTTPS Built-in** - Automatic SSL certificates
- ✅ **Easy Management** - No Kubernetes complexity

## Prerequisites

1. **Azure Account** - [Create free account](https://azure.microsoft.com/free/) ($200 credit)
2. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
3. **Docker** - Already installed (you built the image)

## Quick Deploy

### Step 1: Login to Azure

```powershell
az login
```

This opens your browser for authentication.

### Step 2: Run Deployment Script

**PowerShell (Windows):**
```powershell
.\deploy-azure.ps1
```

**Bash (Linux/Mac):**
```bash
chmod +x deploy-azure.sh
./deploy-azure.sh
```

### Step 3: Access Your App

After deployment completes (~5-10 minutes), you'll see:
```
🎉 Your application is deployed!
🌐 URL: https://coding-interview-platform.xxx.azurecontainerapps.io
```

Open the URL in your browser!

## Manual Deployment Steps

If you prefer step-by-step control:

### 1. Set Variables

```powershell
$RESOURCE_GROUP = "rg-coding-interview"
$LOCATION = "eastus"
$ACR_NAME = "acrcodinginterview"  # Change to make globally unique
$CONTAINER_APP_ENV = "env-coding-interview"
$CONTAINER_APP_NAME = "coding-interview-platform"
```

### 2. Create Resource Group

```powershell
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### 3. Create Container Registry

```powershell
az acr create `
  --resource-group $RESOURCE_GROUP `
  --name $ACR_NAME `
  --sku Basic `
  --admin-enabled true
```

### 4. Build & Push Image to ACR

```powershell
az acr build `
  --registry $ACR_NAME `
  --image coding-interview-platform:latest `
  --file Dockerfile `
  .
```

### 5. Create Container Apps Environment

```powershell
az containerapp env create `
  --name $CONTAINER_APP_ENV `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION
```

### 6. Deploy Container App

Get ACR credentials:
```powershell
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer -o tsv
```

Deploy:
```powershell
az containerapp create `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --environment $CONTAINER_APP_ENV `
  --image "${ACR_LOGIN_SERVER}/coding-interview-platform:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --target-port 5173 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3 `
  --cpu 0.5 `
  --memory 1.0Gi `
  --env-vars NODE_ENV=production PORT=3001
```

### 7. Get Your App URL

```powershell
az containerapp show `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query properties.configuration.ingress.fqdn `
  -o tsv
```

## Post-Deployment

### View Logs

```powershell
az containerapp logs show `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --follow
```

### Update Your App

After making code changes:

```powershell
# Rebuild and push
az acr build --registry $ACR_NAME --image coding-interview-platform:latest --file Dockerfile .

# Update container app
az containerapp update `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --image "${ACR_LOGIN_SERVER}/coding-interview-platform:latest"
```

### Scale Your App

```powershell
az containerapp update `
  --name $CONTAINER_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --min-replicas 2 `
  --max-replicas 5
```

### Monitor

```powershell
# View app metrics in Azure Portal
az containerapp browse --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP
```

## Cost Estimation

Azure Container Apps pricing (as of 2025):
- **First 180,000 vCPU-seconds/month**: FREE
- **First 360,000 GiB-seconds/month**: FREE
- **After free tier**: ~$0.000012 per vCPU-second, ~$0.000002 per GiB-second

**Example monthly cost** (1 replica, 0.5 vCPU, 1GB RAM, 24/7):
- vCPU: 0.5 × 2,592,000 seconds = 1,296,000 vCPU-seconds × $0.000012 ≈ **$15.55**
- Memory: 1 × 2,592,000 seconds = 2,592,000 GiB-seconds × $0.000002 ≈ **$5.18**
- **Total: ~$20.73/month** (after free tier)

With free tier included: **~$8-12/month** for moderate usage.

## Cleanup

Delete all resources:

```powershell
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## Troubleshooting

### Container Registry Name Conflict

If `acrcodinginterview` is taken:
```powershell
$ACR_NAME = "acr$(Get-Random -Maximum 99999)"  # Generates unique name
```

### Deployment Fails

Check logs:
```powershell
az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow
```

### WebSocket Issues

Ensure ingress is set to `external` (not `internal`).

### Health Check Failures

The Docker compose has a health check endpoint. If needed, add to backend:

```javascript
// In backend/server.js
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
```

## Alternative Deployment Options

### Option 2: Azure App Service (Web App for Containers)

```powershell
az appservice plan create --name plan-coding-interview --resource-group $RESOURCE_GROUP --is-linux --sku B1
az webapp create --resource-group $RESOURCE_GROUP --plan plan-coding-interview --name coding-interview-app --deployment-container-image-name ${ACR_LOGIN_SERVER}/coding-interview-platform:latest
```

**Cost**: ~$13/month (B1 tier)

### Option 3: Azure Kubernetes Service (AKS)

For larger scale deployments (not recommended for this app's scale):
- More complex setup
- Higher cost (~$70+/month)
- Better for microservices

### Option 4: Other Platforms

- **Render.com** - Easy deploy, free tier available
- **Railway.app** - Simple deployment, pay-as-you-go
- **Fly.io** - Global edge deployment
- **DigitalOcean App Platform** - $5/month starter tier
- **AWS ECS/Fargate** - Similar to Azure Container Apps
- **Google Cloud Run** - Serverless containers

## Production Considerations

Before going to production:

1. **Add Authentication** - Implement user auth (Azure AD, Auth0)
2. **Database** - Use Azure Cosmos DB or PostgreSQL for room persistence
3. **Redis** - For Socket.IO scaling across multiple instances
4. **CDN** - Azure CDN for static assets
5. **Monitoring** - Application Insights for telemetry
6. **SSL/Custom Domain** - Configure custom domain with SSL
7. **Rate Limiting** - Prevent abuse
8. **Backup** - Regular backups of data

## Support

For issues:
1. Check [Azure Container Apps docs](https://docs.microsoft.com/azure/container-apps/)
2. Review logs: `az containerapp logs show`
3. Azure Portal: https://portal.azure.com

## Next Steps

✅ Deploy to Azure Container Apps
✅ Test the deployed application
✅ Share the URL with users
✅ Monitor usage and costs
✅ Implement production features

Happy deploying! 🚀
