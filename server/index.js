const express = require("express");
const cors = require("cors");
const app = express();
const pool = require("./db");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const generateAccessToken = require("./generateAccessToken");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const saltRounds = 10;
dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
function authorization(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.sendStatus(204);
  }
  try {
    const data = jwt.verify(token, process.env.TOKEN_SECRET);
    req.userId = data.id;
    req.username = data.username;
    req.role = data.role;
    return next();
  } catch {
    return res.sendStatus(403);
  }
}

app.post("/register", async (req, res) => {
  try {
    const username = req.body.username;
    const password = await bcrypt.hash(req.body.password, saltRounds);
    const email = req.body.email;
    pool.query(
      "INSERT INTO users (username,password,email) VALUES ($1,$2,$3)",
      [username, password, email],
      (err, result) => {
        if (err) {
          const { constraint } = err;
          if (constraint == "users_username_key")
            res
              .status(409)
              .send("Username already exists. Please choose another one");
          if (constraint == "users_email_key")
            res
              .status(409)
              .send("Account already exists for this email address");
        } else {
          res.status(201).send("Registration succesful");
        }
      }
    );
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
});
app.post("/login", (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    pool.query(
      "SELECT * FROM USERS WHERE username=$1",
      [username],
      (err, result) => {
        if (err) {
          res.status(400);
        } else {
          const { rowCount } = result;

          if (rowCount === 0) res.status(200).send("Username does not exist");
          else {
            const user = result.rows[0];
            bcrypt.compare(password, user.password, function (error, result) {
              if (error) {
                res.status(500).send("Unexpected error");
              }
              if (result) {
                console.log("login sucessful");
                const token = generateAccessToken(user);
                res.cookie("token", token, { maxage: 86400, httpOnly: true });
                res.status(200).json({ message: "Succesfully logged in !" });
              } else {
                console.log("Passwords do not match");
              }
            });
          }
        }
      }
    );
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
});
app.get("/logout", authorization, (req, res) => {
  return res
    .clearCookie("token")
    .status(200)
    .json({ message: "Successfully logged out !" });
});
app.get("/me", authorization, (req, res) => {
  try {
    return res.json({
      user: {
        id: req.userId,
        username: req.username,
        role: req.role,
      },
    });
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
});
app.get("/getProducts", (req, res) => {
  try {
    pool.query("SELECT * FROM PRODUCTS", (err, result) => {
      if (err) {
        res.status(400);
      } else {
        res.status(200).json(result.rows);
      }
    });
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
});
app.get("/getProduct/id=:id", (req, res) => {
  const id = req.params.id;
  try {
    pool.query("SELECT * FROM PRODUCTS WHERE id=$1", [id], (err, result) => {
      if (err) {
        res.status(400);
      } else res.status(200).json(result.rows[0]);
    });
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
});
app.get("/getCart", authorization, (req, res) => {
  try {
    pool.query(
      "SELECT * FROM CART WHERE id_user=$1",
      [req.userId],
      (err, result) => {
        if (err) {
          res.status(400);
        } else res.status(200).json(result.rows);
      }
    );
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
});
app.post("/insertCart", authorization, async (req, res) => {
  try {
    pool.query(
      "SELECT * FROM CART WHERE id_user=$1",
      [req.userId],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          const { rowCount } = result;
          if (rowCount === 0) {
            const product = JSON.stringify(new Array(req.body.product));
            console.log(product);
            pool.query(
              "INSERT INTO CART (id_user,products) VALUES ($1,$2)",
              [req.userId, product],
              (err, result) => {
                if (err) {
                  res.status(400);
                } else {
                  res.status(200).send("Inserted into cart");
                }
              }
            );
          } else {
            let cart = result.rows[0].products;
            let ok = 0;
            cart.map((product, index) => {
              if (product.id === req.body.product.id) {
                product.quantity += req.body.product.quantity;
                ok = 1;
                if (product.quantity < 1) {
                  cart.splice(index, 1);
                }
              }
            });
            if (ok === 0) {
              cart.push(req.body.product);
            }
            const final = JSON.stringify(cart);
            pool.query(
              "UPDATE CART SET products=$1 WHERE id_user=$2",
              [final, req.userId],
              (err, result) => {
                if (err) {
                  console.log(err);
                  res.status(400);
                } else {
                  res.status(200).send("Updated cart");
                }
              }
            );
          }
        }
      }
    );
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
});
app.listen(3001, () => {
  console.log("Server started");
});
