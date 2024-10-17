const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

const pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "123456",
    database: "demo",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

app.use(
    cors({
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        exposedHeaders: ["Link"],
    }),
    express.json(),
    express.urlencoded({ extended: true }),

);

const PORT = 54188;

// 配置 Multer 存储引擎
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// 文件上传路由
app.post('/newsFile', upload.single('file'), (req, res) => {
    if (req.file) {
        const originalFilename = req.file.originalname;
        const tempFilePath = req.file.path;

        // 生成新的文件名
        const timestamp = Date.now().toString();
        const md5Hash = crypto.createHash('md5').update(originalFilename).digest('hex');
        const newFilename = `${timestamp}_${md5Hash}${path.extname(originalFilename)}`;

        const uploadPath = path.join(__dirname, 'uploads', newFilename);

        // 移动文件到新位置
        fs.rename(tempFilePath, uploadPath, (err) => {
            if (err) {
                console.error('Error renaming file:', err);
                res.status(500).send('上传错误');
            } else {
                const index = indexHex(`${timestamp}_${md5Hash}`)
                const newsData = {
                    data: req.query.data,
                    file: newFilename,
                    time: new Date(),
                    newsIndex: index,
                };
                addDataToTable("data", newsData, (error, insertResult) => {
                    if (error) {
                        console.error("Operation failed:", error);
                    } else {
                        console.log(newsData);
                        res.send('上传成功!');
                    }
                });
            }
        });
    } else {
        res.status(400).send('上传失败');
    }
});

app.get('/news', (req, res) => {
    const newsId = req.query.id;
    searchNewsId(newsId)
    .then((results) => {
      res.json(results[0]);
    })
    .catch((error) => {
      console.error(error);
    });
});
// 写入数据
function addDataToTable(tableName, newData, callback) {
    pool.query(
        `INSERT INTO ${tableName} SET ?`,
        newData,
        (error, results, fields) => {
            if (error) {
                console.error("Error inserting data:", error);
                callback(error, null);
            } else {
                console.log("Inserted new data:", results);
                callback(null, results);
            }
        }
    );
}
// 查询
function searchNewsId(searchString) {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT * FROM data WHERE newsIndex LIKE ?",
            [`${searchString}`],
            (error, results, fields) => {
                if (error) {
                    console.error("Error querying database:", error);
                    reject(error);
                } else {
                    resolve(results);
                }
            }
        );
    });
}
// 索引加密
function indexHex(text) {
    const hash = crypto.createHash('md5');
    hash.update(text);
    const hexHash = hash.digest('hex');
    return hexHash.substring(0, 16).toUpperCase();
  }
app.listen(PORT, () => {
    console.log(`原神……启动!!!!http://localhost:${PORT}`);
});
