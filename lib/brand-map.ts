import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { cacheLife } from "next/cache";

const TABLE = "OutreachTarget-ahdfselsrvdixagb6g36du5iee-dev";
const CAMPAIGN_ID = "d4a7a14b-4127-44a0-827c-b9cbe6354487";
const INDEX = "outreachTargetsByCampaign";

export type BrandSite = {
  name: string;
  category: string;
};

export type BrandPlace = {
  id: string;
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  count: number;
  brands: BrandSite[];
};

const CATEGORY_ALIASES: Record<string, string> = {
  "food/bev": "Food & beverage",
  "food & beverage": "Food & beverage",
  cpg: "CPG",
  "consumer goods & retail": "CPG",
  industrial: "Industrial",
  retail: "Retail",
  auto: "Automotive",
  clothing: "Apparel",
  "healthcare/wellness": "Healthcare",
  "home applicances": "Home appliances",
  tobacco: "Tobacco",
  electronics: "Electronics",
  "chemical manufacturing": "Chemical",
  defense: "Defense",
  technology: "Technology",
  biotechnology: "Biotechnology",
};

type TargetItem = {
  kind?: string;
  name?: string;
  personCompany?: string;
  city?: string;
  region?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  archived?: boolean;
};

function brandLabel(item: TargetItem) {
  const raw = item.kind === "COMPANY" ? item.name : item.personCompany;
  return String(raw || "").trim();
}

function categoryLabel(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return CATEGORY_ALIASES[raw.toLowerCase()] || raw;
}

function groupPlaces(items: TargetItem[]): BrandPlace[] {
  const groups = new Map<string, BrandPlace & { seen: Set<string> }>();

  for (const item of items) {
    if (item.archived) continue;
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const id = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const place = groups.get(id) || {
      id,
      latitude,
      longitude,
      city: String(item.city || "").trim(),
      region: String(item.region || "").trim(),
      count: 0,
      brands: [],
      seen: new Set<string>(),
    };
    place.count += 1;
    const name = brandLabel(item);
    const key = name.toLowerCase();
    if (name && !place.seen.has(key)) {
      place.seen.add(key);
      place.brands.push({ name, category: categoryLabel(item.category) });
    }
    if (!place.city && item.city) place.city = String(item.city).trim();
    if (!place.region && item.region) place.region = String(item.region).trim();
    groups.set(id, place);
  }

  return [...groups.values()].map(({ seen: _seen, ...place }) => ({
    ...place,
    brands: place.brands.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export async function getBrandMap(): Promise<BrandPlace[]> {
  "use cache";
  cacheLife("minutes");

  const accessKeyId = process.env.MAP_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MAP_AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return [];

  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
    }),
  );

  try {
    const items: TargetItem[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const page = await client.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: INDEX,
          KeyConditionExpression: "campaignID = :id",
          ExpressionAttributeValues: { ":id": CAMPAIGN_ID },
          ProjectionExpression: "kind, #n, personCompany, city, #r, category, latitude, longitude, archived",
          ExpressionAttributeNames: { "#n": "name", "#r": "region" },
          ExclusiveStartKey,
        }),
      );
      items.push(...((page.Items || []) as TargetItem[]));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return groupPlaces(items);
  } catch (error) {
    console.error("SPS brand map failed", error instanceof Error ? error.message : error);
    return [];
  }
}
