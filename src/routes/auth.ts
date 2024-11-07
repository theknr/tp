import { Router, Request, Response, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import Parser from "rss-parser";

const prisma = new PrismaClient();
const router = Router();

const SECRET_KEY = process.env.SECRET_KEY as string;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY as string;

const registerHandler: RequestHandler = async (req: Request, res: Response) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "User already exists" });
  }
};

const loginHandler: RequestHandler = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
};

const weatherHandler: RequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    res.status(400).json({ error: "Latitude and longitude are required" });
    return;
  }

  try {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: "imperial",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
};

const rssHandler: RequestHandler = async (req: Request, res: Response) => {
  const parser = new Parser();
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "A valid RSS feed URL is required" });
    return;
  }

  try {
    const response = await axios.get(url, { responseType: "text" });
    const feed = await parser.parseString(response.data);

    const firstItem = feed.items[0];

    const itemData = {
      title: firstItem.title,
      link: firstItem.link,
      pubDate: firstItem.pubDate,
      contentSnippet: firstItem.contentSnippet,
    };

    res.json(itemData);
  } catch (error) {
    console.error("Error fetching or parsing RSS feed:", error);
    res.status(500).json({ error: "Failed to fetch or parse RSS feed" });
  }
};

const clothesHandler: RequestHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const response = await axios.get(
      "https://tboxapps.therapy-box.co.uk/hackathon/clothing-api.php?username=swapnil",
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching clothing data:", error);
    res.status(500).json({ error: "Failed to fetch clothing data" });
  }
};

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/weather", weatherHandler);
router.get("/news", rssHandler);
router.get("/clothes", clothesHandler);

export default router;
