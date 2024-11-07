import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../app";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("should register a new user", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "admin",
      email: "admin@test.com",
      password: "SuperSecretPassword123",
      confirmPassword: "SuperSecretPassword123",
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.username).toBe("admin");
  });

  it("should fail if passwords do not match", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "customer",
      email: "customer@test.com",
      password: "1234",
      confirmPassword: "1432",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Passwords do not match" });
  });

  it("should fail if the user already exists", async () => {
    await request(app).post("/auth/register").send({
      username: "admin",
      email: "admin@test.com",
      password: "SuperSecretPassword123",
      confirmPassword: "SuperSecretPassword123",
    });

    const response = await request(app).post("/auth/register").send({
      username: "admin",
      email: "admin@test.com",
      password: "SuperSecretPassword123",
      confirmPassword: "SuperSecretPassword123",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "User already exists" });
  });
});
