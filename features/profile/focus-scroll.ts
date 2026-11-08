/** Reveal the focused input inside the actual viewport, excluding fixed chrome. */
export function focusedFieldOffset({inputY,inputHeight,viewportY,viewportHeight,scrollY}:{inputY:number;inputHeight:number;viewportY:number;viewportHeight:number;scrollY:number}):number|null{
 const overflow=inputY+inputHeight-(viewportY+viewportHeight-16);
 if(overflow>0)return Math.max(0,scrollY+overflow);
 if(inputY<viewportY)return Math.max(0,scrollY+inputY-viewportY-16);
 return null;
}
