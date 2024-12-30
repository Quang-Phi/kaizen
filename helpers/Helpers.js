const http = require('node:http');
const axios = require('axios');
const { MicroserviceModel } = require('../models/Kaizen/MicroserviceModel');
const { error } = require('node:console');

class Helpers {
    static options_sp = {
        host: process.env.SHARE_POINT_IP,
        port: process.env.SHARE_POINT_PORT,
        module: "micro_token_share_point",
        // path: '/length_request',
        headers: {
            'User-Agent': 'Kaizen Backend',
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0Yml0cml4IiwianRpIjoiYjUzMmMyZjEtOTYyNS00NmYyLTk1MGUtOTM3NWJiZDEyYTgwIiwiZW1haWwiOiJ0ZXN0Yml0cml4QGVzdWhhaS5jb20iLCJ1aWQiOiI3YjZmNjk3OC03ODdiLTQ5ZDMtOTYyNC1jMTljNjE5ZTdjOGIiLCJpcCI6IjE3Mi4xNDAuMTIuMTUiLCJyb2xlcyI6WyJCYXNpYyIsIkFQSUJpVHJpeF9WaWV3Il0sImV4cCI6MTcyOTQ4NTg3OSwiaXNzIjoiQ29yZUlkZW50aXR5IiwiYXVkIjoiQ29yZUlkZW50aXR5VXNlciJ9.AbtkOnEWklh-yrweQQCJBqbrzcup4DSVfJ2ECo9JMMs',
            // 'Authorization': 'Bearer 7550DA83518CDF93EB42913674BE2A5216AEB145859E181D87BCD33424A1993806381B5901F37A73',
        }
    };

    static async authenticate() 
    {
        let options = this.options_sp;
        const res = await this.curl({
            method: "POST",
            headers: options.headers,
            url: `${options.host}:${options.port}/api/Account/authenticate`,
            body: {
                "email": process.env.SHARE_POINT_USER,
                "password": process.env.SHARE_POINT_PASSWORD
            }
        });

        const data = res.data;
        if (data.succeeded) {

            await MicroserviceModel.create({
                module: options.module,
                config: JSON.stringify(data),
                created_by: "systemctl",
                updated_by: "systemctl"
            });

            return true;
        }

        await MicroserviceModel.update({
            note: JSON.stringify(data),
            updated_by: "systemctl"
        }, {
            module: options.module,
        });

        return false
    }

    static async curl_sp(params, method)
    {
        console.log(JSON.stringify(params));

        let options = this.options_sp;
        // options.url = options.host + params.path;
        // // options.path = params.path;
        // // options.method = method;
        // // options.body = params.body;
        options.data = params.body;

        let microservice = await MicroserviceModel.find(['module', "JSON_UNQUOTE(JSON_EXTRACT(config, '$.data.jwToken')) AS token"], {module: options.module});
        if (!microservice) {
            await this.authenticate();
            microservice = await MicroserviceModel.find(['module', "JSON_UNQUOTE(JSON_EXTRACT(config, '$.data.jwToken')) AS token"], {module: options.module});
        }
        
        options.headers["Authorization"] = `Bearer ${microservice.token}`;

        let res = await this.curl({
            method: method,
            headers: options.headers,
            url: `${options.host}:${options.port}${params.path}`,
            body: params.body
        });

        if (res.status == 401) {
            await this.authenticate();
            return await this.curl_sp(params, method);
        }
        // console.log(res, 'testsd');
        // const res = await axios({
        //     method: method,
        //     headers: options.headers,
        //     url: `http://${options.host}:${options.port}${params.path}`, // Đặt cổng trước đường dẫn
        //     data: JSON.stringify(params.body)
        // }).catch(error => {
        //     console.log(error.status);
        //     if (error.status == 401) {
        //         this.curl_sp
        //     }
        // });
        const result = res.data;
        return result;
        
        // const req = await http.request(options_sp);
        // const req = http.request(options_sp, (res) => {
        //     let data = '';

        //     // Lắng nghe các phần dữ liệu được gửi từ server
        //     res.on('data', (chunk) => {
        //         data += chunk;
        //     });

        //     // Khi kết thúc nhận dữ liệu
        //     res.on('end', () => {
        //         try {
        //             // Chuyển dữ liệu JSON từ chuỗi
        //             const parsedData = JSON.parse(data);
        //             console.log(parsedData)
        //         } catch (error) {
        //             reject(`Error parsing response: ${error.message}`);
        //         }
        //     });
        // });

        // // Lắng nghe lỗi
        // req.on('error', (error) => {
        //     reject(`Request error: ${error.message}`);
        // });

        // // Nếu có body để gửi đi
        // if (params.body) {
        //     req.write(JSON.stringify(params.body));
        // }

        // // Kết thúc request
        // req.end();
        // Create the HTTP request
        // const req = http.request(options, (res) => {
        //     let responseData = '';
        
        //     // A chunk of data has been received.
        //     res.on('data', (chunk) => {
        //         responseData += chunk;
        //     });
        
        //     // The whole response has been received.
        //     res.on('end', () => {
        //         console.log('Response:', responseData);
        //     });
        // });
        
        // // Handle errors
        // req.on('error', (error) => {
        //     console.error('Error:', error.message);
        // });
        
        // // Send the POST data
        // req.write(params.body);
        // req.end();
    }

