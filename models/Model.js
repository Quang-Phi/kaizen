class Model {
  static table;
  static primaryKey = "id";
  static fillable = [];

  static async create(data) {
    const filteredData = await this.filteredData(data);
    return {
      columns: Object.keys(filteredData).join(", "),
      placeholders: `(${Object.keys(filteredData)
        .map(() => "?")
        .join(", ")})`,
      values: Object.values(filteredData),
    };
  }

  static async createV2(data) {
    const filteredData = await this.filteredData(data);
    return {
      columns: Object.keys(filteredData),
      placeholders: `(${Object.keys(filteredData)
        .map(() => "?")
        .join(", ")})`,
      values: Object.values(filteredData),
    };
  }

  static async select(select) {
    const filteredData = await this.filteredData(select);

    return {
      columns: Object.keys(filteredData).join(", "),
    };
  }

  static async updated(data, where = []) {
    const [filteredData, filteredWhere] = await Promise.all([
      this.filteredData(data),
      this.filteredData(where),
    ]);

    return {
      columns: Object.keys(filteredData).join(", "),
      placeholders: Object.keys(filteredData)
        .map((key) => `${key} = ?`)
        .join(", "),
      values: [...Object.values(filteredData), ...Object.values(filteredWhere)],
      wheres: Object.keys(filteredWhere)
        .map((key) => `${key} = ?`)
        .join(" AND "),
    };
  }

  static async deleted(data, where = []) {
    const [filteredData, filteredWhere] = await Promise.all([
      this.filteredData(data),
      this.filteredData(where),
    ]);

    return {
      columns: Object.keys(filteredData).join(", "),
      placeholders: Object.keys(filteredData)
        .map((key) => `${key} = ?`)
        .join(", "),
      values: [...Object.values(filteredData), ...Object.values(filteredWhere)],
      wheres: Object.keys(filteredWhere)
        .map((key) => `${key} = ?`)
        .join(" AND "),
    };
  }

  static async where(where = []) {
    const filteredWhere = await this.filteredData(where);

    return {
      wheres: Object.keys(filteredWhere)
        .map((key) => `${key} = ?`)
        .join(" AND "),
      values: Object.values(filteredWhere),
    };
  }

  static async whereNot(where = []) {
    const filteredWhere = await this.filteredData(where);

    return {
      wheres: Object.keys(filteredWhere)
        .map((key) => `${key} != ?`)
        .join(" AND "),
      values: Object.values(filteredWhere),
    };
  }

  static async whereIn(where = []) {
    const filteredWhere = await this.filteredData(where);

    const wheres = Object.keys(filteredWhere)
      .map((key) => {
        const placeholders = Array.isArray(filteredWhere[key])
          ? filteredWhere[key].map(() => "?").join(", ")
          : "?";
        return `${key} IN (${placeholders})`;
      })
      .join(" AND ");

    return {
      wheres: wheres,
      values: Object.values(filteredWhere).flat(),
    };
  }

  static async whereNotIn(where = []) {
    const filteredWhere = await this.filteredData(where);

    const wheres = Object.keys(filteredWhere)
      .map((key) => {
        const placeholders = Array.isArray(filteredWhere[key])
          ? filteredWhere[key].map(() => "?").join(", ")
          : "?";
        return `${key} NOT IN (${placeholders})`;
      })
      .join(" AND ");

    return {
      wheres: wheres,
      values: Object.values(filteredWhere).flat(),
    };
  }

  static async createMultiple(data) {
    const filteredData = await this.filteredDataMultiple(data);
    return {
      columns: Object.keys(filteredData[0]).join(", "),
      placeholders: filteredData
        .map(
          () =>
            `(${Object.keys(filteredData[0])
              .map(() => "?")
              .join(", ")})`
        )
        .join(", "),
      values: filteredData.flatMap((item) => Object.values(item)),
    };
  }

  static async filteredData(data) {
    return Object.keys(data).reduce((acc, key) => {
      if (
        (this.fillable.includes(key) && typeof data[key] !== "undefined") ||
        (this.primaryKey === key &&
          typeof data[this.primaryKey] !== "undefined")
      ) {
        acc[key] = data[key];
      }

      return acc;
    }, {});
  }

  static async filteredDataMultiple(data) {
    const filteredData = data.map((item) => {
      return Object.keys(item).reduce((acc, key) => {
        if (
          (this.fillable.includes(key) && typeof item[key] !== "undefined") ||
          (this.primaryKey === key &&
            typeof item[this.primaryKey] !== "undefined")
        ) {
          acc[key] = item[key];
        }
        return acc;
      }, {});
    });

    return filteredData;
  }
}

module.exports = { Model };
