// Local playtest candidates; original Up-special assets remain preserved.
// Version query invalidates the presenter's force-cache after idle-scale calibration.
import special_up_medium_1 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/01.png?url';
import special_up_medium_2 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/02.png?url';
import special_up_medium_3 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/03.png?url';
import special_up_medium_4 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/04.png?url';
import special_up_medium_5 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/05.png?url';
import special_up_medium_6 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/06.png?url';
import special_up_medium_7 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/07.png?url';
import special_up_medium_8 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/08.png?url';
import special_up_medium_9 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/09.png?url';
import special_up_medium_10 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/10.png?url';
import special_up_medium_11 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/11.png?url';
import special_up_medium_12 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_medium/12.png?url';
import special_up_heavy_1 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/01.png?url';
import special_up_heavy_2 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/02.png?url';
import special_up_heavy_3 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/03.png?url';
import special_up_heavy_4 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/04.png?url';
import special_up_heavy_5 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/05.png?url';
import special_up_heavy_6 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/06.png?url';
import special_up_heavy_7 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/07.png?url';
import special_up_heavy_8 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/08.png?url';
import special_up_heavy_9 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/09.png?url';
import special_up_heavy_10 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/10.png?url';
import special_up_heavy_11 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/11.png?url';
import special_up_heavy_12 from '../../../../tools/nga-forge/production/characters/swahili/reviews/up-specials-redo-drafts-v1/runtime-v1/special_up_heavy/12.png?url';
export const upRedoFrames = {
  special_up_medium: [special_up_medium_1, special_up_medium_2, special_up_medium_3, special_up_medium_4, special_up_medium_5, special_up_medium_6, special_up_medium_7, special_up_medium_8, special_up_medium_9, special_up_medium_10, special_up_medium_11, special_up_medium_12],
  special_up_heavy: [special_up_heavy_1, special_up_heavy_2, special_up_heavy_3, special_up_heavy_4, special_up_heavy_5, special_up_heavy_6, special_up_heavy_7, special_up_heavy_8, special_up_heavy_9, special_up_heavy_10, special_up_heavy_11, special_up_heavy_12],
};
for (const frames of Object.values(upRedoFrames)) {
  for (let i = 0; i < frames.length; i++) frames[i] += `${frames[i].includes('?') ? '&' : '?'}up-redo-scale=2`;
}
