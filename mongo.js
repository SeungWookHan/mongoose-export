const mongoose = require("mongoose");
const Response = require("./response")
const fs = require("fs");

require("dotenv").config();

async function main() {
  // Connect to mongodb database
  const URI = process.env.DB_URI
  const connection = await mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Successfully connected to mongodb");

  const responses = await Response.find(
    { deployId: process.env.DEPLOY_ID },
    "-_id"
  ).lean();

  console.log("Successfully found responses");

  const excludeKeys = ['history', 'query', 'uuid']

  const mapped = responses.map((response) => {
    const values = Object.entries(response.responses)
      .filter((([key,]) => !excludeKeys.includes(key)))
      .map(([, value]) => value)
      .map(e => {
        switch (typeof e) {
          case 'object': {
              const keys = Object.keys(e);
              const result = keys.map(num => +num + 1);
      
              return result[0] ?? "";
          }
          case 'string': {
              const escaped = e.replaceAll('\n', '\\n').trim();
              return `"${escaped}"`;
          }
          default: {
            return e;
          }
        }
      });

      return [...values, response.createdAt];
  });

  const output = mapped.map(row => row.join(', ')).join('\n');

  // const keys = ['1', '2', '3', '4', '5', '6', '7', '8'].map(e => `"${e}"`).join(', ');

  fs.writeFileSync('./output.csv', "\ufeff" + output)
}
 
try{
  main();
} catch(err) {
  console.log("Could not start server");
  console.log("Error :", err);
}