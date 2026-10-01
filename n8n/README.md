# ILY-mart n8n Render Deployment Guide

This folder contains the pre-configured `Dockerfile` for deploying **n8n** on **Render.com** without permission errors or port 502 issues.

## Render Web Service Setup Instructions

1. Log into **[https://dashboard.render.com](https://dashboard.render.com)**.
2. Click **New +** (top right) $\rightarrow$ Select **Web Service**.
3. Connect your **MohamedInamulHasan/ILY-mart** GitHub repository.
4. Set the following fields:
   - **Name**: `ilymart-n8n`
   - **Region**: `Singapore` (or closest region)
   - **Branch**: `main`
   - **Root Directory**: `n8n`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Instance Type**: `Free`

5. Add Environment Variables:
   - `WEBHOOK_URL` = `https://ilymart-n8n.onrender.com`
   - `N8N_HOST` = `ilymart-n8n.onrender.com`
   - `PORT` = `5678`

6. Click **Create Web Service**.
