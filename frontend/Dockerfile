FROM nginx:alpine

ENV CLIENT_SERVER_HOST=client-server
ENV NGINX_ENVSUBST_FILTER=CLIENT_SERVER_HOST

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY index.html /usr/share/nginx/html/index.html
COPY styles /usr/share/nginx/html/styles
COPY scripts /usr/share/nginx/html/scripts
COPY assets /usr/share/nginx/html/assets

EXPOSE 80
