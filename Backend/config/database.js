
const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Set it in Render Environment Variables."
  );
}

if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  throw new Error(
    "DATABASE_URL must start with postgres:// or postgresql://"
  );
}

const parsedUrl = new URL(databaseUrl);

console.log("PostgreSQL host:", parsedUrl.hostname);
console.log("PostgreSQL port:", parsedUrl.port || "5432");

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
