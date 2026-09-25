import { buildCharacterSpec, type BuildSpecOptions, type BuildSpecResult } from "./buildCharacterSpec.js";

export async function ingestReference(options: BuildSpecOptions): Promise<BuildSpecResult> {
  if (!options.character) {
    throw new Error("Missing --character.");
  }
  if (!options.reference) {
    throw new Error("Missing --reference.");
  }
  return buildCharacterSpec(options);
}
