## Builds DKRMON Server
FROM python:3.6-alpine
ARG DKRMON_PATH=/dkrmon
RUN apk update && apk upgrade \
		&& apk add gcc musl-dev \
		&& mkdir -p $DKRMON_PATH/app $DKRMON_PATH/logs

COPY server/ $DKRMON_PATH/app
RUN pip3 install flask flask-socketio eventlet
ENV FLASK_APP=server.py
WORKDIR $DKRMON_PATH/app
EXPOSE 5000/tcp
CMD ["flask", "run", "--host=0.0.0.0"]
