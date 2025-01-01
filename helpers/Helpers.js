const http = require("node:http");
const axios = require("axios");
const { MicroserviceModel } = require("../models/Kaizen/MicroserviceModel");
const { error } = require("node:console");

class Helpers {
  static options_sp = {
    host: process.env.SHARE_POINT_IP,
    port: process.env.SHARE_POINT_PORT,
    module: "micro_token_share_point",
    headers: {
      "User-Agent": "Kaizen Backend",
      "Content-Type": "application/json",
      // 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0Yml0cml4IiwianRpIjoiYjUzMmMyZjEtOTYyNS00NmYyLTk1MGUtOTM3NWJiZDEyYTgwIiwiZW1haWwiOiJ0ZXN0Yml0cml4QGVzdWhhaS5jb20iLCJ1aWQiOiI3YjZmNjk3OC03ODdiLTQ5ZDMtOTYyNC1jMTljNjE5ZTdjOGIiLCJpcCI6IjE3Mi4xNDAuMTIuMTUiLCJyb2xlcyI6WyJCYXNpYyIsIkFQSUJpVHJpeF9WaWV3Il0sImV4cCI6MTcyOTQ4NTg3OSwiaXNzIjoiQ29yZUlkZW50aXR5IiwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciJ9.AbtkOnEWklh-yrweQQCJBqbrzcup4DSVfJ2ECo9JMMs',
      // 'Authorization': 'Bearer 7550DA83518CDF93EB42913674BE2A5216AEB145859E181D87BCD33424A1993806381B5901F37A73',
    },
  };

  static async authenticate() {
    let options = this.options_sp;
    const res = await this.curl({
      method: "POST",
      headers: options.headers,
      url: `${options.host}:${options.port}/api/Account/authenticate`,
      body: {
        email: process.env.SHARE_POINT_USER,
        password: process.env.SHARE_POINT_PASSWORD,
      },
    });

    const data = res.data;
    if (data.succeeded) {
      await MicroserviceModel.create({
        module: options.module,
        config: JSON.stringify(data),
        created_by: "systemctl",
        updated_by: "systemctl",
      });

      return true;
    }

    await MicroserviceModel.update(
      {
        note: JSON.stringify(data),
        updated_by: "systemctl",
      },
      {
        module: options.module,
      }
    );

    return false;
  }

  static async curl_sp(params, method) {

    let options = this.options_sp;
    options.data = params.body;

    let microservice = await MicroserviceModel.find(
      [
        "module",
        "JSON_UNQUOTE(JSON_EXTRACT(config, '$.data.jwToken')) AS token",
      ],
      { module: options.module }
    );
    if (!microservice) {
      await this.authenticate();
      microservice = await MicroserviceModel.find(
        [
          "module",
          "JSON_UNQUOTE(JSON_EXTRACT(config, '$.data.jwToken')) AS token",
        ],
        { module: options.module }
      );
    }

    options.headers["Authorization"] = `Bearer ${microservice.token}`;

    let res = await this.curl({
      method: method,
      headers: options.headers,
      url: `${options.host}:${options.port}${params.path}`,
      body: params.body,
    });

    if (res.status == 401) {
      await this.authenticate();
      return await this.curl_sp(params, method);
    }
    const result = res.data;
    return result;
  }

  static async curl(params) {
    const res = await axios({
      method: params.method,
      headers: params.headers,
      url: params.url, // Đặt cổng trước đường dẫn
      data: JSON.stringify(params.body),
    }).catch((error) => {
      return error;
    });

    return res;
  }

  static async curl_sp_v2(params, method) {
    let options = this.options_sp;
    options.data = params.body;

    let microservice = await MicroserviceModel.find(
      [
        "module",
        "JSON_UNQUOTE(JSON_EXTRACT(config, '$.data.jwToken')) AS token",
      ],
      { module: options.module }
    );
    if (!microservice) {
      await this.authenticate();
      microservice = await MicroserviceModel.find(
        [
          "module",
          "JSON_UNQUOTE(JSON_EXTRACT(config, '$.data.jwToken')) AS token",
        ],
        { module: options.module }
      );
    }

    options.headers["Authorization"] = `Bearer ${microservice.token}`;

    let res = await this.curl({
      method: method,
      headers: options.headers,
      url: `${options.host}:${options.port}${params.path}`,
      body: params.body,
    }).catch((error) => {
      return error;
    });

    if (res.status == 401) {
      await this.authenticate();
      return await this.curl_sp_v2(params, method);
    }

    if (res.status == 400) {
      return res.response.data;
    }

    return res.data;
  }

  static async curl_v2(params) {
    const req = await http.request(
      {
        hostname: params.host,
        port: params.port,
        path: params.path,
        method: params.method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(params.body),
        },
      },
      (res) => {
        res.setEncoding("utf8");

        var body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          console.log("No more data in response.");
          console.log(body);
        });
      }
    );

    req.on("error", (e) => {
      console.error(`problem with request: ${e.message}`);
    });

    // Write data to request body
    req.write(JSON.stringify(params.body));
    req.end();
  }
}

module.exports = { Helpers };
