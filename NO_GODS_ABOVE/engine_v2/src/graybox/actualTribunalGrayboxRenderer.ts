import { TribunalGrayboxRenderer, TribunalGrayboxRendererOptions } from "./tribunalGrayboxRenderer";
import { actualTribunalGrayboxV1Scene } from "./tribunalSceneConfig";

export const ACTUAL_TRIBUNAL_ARENA_ID = "the_last_tribunal" as const;
export const ACTUAL_TRIBUNAL_PRESENTATION_ID = "actual_graybox_v1" as const;

export class ActualTribunalGrayboxRenderer extends TribunalGrayboxRenderer {
  constructor(host: HTMLElement, options: TribunalGrayboxRendererOptions = {}) {
    super(host, { ...options, sceneConfig: actualTribunalGrayboxV1Scene });
    const identity = this.presentationIdentity();
    if (identity.arenaId !== ACTUAL_TRIBUNAL_ARENA_ID || identity.presentationId !== ACTUAL_TRIBUNAL_PRESENTATION_ID) {
      throw new Error("ACTUAL TRIBUNAL GRAYBOX LOAD ERROR: generic sandbox presentation was selected");
    }
  }
}