    static async curl(params)
    {
        // console.log(JSON.stringify(params), 'curl');
        const res = await axios({
            method: params.method,
            headers: params.headers,
            url: params.url, // Đặt cổng trước đường dẫn
            data: JSON.stringify(params.body)
        }).catch(error => {
            console.log(error, 'error')
            return error;
        });

        // console.log(JSON.stringify(res.data ?? {}), 'curl');

        return res
    }

    static async curl_sp_v2(params, method)
    {
        console.log(JSON.stringify(params), 'curl_sp_v2');
        let options = this.options_sp;
        // options.url = options.host + params.path;
        // // options.path = params.path;
        // // options.method = method;
        // // options.body = params.body;
        options.data = params.body;

        let microservice = await MicroserviceModel.find(['module', "JSON_UNQUOTE(JSON_EXTRACT(config, '$.data.jwToken')) AS token"], {module: options.module});
        if (!microservice) {
            await this.authenticate();
            microservice = await MicroserviceModel.find(['module', "JSON_UNQUOTE(JSON_EXTRACT(config, '$.data.jwToken')) AS token"], {module: options.module});
        }

        options.headers["Authorization"] = `Bearer ${microservice.token}`;

        let res = await this.curl({
            method: method,
            headers: options.headers,
            url: `${options.host}:${options.port}${params.path}`,
            body: params.body
        }).catch(error => {
            console.log(error, 'error_api');
            return error;
        });

        if (res.status == 401) {
            await this.authenticate();
            return await this.curl_sp_v2(params, method);
        }

        if (res.status == 400) {
            console.log(res.response.data, 'logs');
            return res.response.data;
        }

        // res.response.data
        // if (res.status == 401) {
        //     await this.authenticate();
        //     return await this.curl_sp(params, method);
        // }

        // console.log(res, 'testsd');

        // const result = res.data;
        return res.data;
    }

    static async curl_v2(params)
    {
        console.log(JSON.stringify({
            hostname: params.host,
            port: params.port,
            path: params.path,
            method: params.method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(params.body),
            },
        }), 'curl_v2_payload');
        const req = await http.request({
            hostname: params.host,
            port: params.port,
            path: params.path,
            method: params.method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(params.body),
            },
        }, (res) => {
            // console.log(`STATUS: ${res.statusCode}`);
            // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');

            var body = '';

            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
                // output += chunk;
                body += chunk;
            });
            res.on('end', () => {
               console.log('No more data in response.');
               console.log(body)
            });
        });
        
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        
        // Write data to request body
        req.write(JSON.stringify(params.body));
        req.end();

        // return req;
    }
}

module.exports = { Helpers };