/* Screen-space presentation only: no combat damage or meter side effects. */
window.drawPaidVerdict=function(ctx,ms){
 const clamp=v=>Math.max(0,Math.min(1,v));
 ctx.save();ctx.fillStyle='#030304';ctx.fillRect(0,0,1280,720);
 if(ms<170){ctx.restore();return;}
 const q=ms-170,slam=clamp(q/110),settle=Math.pow(1-slam,3);
 // An account rendered as a physical document, then struck out permanently.
 if(q<920){ctx.save();ctx.translate(640,360+settle*65);ctx.rotate(-.045);const scale=1+settle*.3;ctx.scale(scale,scale);
 ctx.globalAlpha=clamp(q/55)*(1-clamp((q-660)/260));ctx.fillStyle='#c1b393';ctx.beginPath();ctx.moveTo(-263,-228);ctx.lineTo(256,-228);ctx.lineTo(270,207);ctx.lineTo(232,218);ctx.lineTo(190,211);ctx.lineTo(137,228);ctx.lineTo(74,215);ctx.lineTo(15,227);ctx.lineTo(-48,212);ctx.lineTo(-130,227);ctx.lineTo(-205,214);ctx.lineTo(-269,220);ctx.closePath();ctx.fill();
 ctx.fillStyle='#27241e';ctx.textAlign='center';ctx.font='bold 23px Georgia';ctx.fillText('BINDING CONTRACT',0,-178);ctx.font='11px monospace';ctx.fillText('COLLECTION AUTHORITY  /  SWAHILI',0,-149);
 ctx.strokeStyle='#706651';ctx.lineWidth=1;for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(-212,-110+i*25);ctx.lineTo(210-(i%3)*29,-110+i*25);ctx.stroke();}
 ctx.strokeStyle='#632119';ctx.lineWidth=8;if(q>110){ctx.beginPath();ctx.moveTo(-235,110);ctx.lineTo(232,-60);ctx.stroke();ctx.beginPath();ctx.arc(0,28,103,0,Math.PI*2);ctx.stroke();ctx.font='bold 26px Georgia';ctx.fillStyle='#632119';ctx.fillText('DEBT COLLECTED',0,38);}ctx.restore();}
 if(q>110){const hit=q-110,impact=Math.pow(1-clamp(hit/85),3),fade=1-clamp((ms-1520)/340);
 ctx.save();ctx.globalAlpha=fade;ctx.translate(640+Math.sin(hit*.08)*impact*9,365);ctx.rotate(-.045);ctx.scale(1+impact*.18,1+impact*.18);
 // Brutal typography without a surrounding UI box. A black strike obliterates the contract.
 ctx.fillStyle='#080606';ctx.beginPath();ctx.moveTo(-605,-152);ctx.lineTo(610,-136);ctx.lineTo(595,162);ctx.lineTo(-610,148);ctx.closePath();ctx.fill();
 ctx.textAlign='center';ctx.fillStyle='#e4d4ad';ctx.font='900 137px Georgia';ctx.fillText('PAID IN FULL',0,36);
 ctx.strokeStyle='#a77a36';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-570,64);ctx.lineTo(575,49);ctx.stroke();
 ctx.fillStyle='#bc4b32';ctx.font='bold 19px monospace';ctx.fillText('NO APPEAL.  NO MERCY.',0,107);
 ctx.restore();
 ctx.save();ctx.globalAlpha=fade*(1-clamp(hit/750));ctx.fillStyle='#aa813f';for(let i=0;i<36;i++){const a=i*2.399,x=640+Math.cos(a)*(80+hit*.58),y=360+Math.sin(a)*(30+hit*.18);ctx.fillRect(x,y,2+i%4,1+i%2);}ctx.restore();}
 ctx.restore();
};
