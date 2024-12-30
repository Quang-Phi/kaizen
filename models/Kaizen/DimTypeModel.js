const { Model } = require('../Model');
const { HocVienDealModel } = require('./HocVienDealModel');
const { connection } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');


class DimTypeModel extends Model {

    static table = 'dim_type';

    static primaryKey = 'ma';

    static fillable = [

    ]
}

module.exports = { DimTypeModel };