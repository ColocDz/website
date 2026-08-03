import { auth } from "../lib/auth";

async function main() {
  console.log("Testing user creation via Better Auth with additional fields...");
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email: `testuser_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Morena",
        lastName: "AOUADI",
        phone: "0558137964",
        gender: "Female",
      }
    });
    console.log("Signup success! Created user:", res);
  } catch (err: any) {
    console.error("Signup failed:", err);
  }
}

main();
