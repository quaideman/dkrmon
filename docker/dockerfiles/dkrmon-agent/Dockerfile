## Builds DKRMON Agent
FROM dkrmon:base
ARG DKRMON_PATH=/dkrmon/app

RUN apk update && apk upgrade \
		&& pip3 install docker

WORKDIR $DKRMON_PATH
CMD ["python","agent.py"]
