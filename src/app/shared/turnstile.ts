import { Component, ElementRef, EventEmitter, Input, OnDestroy, AfterViewInit, Output, ViewChild, signal } from '@angular/core';

type TurnstileApi = {
  render(element:HTMLElement, options:Record<string,unknown>):string;
  reset(widgetId:string):void;
  remove(widgetId:string):void;
};
let pendingScript:Promise<TurnstileApi>|null=null;
function getApi():TurnstileApi|undefined {return (window as unknown as {turnstile?:TurnstileApi}).turnstile;}
function loadTurnstile():Promise<TurnstileApi>{
  const available=getApi(); if(available)return Promise.resolve(available);
  if(pendingScript)return pendingScript;
  pendingScript=new Promise<TurnstileApi>((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.defer=true;
    script.onload=()=>{const api=getApi();api?resolve(api):reject(Error('Turnstile non caricato'));};
    script.onerror=()=>reject(Error('Turnstile non raggiungibile'));
    document.head.appendChild(script);
  }).catch(error=>{pendingScript=null;throw error;});
  return pendingScript;
}

@Component({
  selector:'app-turnstile',
  standalone:true,
  styles:['.turnstile-box { margin:16px 0 10px; min-height:65px; }'],
  template:`<div class="turnstile-box"><div #mount></div>
    @if (failed()) {<p class="form-error" role="alert">Controllo anti-bot non disponibile. Ricarica la pagina e riprova.</p>}
  </div>`,
})
export class TurnstileComponent implements AfterViewInit, OnDestroy {
  @Input({required:true}) siteKey!:string;
  @Input({required:true}) action!:'register'|'recover';
  @Output() tokenChange=new EventEmitter<string>();
  @ViewChild('mount',{static:true}) mount!:ElementRef<HTMLElement>;
  protected readonly failed=signal(false);
  private widgetId:string|null=null;
  private api:TurnstileApi|null=null;
  private destroyed=false;
  async ngAfterViewInit():Promise<void>{
    try {
      const api=await loadTurnstile();
      if(this.destroyed)return;
      this.api=api;
      this.widgetId=api.render(this.mount.nativeElement,{
        sitekey:this.siteKey,
        action:this.action,
        theme:'dark',
        callback:(token:string)=>{this.failed.set(false);this.tokenChange.emit(token);},
        'expired-callback':()=>this.tokenChange.emit(''),
        'error-callback':()=>{this.failed.set(true);this.tokenChange.emit('');},
      });
    } catch {if(!this.destroyed){this.failed.set(true);this.tokenChange.emit('');}}
  }
  reset():void{
    this.tokenChange.emit('');
    if(this.api&&this.widgetId!==null){try{this.api.reset(this.widgetId);}catch{this.failed.set(true);}}
  }
  ngOnDestroy():void{
    this.destroyed=true;
    if(this.api&&this.widgetId!==null){try{this.api.remove(this.widgetId);}catch{/* already disposed */}}
  }
}