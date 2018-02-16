# To run:
#  docker run -d --restart unless-stopped --net=host --name mqtt-scripts-running berryk/mqtt-scripts-scripts:latest

FROM berryk/mqtt-scripts:latest
MAINTAINER Keith Berry "keithwberry@gmail.com"

ENV TIMEZONE="America/New_York"

WORKDIR /usr/src/app

ADD https://github.com/berryk/mqtt-scripts-scripts/archive/master.tar.gz .
RUN gunzip -c master.tar.gz | tar xvf -

RUN npm install -g wake_on_lan
RUN echo $TIMEZONE > /etc/timezone

WORKDIR /usr/src/app/mqtt-scripts-scripts-master

CMD /usr/local/lib/node_modules/mqtt-scripts/index.js -u mqtt://mqtt.lan -d .
