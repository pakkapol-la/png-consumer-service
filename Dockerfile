FROM mmdevpr.tnis.com:7443/mymo/node-module:1
MAINTAINER MobiLife International

RUN mkdir -p /app
WORKDIR /app

COPY . /app

EXPOSE 8086
CMD ["npm", "start"]
