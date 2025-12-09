import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Load environment variables from .env file
dotenv.config();

const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Supabase credentials not found in environment variables.");
  console.error("Make sure your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateNodes() {
  try {
    console.log("Starting migration of cultural nodes from JSON to Supabase...\n");

    const jsonPath = path.join(__dirname, '..', 'src', 'data', 'culturalNodes.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const nodes = JSON.parse(fileContent);

    console.log(`Found ${nodes.length} nodes in culturalNodes.json\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const node of nodes) {
      const nodeData = {
        title: node.title,
        slug: node.slug,
        latitude: node.latitude,
        longitude: node.longitude,
        proximity_radius: node.proximityRadius,
        description: node.description,
        historical_period: node.historicalPeriod,
        category: node.category,
        audio_url: node.audioUrl,
        audio_duration: node.audioDuration,
        primary_image_url: node.primaryImageUrl,
        images: node.images || []
      };

      const { data, error } = await supabase
        .from('cultural_nodes')
        .insert([nodeData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`⚠️  Skipped "${node.title}" - already exists in database`);
        } else {
          errorCount++;
          errors.push({ title: node.title, error: error.message });
          console.error(`❌ Error inserting "${node.title}": ${error.message}`);
        }
      } else {
        successCount++;
        console.log(`✅ Successfully inserted "${node.title}"`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total nodes in JSON: ${nodes.length}`);
    console.log(`Successfully inserted: ${successCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log("=".repeat(60));

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((err) => {
        console.log(`  - ${err.title}: ${err.error}`);
      });
    }

    if (successCount > 0) {
      console.log("\n✨ Migration completed! Your cultural nodes are now in Supabase.");
    }

  } catch (error) {
    console.error("Fatal error during migration:", error.message);
    process.exit(1);
  }
}

migrateNodes();
