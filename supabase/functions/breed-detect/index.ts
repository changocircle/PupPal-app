/**
 * breed-detect — Supabase Edge Function
 *
 * Accepts a base64 image, sends to Google Cloud Vision,
 * and returns top 3 breed predictions with confidence.
 *
 * PRD-01 Screen 3: Photo Upload + Breed Detection
 *
 * Required secret: GOOGLE_CLOUD_VISION_KEY
 * Set in: Supabase Dashboard → Edge Functions → Secrets
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// ─── Known dog breeds (AKC + common mixes) ───

const DOG_BREEDS: string[] = [
  "Affenpinscher","Afghan Hound","Airedale Terrier","Akita","Alaskan Malamute",
  "American Bulldog","American Cocker Spaniel","American English Coonhound",
  "American Eskimo Dog","American Foxhound","American Pit Bull Terrier",
  "American Staffordshire Terrier","American Water Spaniel","Anatolian Shepherd Dog",
  "Australian Cattle Dog","Australian Shepherd","Australian Terrier",
  "Basenji","Basset Hound","Beagle","Bearded Collie","Beauceron",
  "Bedlington Terrier","Belgian Malinois","Belgian Sheepdog","Belgian Tervuren",
  "Bernese Mountain Dog","Bichon Frise","Black and Tan Coonhound",
  "Black Russian Terrier","Bloodhound","Blue Heeler","Bluetick Coonhound",
  "Border Collie","Border Terrier","Borzoi","Boston Terrier",
  "Bouvier des Flandres","Boxer","Boykin Spaniel","Briard",
  "Brittany","Brittany Spaniel","Brussels Griffon","Bull Terrier",
  "Bulldog","Bullmastiff","Cairn Terrier","Canaan Dog",
  "Cane Corso","Cardigan Welsh Corgi","Cavalier King Charles Spaniel",
  "Chesapeake Bay Retriever","Chihuahua","Chinese Crested","Chinese Shar-Pei",
  "Chinook","Chow Chow","Clumber Spaniel","Cockapoo","Cocker Spaniel",
  "Collie","Corgi","Coton de Tulear","Dachshund","Dalmatian",
  "Dandie Dinmont Terrier","Doberman Pinscher","Dogo Argentino",
  "Dogue de Bordeaux","Dutch Shepherd","English Bulldog","English Cocker Spaniel",
  "English Foxhound","English Setter","English Springer Spaniel",
  "English Toy Spaniel","Entlebucher Mountain Dog","Field Spaniel",
  "Finnish Lapphund","Finnish Spitz","Flat-Coated Retriever",
  "French Bulldog","German Pinscher","German Shepherd","German Shorthaired Pointer",
  "German Wirehaired Pointer","Giant Schnauzer","Glen of Imaal Terrier",
  "Goldador","Golden Retriever","Goldendoodle","Gordon Setter",
  "Great Dane","Great Pyrenees","Greater Swiss Mountain Dog","Greyhound",
  "Harrier","Havanese","Ibizan Hound","Icelandic Sheepdog",
  "Irish Red and White Setter","Irish Setter","Irish Terrier",
  "Irish Water Spaniel","Irish Wolfhound","Italian Greyhound",
  "Jack Russell Terrier","Japanese Chin","Japanese Spitz","Keeshond",
  "Kerry Blue Terrier","Komondor","Kuvasz","Labradoodle",
  "Labrador Retriever","Lagotto Romagnolo","Lakeland Terrier",
  "Lancashire Heeler","Leonberger","Lhasa Apso","Lowchen",
  "Maltese","Maltipoo","Manchester Terrier","Maremma Sheepdog",
  "Mastiff","Miniature American Shepherd","Miniature Bull Terrier",
  "Miniature Pinscher","Miniature Poodle","Miniature Schnauzer",
  "Morkie","Mudi","Neapolitan Mastiff","Newfoundland",
  "Norfolk Terrier","Norwegian Buhund","Norwegian Elkhound",
  "Norwegian Lundehund","Norwich Terrier","Nova Scotia Duck Tolling Retriever",
  "Old English Sheepdog","Otterhound","Papillon","Peekapoo",
  "Pekingese","Pembroke Welsh Corgi","Petit Basset Griffon Vendeen",
  "Pharaoh Hound","Plott Hound","Pointer","Pomapoo","Pomeranian",
  "Pomsky","Poodle","Portugese Water Dog","Portuguese Water Dog","Pug",
  "Puggle","Puli","Pumi","Pyrenean Shepherd",
  "Rat Terrier","Redbone Coonhound","Rhodesian Ridgeback",
  "Rottweiler","Russell Terrier","Saint Bernard","Saluki",
  "Samoyed","Schipperke","Schnoodle","Scottish Deerhound",
  "Scottish Terrier","Sealyham Terrier","Shetland Sheepdog","Shiba Inu",
  "Shih Tzu","Shih-Poo","Siberian Husky","Silky Terrier",
  "Skye Terrier","Sloughi","Smooth Fox Terrier","Soft Coated Wheaten Terrier",
  "Spanish Water Dog","Spinone Italiano","Staffordshire Bull Terrier",
  "Standard Poodle","Standard Schnauzer","Sussex Spaniel",
  "Swedish Vallhund","Tibetan Mastiff","Tibetan Spaniel","Tibetan Terrier",
  "Toy Fox Terrier","Toy Poodle","Treeing Walker Coonhound",
  "Vizsla","Weimaraner","Welsh Springer Spaniel","Welsh Terrier",
  "West Highland White Terrier","Westie","Whippet",
  "Wire Fox Terrier","Wirehaired Pointing Griffon","Wirehaired Vizsla",
  "Xoloitzcuintli","Yorkie","Yorkshire Terrier","Yorkipoo",
];

// Pre-compute lowercase lookup map for fuzzy matching
const BREED_LOOKUP = new Map<string, string>();
for (const breed of DOG_BREEDS) {
  BREED_LOOKUP.set(breed.toLowerCase(), breed);
  // Also index without common suffixes for partial matching
  const simplified = breed
    .toLowerCase()
    .replace(/ (terrier|spaniel|hound|retriever|shepherd|setter|pointer|pinscher|sheepdog|schnauzer|poodle|bulldog|collie|corgi)$/, "");
  if (simplified !== breed.toLowerCase()) {
    BREED_LOOKUP.set(simplified, breed);
  }
}

interface VisionLabel {
  description: string;
  score: number;
  topicality: number;
}

interface BreedResult {
  name: string;
  confidence: number;
}

/**
 * Match a Vision API label to a known breed.
 * Returns the canonical breed name or null.
 */
