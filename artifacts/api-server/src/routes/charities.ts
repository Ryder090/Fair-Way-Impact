import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { charitiesTable, usersTable } from "@workspace/db/schema";
import { eq, like, sql, or } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function formatCharity(c: any, subscriberCount: number = 0) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    websiteUrl: c.websiteUrl,
    isFeatured: c.isFeatured,
    isActive: c.isActive,
    totalContributions: parseFloat(c.totalContributions || "0"),
    subscriberCount,
    createdAt: c.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const { search, featured } = req.query;

    let charities = await db.select().from(charitiesTable);

    if (search) {
      const searchStr = `%${search}%`;
      charities = charities.filter(c =>
        c.name.toLowerCase().includes((search as string).toLowerCase()) ||
        c.description.toLowerCase().includes((search as string).toLowerCase())
      );
    }

    if (featured === "true") {
      charities = charities.filter(c => c.isFeatured);
    }

    // Get subscriber counts
    const allUsers = await db.select({ charityId: usersTable.charityId }).from(usersTable);
    const counts: Record<number, number> = {};
    for (const u of allUsers) {
      if (u.charityId) {
        counts[u.charityId] = (counts[u.charityId] || 0) + 1;
      }
    }

    return res.json(charities.map(c => formatCharity(c, counts[c.id] || 0)));
  } catch (err) {
    req.log.error({ err }, "Get charities error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:charityId", async (req, res) => {
  try {
    const charityId = parseInt(req.params.charityId);
    const [charity] = await db.select().from(charitiesTable).where(eq(charitiesTable.id, charityId)).limit(1);
    if (!charity) return res.status(404).json({ error: "Charity not found" });

    const allUsers = await db.select({ charityId: usersTable.charityId }).from(usersTable)
      .where(eq(usersTable.charityId, charityId));
    return res.json(formatCharity(charity, allUsers.length));
  } catch (err) {
    req.log.error({ err }, "Get charity error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl, websiteUrl, isFeatured = false, isActive = true } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required" });
    }

    const [charity] = await db.insert(charitiesTable).values({
      name,
      description,
      imageUrl,
      websiteUrl,
      isFeatured,
      isActive,
    }).returning();

    return res.status(201).json(formatCharity(charity, 0));
  } catch (err) {
    req.log.error({ err }, "Create charity error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:charityId", requireAdmin, async (req, res) => {
  try {
    const charityId = parseInt(req.params.charityId);
    const { name, description, imageUrl, websiteUrl, isFeatured, isActive } = req.body;

    const [charity] = await db.update(charitiesTable)
      .set({ name, description, imageUrl, websiteUrl, isFeatured, isActive, updatedAt: new Date() })
      .where(eq(charitiesTable.id, charityId))
      .returning();

    if (!charity) return res.status(404).json({ error: "Charity not found" });

    const users = await db.select({ charityId: usersTable.charityId }).from(usersTable)
      .where(eq(usersTable.charityId, charityId));

    return res.json(formatCharity(charity, users.length));
  } catch (err) {
    req.log.error({ err }, "Update charity error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:charityId", requireAdmin, async (req, res) => {
  try {
    const charityId = parseInt(req.params.charityId);
    await db.delete(charitiesTable).where(eq(charitiesTable.id, charityId));
    return res.json({ message: "Charity deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete charity error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
