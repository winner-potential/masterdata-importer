const waitPort = require("wait-port");
const log = require("debug")("masterdata:importer");
const url = require("url");
const request = require("request");
const yaml = require("js-yaml");

const masterdata = {
  url: process.env.URL || "http://localhost:3000",
  force: process.env.FORCE == "1",
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  model: process.env.MODEL || ""
};

if (!masterdata.url.endsWith("/")) {
  masterdata.url += "/";
}

masterdata.parsedUrl = url.parse(masterdata.url);
masterdata.authenticate = masterdata.url + "api/v1.0/authentificate";
masterdata.documents = masterdata.url + "api/v1.0/document";
masterdata.templates = {};
masterdata.templates.tags = masterdata.url + "api/v1.0/template/tag";
masterdata.templates.metrics = masterdata.url + "api/v1.0/template/metric";
masterdata.templates.documents = masterdata.url + "api/v1.0/template/document";

var doPost = (url, data, token, method) => {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: url,
        method: method || "POST",
        headers: {
          "x-access-token": token
        },
        json: data
      },
      (error, response, body) => {
        if (error) {
          return reject(error);
        }
        return resolve(body);
      }
    );
  });
};

var doGet = (url, token, method) => {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: url,
        method: method || "GET",
        headers: {
          "x-access-token": token
        }
      },
      (error, response, body) => {
        if (error) {
          return reject(err);
        }
        return resolve(body);
      }
    );
  });
};

var iter = (o, cb) => {
  Object.keys(o).forEach(function(k) {
    if (o[k] !== null && typeof o[k] === "object") {
      iter(o[k], cb);
      return;
    } else if (typeof o[k] === "string") {
      o[k] = cb(o[k]);
    }
  });
};

var re = /:ref\.(.*):/g;
var create = (base, token, name, data, knowledge) => {
  iter(data, v => v.replace(re, (match, g1) => knowledge[g1]));
  return new Promise((resolve, reject) => {
    doPost(base, data, token)
      .then(result => {
        knowledge[name] = result._id;
        log("Created entry %o with id %o", name, result);
        resolve(result);
      })
      .catch(err => reject(err));
  });
};

log("Wait for Masterdata %o:%o", masterdata.parsedUrl.hostname, masterdata.parsedUrl.port);
waitPort({
  host: masterdata.parsedUrl.hostname,
  port: parseInt(masterdata.parsedUrl.port),
  timeout: 30000,
  output: "silent"
})
  .then(() => {
    log("Found masterdata %o:%o", masterdata.parsedUrl.hostname, masterdata.parsedUrl.port);

    yaml.safeLoadAll(masterdata.model, function(model) {
      model.templates = model.templates || {};
      log("Found Model: %o", model)
      log("Start authentification for", masterdata.username);
      doPost(masterdata.authenticate, {
        username: masterdata.username,
        password: masterdata.password
      })
        .then(result => {
          const token = result.token;
          // Check if database is empty
          doGet(masterdata.templates.documents, token)
            .then(result => {
              if (!masterdata.force && result && result.length > 0 && result != '[]') {
                log("Database not empty, skip init, clear database to rerun init");
              } else {
                // Create jobs
                var jobs = [];
                var knowledge = {};
                Object.keys(model.templates.tags || {}).forEach(key => {
                  jobs.push(_ => create(masterdata.templates.tags, token, key, model.templates.tags[key], knowledge));
                });
                Object.keys(model.templates.metrics || {}).forEach(key => {
                  jobs.push(_ => create(masterdata.templates.metrics, token, key, model.templates.metrics[key], knowledge));
                });
                Object.keys(model.templates.documents || {}).forEach(key => {
                  jobs.push(_ => create(masterdata.templates.documents, token, key, model.templates.documents[key], knowledge));
                });
                Object.keys(model.documents || {}).forEach(key => {
                  jobs.push(_ => create(masterdata.documents, token, key, model.documents[key], knowledge));
                });

                // Work through
                var handle = _ => {
                  var el = jobs.shift();
                  if (el) {
                    el()
                      .then(handle)
                      .catch(err => log("Error while handle job: %o", err));
                  }
                };
                handle();
              }
            })
            .catch(err => log("Error while checking db for existing entries: %o", err));
        })
        .catch(err => log("Error while authenticate %o: %o", masterdata.username, err));
    });
  })
  .catch(err => log("Error while waiting for masterdata: %o", err));
