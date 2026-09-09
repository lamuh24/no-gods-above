// Stateless presentation curve. The simulation alone decides charge/release.
export function crownBallGrowth(tick:number,start=66,release=166,min=24,max=240) {
  if(tick<start||tick>=release+8)return null;
  const released=tick>=release;
  const progress=Math.max(0,Math.min(1,(tick-start)/(release-start-1)));
  return {released,progress,diameter:released?max*(1-(tick-release)/8):min+(max-min)*Math.pow(progress,1.15),
    alpha:released?1-(tick-release)/8:1};
}
