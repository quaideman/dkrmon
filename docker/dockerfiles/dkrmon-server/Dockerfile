## Builds DKRMON Server
FROM dkrmon:base
ARG DKRMON_PATH=/dkrmon/app

RUN apk update && apk upgrade \
		&& apk add gcc musl-dev

RUN pip3 install flask flask-socketio eventlet
ENV FLASK_APP=server.py
WORKDIR $DKRMON_PATH
EXPOSE 5000/tcp
CMD ["flask", "run", "--host=0.0.0.0"]
