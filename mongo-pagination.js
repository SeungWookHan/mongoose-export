const mongoose = require("mongoose");
const Response = require("./response");
const fs = require("fs");

require("dotenv").config();

async function main() {
  // Connect to mongodb database
  const URI = process.env.DB_URI;
  const connection = await mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Successfully connected to mongodb");

  const pageSize = 20; // 페이지당 항목 수
  const excludeKeys = ["history", "query", "uuid"];
  let pageNumber = 1;

  const baseQuery = Response.find({ deployId: process.env.DEPLOY_ID }, "-_id");
  const count = await baseQuery.countDocuments();
  console.log(count);
  const totalPages = Math.ceil(count / pageSize);

  const outputFilePath = "./output.csv";

  while (pageNumber <= totalPages) {
    const skip = (pageNumber - 1) * pageSize;
    const query = Response.find({ deployId: process.env.DEPLOY_ID }, "-_id");
    const responses = await query.skip(skip).limit(pageSize).exec();
    // console.log(responses);

    const mapped = responses.map((response) => {
      const values = Object.entries(response?.responses || {})
        .filter(([key]) => !excludeKeys.includes(key))
        .map(([, value]) => value)
        .map((e) => {
          switch (typeof e) {
            case "object": {
              const keys = Object.keys(e);
              const result = keys.map((num) => +num + 1);

              return result[0] ?? "";
            }
            case "string": {
              const escaped = e.replaceAll("\n", "\\n").trim();
              return `"${escaped}"`;
            }
            default: {
              return e;
            }
          }
        });

      return [...values, response.createdAt];
    });

    const output = mapped.map((row) => row.join(", ")).join("\n");

    if (pageNumber === 1) {
      fs.writeFileSync(outputFilePath, "\ufeff" + output);
    } else {
      fs.appendFileSync(outputFilePath, "\n" + output);
    }

    pageNumber++;
  }

  console.log("CSV 파일이 생성되었습니다.");
}

try {
  main();
} catch (err) {
  console.log("Could not start server");
  console.log("Error :", err);
}
