## Builds DKRMON Server
FROM dkrmon:base
ARG DKRMON_PATH=/dkrmon/app

RUN apk update && apk upgrade \
		&& pip3 install flask gunicorn docker

WORKDIR $DKRMON_PATH
EXPOSE 5000/tcp
CMD ["gunicorn", "-b :5000", "main:app"]
