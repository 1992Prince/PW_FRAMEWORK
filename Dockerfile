# get latest docker image from - https://playwright.dev/docs/docker
# below docker image version should match with the version mentioned in package.json file
FROM mcr.microsoft.com/playwright:v1.61.0-noble

#create app directory and set it as working directory
RUN mkdir /app
WORKDIR /app

#copy everything from current directory to /app directory in docker image
# current directory is the directory where Dockerfile is present and 
# . means copy everything from current directory to /app directory in docker image
COPY . /app/

# npm install --force is used to install all the dependencies mentioned in package.json file
RUN npm install --force

# install playwright browsers and dependencies
RUN npx playwright install --with-deps

# while building this docker image, make sure headless property in playwright.config.js file is set to true, 
#otherwise the build will fail

# also make sure docker is installed in your machine and docker engine is up and running
# before runnning build command

# docker build -t pw-test . => means build docker image with name pw-test 
#and . means current directory where Dockerfile is present

# once image is build with above command run command - docker images to see if image with 
# name pw-test is present in the list of images


# to run tests in docker image, run below command -
# docker run -it pw-test => this will make u enter into the docker image and 
#you can run tests from there using command - npx playwright test
# -it means interactive mode

# u can run ls command to see the files present in the docker image and in location /app directory, 
#u will see all the files copied from current directory to docker image

# now since u r at root of project, u can run command - npx playwright test to run all tests or
# package json scripts command
