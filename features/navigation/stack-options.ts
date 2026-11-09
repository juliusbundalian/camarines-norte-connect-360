/** Forward screens enter from the right; Back pops out toward the right.
 * dismissTo falls back to replace on a cold/deep link, so replacements pop too.
 */
export const stackOptions={headerShown:false,animation:'slide_from_right',animationTypeForReplace:'pop'} as const;
