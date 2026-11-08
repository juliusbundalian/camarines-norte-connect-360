import {focusedFieldOffset} from '../focus-scroll';
it('reveals a field below a viewport reduced by the Android keyboard and footer',()=>{
 expect(focusedFieldOffset({inputY:590,inputHeight:56,viewportY:118,viewportHeight:408,scrollY:32})).toBe(168);
});
it('leaves visible fields alone and clamps topward scrolling',()=>{
 expect(focusedFieldOffset({inputY:200,inputHeight:56,viewportY:118,viewportHeight:408,scrollY:32})).toBeNull();
 expect(focusedFieldOffset({inputY:80,inputHeight:56,viewportY:118,viewportHeight:408,scrollY:32})).toBe(0);
});
