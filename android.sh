#!/bin/bash

# make it easy to install a firefox extension after downloading the zip from github

set -e  # exit script on error

unzip event-logger-master.zip
mv event-logger-master event-logger
cd event-logger
zip -r ../event-logger.xpi .
cd ..
rm -rf ./event-logger
