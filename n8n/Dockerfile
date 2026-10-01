FROM n8nio/n8n:latest

USER root
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

USER node

ENV PORT=5678
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=https
ENV N8N_PATH=/
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false
ENV DB_TYPE=sqlite

EXPOSE 5678
