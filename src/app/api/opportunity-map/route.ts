import { type NextRequest } from "next/server";
import { catalogFilters, getMapCities } from "@/lib/public-opportunities";

export async function GET(request: NextRequest) {
  return Response.json(
    await getMapCities(
      catalogFilters(Object.fromEntries(request.nextUrl.searchParams)),
    ),
  );
}
