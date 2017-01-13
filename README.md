![alt tag](http://www.bathfitter.com/media/default/findalocation/locationmap.jpg)


# Location-Services

## Quick Start

#### For Windows
Go to https://nodejs.org/en/download/ and load .msi file

After Installed .msi file, create new directory to store source codes. Then clone source codes and run command to start web application

```
$ git clone https://github.com/mobilifeteam/global-location-service.git
cd /src
$ node br_server.js
```

Use Internet Explorer to browse localhost:8086 to test the application server status.


#### For Mac
First, install Homebrew.
```
"/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Then install Node.js (npm will be installed with Node.js):

```
brew install node
$ git clone https://github.com/mobilifeteam/global-location-service.git
cd /src
$ node br_server.js
```

After the application server has been started on your machine. You can use curl to test the appplication server if it works properly. You might need to enter apt-get install command if curl does not exists on your system. 

```
sudo apt-get install curl 
```

```
$ curl -i localhost:8086
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 12
Date: Sun, 02 Jun 2013 03:53:22 GMT
Connection: keep-alive
```




## Features
- Query
  - Find ATMs by location
  - Find ATMs by Terms


