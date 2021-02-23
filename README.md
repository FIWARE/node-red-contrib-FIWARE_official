# node-red-contrib-FIWARE_official

Official Node-RED FIWARE integration

[![License badge](https://img.shields.io/github/license/FIWARE/node-red-contrib-FIWARE_official.svg)](https://opensource.org/licenses/Apache-2.0)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)
[![NGSI LD](https://img.shields.io/badge/NGSI-LD-d6604d.svg)](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.03.01_60/gs_cim009v010301p.pdf)
<br>
![CI](https://github.com/FIWARE/node-red-contrib-FIWARE_official/workflows/CI/badge.svg)

Supported Nodes:

* NGSI(v2,LD) Entity
* NGSI(v2,LD) Dataset
* NGSI(v2,LD) Update
* NGSI(v2,LD) Subscription
* NGSI(v2) v2ToLD

## How to install

You can install this module into an environment running Node-RED by running one of the following commands:

```console
npm install node-red-contrib-fiware_official
```

or

```console
npm install https://github.com/FIWARE/node-red-contrib-FIWARE_official.git#master
```

## How to run Node-RED and Orion Context Broker with Docker

Please clone the repository. Create the necessary images and start up a series of containers by running the commands
as shown below:

```console
git clone https://github.com/FIWARE/node-red-contrib-FIWARE_official.git
cd node-red-contrib-FIWARE_official/docker
docker-compose up -d
```

Once the containers have started, Open the portal page of Node-READ on `http://{ip address of your machine}:1880/`.

> :information_source: **Note:** Everything you do with Node-RED and Orion Context Broker when dockerized is
> non-persistent. You will lose all your data if you turn off the containers. 

## Securing Node-RED with Keyrock

You can protect the Node-RED editor and admin API with [Keyrock](https://github.com/ging/fiware-idm)
and [Passport-FIWARE-OAuth](https://github.com/conwetlab/passport-fiware-oauth).
Register node-red as an application in Keyrock and get `clientID` and `clientSecret`.
Then, Add the following config to `setting.js`. You should change `serverURL`, `clientID`, `clientSecret` and
`callbackURL` to suit your system environment. Please See http://nodered.org/docs/security.html for details
about `setting.js`.

```console
adminAuth: {
    type:"strategy",
    strategy: {
        name: "fiware",
        label: 'Sign in with Keyrock',
        strategy: require("passport-fiware-oauth").OAuth2Strategy,
        options: {
            serverURL: "https://keyrock",
            clientID: "00000000-0000-0000-0000-000000000000",
            clientSecret: "00000000-0000-0000-0000-000000000000",
            callbackURL: "https://node-red/auth/strategy/callback",
            isLegacy: false,
            verify: function(accessToken, refreshToken, profile, done) {
              // console.log(profile);
              done(null, profile._json);
            },
            state: true
        }
    },
    users: [
       { username: "admin",permissions: ["*"]}
    ]
},
```

> :information_source: **Note:** This configuration was verified in a environment installed Node-RED 1.2.9, Keyrock
> 7.8 and Passport-FIWARE-OAuth 0.3.0.
