export-exchange
===============

node js app/service for to fill a data base with the current money exchange


HOW TO INSTALL

> Instal node.js (http://howtonode.org/how-to-install-nodejs)

> sudo apt-get install mongodb-server

> npm install express

> npm install mongodb

> npm install mongoose

> bash: node exportExchange.js


HOW TO USE IT

> For fill de data base (dbtest@localhost) with all the currencys exchange do a GET 127.0.0.1:3000 

> For see one particular exchange rate do a GET 127.0.0.1:300/:upperCaseMoneyCodeFrom/:upperCaseMoneyCodeTo

> For see an amount of money do a GET 127.0.0.1:300/:upperCaseMoneyCodeFrom/:upperCaseMoneyCodeTo/:amount


