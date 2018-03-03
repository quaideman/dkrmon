## Builds DKRMON Agent
FROM python:3.6-alpine
ARG DKRMON_PATH=/dkrmon
RUN apk update && apk upgrade \
		&& pip3 install docker \
		&& mkdir -p $DKRMON_PATH/app $DKRMON_PATH/logs $DKRMON_PATH/stats/memory

COPY agent/ $DKRMON_PATH/app

WORKDIR $DKRMON_PATH/app
EXPOSE 5000/tcp
CMD ["python","agent.py"]
