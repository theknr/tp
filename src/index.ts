import express from "express";
import cors from "cors";
import router from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "https://tp-front-4bfb.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/auth", router);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
