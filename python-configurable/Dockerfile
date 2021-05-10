# syntax=docker/dockerfile:1

FROM python:3.8-slim-buster

WORKDIR /app

#Usually you need to do something like this, but in this simple example,
#we do not have any dependencies
#COPY requirements.txt requirements.txt

#RUN pip3 install -r requirements.txt

COPY . .

CMD [ "python3", "app_configurable.py", "1.0", "2"]