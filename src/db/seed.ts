import "dotenv/config";
import { db } from "./index";
import { services } from "./schema";
import { seedServices } from "./seed-data";

async function main() {
  console.log(`Seeding ${seedServices.length} catalog services...`);
  let inserted = 0;
  for (const [i, s] of seedServices.entries()) {
    const res = await db
      .insert(services)
      .values({ ...s, sortOrder: i })
      .onConflictDoNothing({ target: services.sku })
      .returning({ id: services.id });
    if (res.length) inserted++;
  }
  console.log(`Done. Inserted ${inserted} new services (skipped ${seedServices.length - inserted} existing).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