function matchBreed(label: string): string | null {
  const lower = label.toLowerCase().trim();

  // Direct match
  if (BREED_LOOKUP.has(lower)) return BREED_LOOKUP.get(lower)!;

  // Check if any known breed is contained within the label
  for (const [key, canonical] of BREED_LOOKUP) {
    if (lower.includes(key) || key.includes(lower)) {
      return canonical;
    }
  }

  return null;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_KEY");
    if (!apiKey) {
      console.error("GOOGLE_CLOUD_VISION_KEY not set");
      return new Response(
        JSON.stringify({ breeds: [], rawLabels: [], error: "Service not configured" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(
        JSON.stringify({ breeds: [], rawLabels: [], error: "Missing image field" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Strip data URI prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Call Google Cloud Vision API
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const visionBody = {
      requests: [
        {
          image: { content: base64Data },
          features: [
            { type: "LABEL_DETECTION", maxResults: 20 },
            { type: "WEB_DETECTION", maxResults: 10 },
          ],
        },
      ],
    };

    const visionRes = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visionBody),
    });

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      console.error("Vision API error:", visionRes.status, errText);
      return new Response(
        JSON.stringify({ breeds: [], rawLabels: [], error: "Vision API error" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const visionData = await visionRes.json();
    const response = visionData.responses?.[0];

    // Collect labels from both LABEL_DETECTION and WEB_DETECTION
    const labelAnnotations: VisionLabel[] = response?.labelAnnotations ?? [];
    const webEntities = (response?.webDetection?.webEntities ?? []).map(
      (e: { description?: string; score?: number }) => ({
        description: e.description ?? "",
        score: e.score ?? 0,
        topicality: 0,
      }),
    );

    const allLabels = [...labelAnnotations, ...webEntities];
    const rawLabels = allLabels.map((l) => l.description).filter(Boolean);

    // Match labels against known breeds, deduplicate, take best confidence
    const breedMap = new Map<string, number>();
    for (const label of allLabels) {
      if (!label.description) continue;
      const breed = matchBreed(label.description);
      if (breed) {
        const confidence = Math.round((label.score ?? 0) * 100);
        const existing = breedMap.get(breed) ?? 0;
        if (confidence > existing) {
          breedMap.set(breed, confidence);
        }
      }
    }

    // Filter out generic "Dog" labels and sort by confidence
    const breeds: BreedResult[] = Array.from(breedMap.entries())
      .map(([name, confidence]) => ({ name, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    return new Response(
      JSON.stringify({ breeds, rawLabels }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("breed-detect error:", err);
    return new Response(
      JSON.stringify({ breeds: [], rawLabels: [], error: "Internal error" }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
