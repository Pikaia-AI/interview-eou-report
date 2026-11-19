'use client';

import { useEffect, useRef, useState } from 'react';

// The glass specimen occupies this band of the original artwork. Decorations
// elsewhere in the image stay photographic throughout the transition.
const outline = [[.07,.235],[.075,.18],[.13,.15],[.21,.15],[.20,.207],[.23,.226],[.29,.258],[.36,.268],[.43,.244],[.52,.223],[.57,.226],[.63,.25],[.69,.29],[.76,.365],[.82,.376],[.91,.367],[1,.36],[1,.411],[.93,.413],[.87,.46],[.80,.467],[.74,.447],[.68,.408],[.62,.37],[.57,.361],[.50,.357],[.43,.367],[.35,.384],[.27,.363],[.21,.332],[.17,.29],[.13,.26]];
const clamp = (x: number) => Math.max(0, Math.min(1, x));

function sampleArtwork(art: HTMLImageElement, coarse: boolean) {
  const w = 640, h = Math.round(w * art.naturalHeight / art.naturalWidth);
  const mask = document.createElement('canvas');
  mask.width = w; mask.height = h;
  const c = mask.getContext('2d', { willReadFrequently: true });
  if (!c) return;
  const path = new Path2D();
  outline.forEach(([x, y], i) => i ? path.lineTo(x*w, y*h) : path.moveTo(x*w, y*h)); path.closePath();
  c.save(); c.clip(path); c.drawImage(art, 0, 0, w, h); c.restore();
  const image = c.getImageData(0, 0, w, h), rgba = image.data;
  const dots = [];
  let seed = 41;
  const rand = () => ((seed = Math.imul(1664525, seed) + 1013904223 | 0) >>> 0) / 4294967296;
  const step = coarse ? 4 : 3;
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    const i=(y*w+x)*4, [r,g,b]=[rgba[i],rgba[i+1],rgba[i+2]], brightness=Math.max(r,g,b);
    if (!rgba[i+3]) continue;
    if (x%step===0 && y%step===0 && brightness>52) {
      const drift = rand(), offset = rand(), power = .35 + rand()*.65;
      dots.push({x:x/w,y:y/h, dx:(.032+.10*drift)*power, dy:(offset-.55)*.23*power,
        arc:(rand()-.5)*.065, size:.65+rand()*.8, color:`rgb(${Math.min(255,r+24)} ${Math.min(255,g+22)} ${Math.min(255,b+29)})`});
    }
    // Cover the lit pixels only; keep the surrounding black and glass shards intact.
    rgba[i]=8;rgba[i+1]=8;rgba[i+2]=11;rgba[i+3]=Math.round(rgba[i+3]*clamp((brightness-12)/44));
  }
  c.putImageData(image,0,0);
  return {mask,dots,path};
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toggle = useRef<()=>void>(()=>{});
  const [ready,setReady] = useState(false), [spread,setSpread] = useState(false);
  useEffect(()=>{
    const canvas=canvasRef.current, hero=canvas?.parentElement, art=hero?.querySelector<HTMLImageElement>('.hero-art');
    if (!canvas || !hero || !art) return;
    const ctx=canvas.getContext('2d'); if (!ctx) return;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup: (()=>void) | undefined;
    function setup() {
      cleanup?.(); cleanup=undefined; setReady(false); setSpread(false);
      if (!canvas || !ctx || !hero || !art || motion.matches || !art.complete || !art.naturalWidth) return;
      const field=sampleArtwork(art,matchMedia('(pointer:coarse)').matches);
      if (!field?.dots.length) return;
      const {mask,dots,path}=field;
      let frame=0, last=0, value=0, target=0, shown=true, hover=false, pinned=false;
      let width=0,height=0,left=0,top=0,aw=1,ah=1,scrollAmount=0,cursorX=.48,cursorY=.32;
      const clear=()=>ctx.clearRect(0,0,width,height);
      function draw() {
        clear(); if (value<.002) return;
        ctx!.globalAlpha=clamp(value*1.25); ctx!.drawImage(mask,left,top,aw,ah);
        ctx!.globalAlpha=clamp(value*3)*.95;
        for (const p of dots) {
          const d=Math.hypot((p.x-cursorX)*1.4,p.y-cursorY), near=clamp(1-d*2.7);
          const t=clamp(value*(.78+.22*near)), arc=Math.sin(t*Math.PI), envelope=.65+near;
          const px=left+(p.x+t*p.dx*envelope+(p.x-cursorX)*near*t*.17)*aw;
          const py=top+(p.y+t*p.dy*envelope+arc*p.arc+(p.y-cursorY)*near*t*.24)*ah;
          const size=p.size*Math.min(2,aw/640);
          ctx!.fillStyle=p.color; ctx!.fillRect(px,py,size,size);
        }
        ctx!.globalAlpha=1;
      }
      function tick(now:number) {
        frame=0;const dt=last?Math.min(48,now-last):16;last=now;
        value+=(target-value)*(1-Math.exp(-dt/(target>value?220:175)));
        if(Math.abs(target-value)<.0015) value=target;
        draw(); if(value!==target) schedule(); else last=0;
      }
      function schedule() {if(!frame && shown && !document.hidden) frame=requestAnimationFrame(tick);}
      function update() {target=pinned ? 1 : Math.max(scrollAmount,hover ? .73 : 0);schedule();}
      function onScroll() {
        const box=hero!.getBoundingClientRect();scrollAmount=clamp((-box.top/box.height-.035)/.48)*.88;update();
      }
      function resize() {
        const box=hero!.getBoundingClientRect(), img=art!.getBoundingClientRect(); width=box.width;height=box.height;
        const dpr=Math.min(window.devicePixelRatio||1,1.5);canvas!.width=Math.round(width*dpr);canvas!.height=Math.round(height*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0);
        const ratio=(getComputedStyle(art!).objectFit==='contain'?Math.min:Math.max)(img.width/art!.naturalWidth,img.height/art!.naturalHeight);
        aw=art!.naturalWidth*ratio;ah=art!.naturalHeight*ratio;
        left=img.left-box.left+(img.width-aw)/2;top=img.top-box.top+(img.height-ah)/2;onScroll();
      }
      function overBody(e: PointerEvent) {
        const box=hero!.getBoundingClientRect();const x=(e.clientX-box.left-left)/aw,y=(e.clientY-box.top-top)/ah;
        const inside=mask.getContext('2d')!.isPointInPath(path,x*mask.width,y*mask.height);
        if(inside){cursorX=x;cursorY=y;}return inside;
      }
      function move(e:PointerEvent) {if(e.pointerType==='touch' || pinned) return;const was=hover;hover=overBody(e);if(was||hover) update();}
      function leave(){if(hover){hover=false;update();}}
      toggle.current=()=>{pinned=!pinned;hover=false;setSpread(pinned);if(pinned) update();else{target=0;schedule();}};
      function visibility(){if(document.hidden || !shown){cancelAnimationFrame(frame);frame=0;last=0;}else update();}
      const observer=new IntersectionObserver(([entry])=>{shown=entry.isIntersecting;visibility();});observer.observe(hero);
      const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(hero);sizeObserver.observe(art);
      hero.addEventListener('pointermove',move);hero.addEventListener('pointerleave',leave);
      window.addEventListener('scroll',onScroll,{passive:true});document.addEventListener('visibilitychange',visibility);
      resize();setReady(true);
      cleanup=()=>{observer.disconnect();sizeObserver.disconnect();cancelAnimationFrame(frame);clear();toggle.current=()=>{};
        hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',leave);window.removeEventListener('scroll',onScroll);document.removeEventListener('visibilitychange',visibility);};
    }
    setup();art.addEventListener('load',setup);motion.addEventListener('change',setup);
    return ()=>{art.removeEventListener('load',setup);motion.removeEventListener('change',setup);cleanup?.();};
  },[]);
  return <><canvas ref={canvasRef} className="specimen-field" aria-hidden="true"/>
    <button type="button" className="specimen-control" hidden={!ready} onClick={()=>toggle.current()}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><circle cx="4" cy="10" r="1.7"/><circle cx="8" cy="6" r="1.4"/><circle cx="10" cy="12" r="1.2"/><circle cx="14" cy="4" r="1"/><circle cx="15" cy="9" r=".8"/></svg>
      {spread?'Reassemble specimen':'Disperse specimen'}
    </button></>;
}
